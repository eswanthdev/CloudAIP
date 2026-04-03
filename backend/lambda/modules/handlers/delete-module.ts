import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

const BATCH_SIZE = 25;

async function findModuleById(moduleId: string): Promise<Record<string, any> | null> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      FilterExpression: 'moduleId = :moduleId',
      ExpressionAttributeValues: {
        ':entityType': 'MODULE',
        ':moduleId': moduleId,
      },
      Limit: 1,
    })
  );
  return result.Items?.[0] || null;
}

async function batchDelete(items: Array<{ pk: string; sk: string }>): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const deleteRequests = batch.map((item) => ({
      DeleteRequest: {
        Key: { pk: item.pk, sk: item.sk },
      },
    }));

    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [MAIN_TABLE]: deleteRequests,
        },
      })
    );
  }
}

export const deleteModule = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const moduleId = event.pathParameters?.moduleId;
  if (!moduleId) {
    return error(400, 'Module ID is required');
  }

  // Find the module
  const existingModule = await findModuleById(moduleId);
  if (!existingModule) {
    return error(404, 'Module not found');
  }

  const courseId = existingModule.courseId;
  const allItemsToDelete: Array<{ pk: string; sk: string }> = [];

  // 1. Add the module item itself
  allItemsToDelete.push({ pk: existingModule.pk, sk: existingModule.sk });

  // 2. Query and collect all lesson items under MODULE#{moduleId}
  let lastKey: Record<string, any> | undefined;
  let lessonCount = 0;
  do {
    const lessonResult = await docClient.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `MODULE#${moduleId}`,
          ':skPrefix': 'LESSON#',
        },
        ProjectionExpression: 'pk, sk',
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of lessonResult.Items || []) {
      allItemsToDelete.push({ pk: item.pk, sk: item.sk });
      lessonCount++;
    }

    lastKey = lessonResult.LastEvaluatedKey;
  } while (lastKey);

  // 3. Query and collect lesson items under COURSE#{courseId} that belong to this module
  // SK format: LESSON#{moduleId}#{order}#{lessonId}
  let courseLastKey: Record<string, any> | undefined;
  do {
    const courseLessonResult = await docClient.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `COURSE#${courseId}`,
          ':skPrefix': `LESSON#${moduleId}#`,
        },
        ProjectionExpression: 'pk, sk',
        ExclusiveStartKey: courseLastKey,
      })
    );

    for (const item of courseLessonResult.Items || []) {
      allItemsToDelete.push({ pk: item.pk, sk: item.sk });
    }

    courseLastKey = courseLessonResult.LastEvaluatedKey;
  } while (courseLastKey);

  // 4. Batch delete all items
  await batchDelete(allItemsToDelete);

  // 5. Decrement module and lesson counts on the course
  const now = new Date().toISOString();
  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
      UpdateExpression: 'SET moduleCount = moduleCount - :one, lessonCount = lessonCount - :lessonCount, updatedAt = :now',
      ExpressionAttributeValues: {
        ':one': 1,
        ':lessonCount': lessonCount,
        ':now': now,
      },
    })
  );

  return success(200, {
    message: 'Module and associated lessons deleted',
    deletedItemCount: allItemsToDelete.length,
  });
};
