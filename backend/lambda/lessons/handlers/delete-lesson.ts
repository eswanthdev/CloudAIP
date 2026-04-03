import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

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

export const deleteLesson = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const lessonId = event.pathParameters?.lessonId;
  if (!lessonId) {
    return error(400, 'Lesson ID is required');
  }

  // Find the lesson to get its keys
  const existingLesson = await findLessonById(lessonId);
  if (!existingLesson) {
    return error(404, 'Lesson not found');
  }

  const { moduleId, courseId, order } = existingLesson;
  const paddedOrder = String(order).padStart(3, '0');

  // Delete BOTH copies
  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [MAIN_TABLE]: [
          {
            DeleteRequest: {
              Key: {
                pk: `MODULE#${moduleId}`,
                sk: `LESSON#${paddedOrder}#${lessonId}`,
              },
            },
          },
          {
            DeleteRequest: {
              Key: {
                pk: `COURSE#${courseId}`,
                sk: `LESSON#${moduleId}#${paddedOrder}#${lessonId}`,
              },
            },
          },
        ],
      },
    })
  );

  // Decrement lesson counts
  const now = new Date().toISOString();

  // Find the module's SK to update its lessonCount
  const moduleResult = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      FilterExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':pk': `COURSE#${courseId}`,
        ':skPrefix': 'MODULE#',
        ':moduleId': moduleId,
      },
      Limit: 1,
    })
  );

  const updatePromises: Promise<any>[] = [
    // Decrement course lesson count
    docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
        UpdateExpression: 'SET lessonCount = lessonCount - :one, updatedAt = :now',
        ExpressionAttributeValues: { ':one': 1, ':now': now },
      })
    ),
  ];

  // Decrement module lesson count if we found the module
  if (moduleResult.Items && moduleResult.Items.length > 0) {
    const moduleSk = moduleResult.Items[0].sk;
    updatePromises.push(
      docClient.send(
        new UpdateCommand({
          TableName: MAIN_TABLE,
          Key: { pk: `COURSE#${courseId}`, sk: moduleSk },
          UpdateExpression: 'SET lessonCount = lessonCount - :one, updatedAt = :now',
          ExpressionAttributeValues: { ':one': 1, ':now': now },
        })
      )
    );
  }

  await Promise.all(updatePromises);

  return success(200, { message: 'Lesson deleted successfully' });
};
