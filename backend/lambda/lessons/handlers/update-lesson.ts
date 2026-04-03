import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const ALLOWED_FIELDS = [
  'title', 'description', 'type', 'duration',
  'videoKey', 'content', 'resources', 'isFree',
] as const;

async function findLessonById(lessonId: string): Promise<Record<string, any> | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: 'lessonId = :lessonId',
      ExpressionAttributeValues: {
        ':entityType': 'LESSON',
        ':lessonId': lessonId,
      },
      Limit: 1,
    })
  );
  return result.Items?.[0] || null;
}

export const updateLesson = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const lessonId = event.pathParameters?.lessonId;
  if (!lessonId) {
    return error(400, 'Lesson ID is required');
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  // Find the existing lesson to get moduleId and courseId
  const existingLesson = await findLessonById(lessonId);
  if (!existingLesson) {
    return error(404, 'Lesson not found');
  }

  const { moduleId, courseId, order } = existingLesson;
  const paddedOrder = String(order).padStart(3, '0');

  // Build dynamic update expression
  const updateParts: string[] = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      exprAttrNames[`#${field}`] = field;
      exprAttrValues[`:${field}`] = body[field];
    }
  }

  if (updateParts.length === 0) {
    return error(400, 'No valid fields to update');
  }

  const now = new Date().toISOString();
  updateParts.push('#updatedAt = :updatedAt');
  exprAttrNames['#updatedAt'] = 'updatedAt';
  exprAttrValues[':updatedAt'] = now;

  const updateExpression = `SET ${updateParts.join(', ')}`;

  // Update BOTH copies of the lesson item
  const [moduleResult] = await Promise.all([
    docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: {
          pk: `MODULE#${moduleId}`,
          sk: `LESSON#${paddedOrder}#${lessonId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: 'ALL_NEW',
      })
    ),
    docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: {
          pk: `COURSE#${courseId}`,
          sk: `LESSON#${moduleId}#${paddedOrder}#${lessonId}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
      })
    ),
  ]);

  return success(200, { lesson: moduleResult.Attributes });
};
