import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const ALLOWED_FIELDS = [
  'title', 'subtitle', 'description', 'shortDescription',
  'category', 'difficulty', 'price', 'currency',
  'thumbnailUrl', 'previewVideoUrl', 'duration',
  'isPublished', 'isFeatured', 'tags', 'prerequisites',
  'learningOutcomes', 'instructorId', 'instructorName',
] as const;

export const updateCourse = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const courseId = event.pathParameters?.courseId;
  if (!courseId) {
    return error(400, 'Course ID is required');
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

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

  // Always update updatedAt
  updateParts.push('#updatedAt = :updatedAt');
  exprAttrNames['#updatedAt'] = 'updatedAt';
  exprAttrValues[':updatedAt'] = new Date().toISOString();

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
        UpdateExpression: `SET ${updateParts.join(', ')}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      })
    );

    return success(200, { course: result.Attributes });
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error(404, 'Course not found');
    }
    throw err;
  }
};
