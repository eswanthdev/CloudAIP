import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const BATCH_SIZE = 25;

async function batchDelete(items: Array<{ pk: string; sk: string }>): Promise<void> {
  // Process in batches of 25 (DynamoDB BatchWrite limit)
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

export const deleteCourse = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const courseId = event.pathParameters?.courseId;
  if (!courseId) {
    return error(400, 'Course ID is required');
  }

  // Step 1: Query ALL items with PK=COURSE#{courseId}
  // This gets: METADATA, MODULE#...#..., LESSON#...#...#...
  const allItemsToDelete: Array<{ pk: string; sk: string }> = [];
  const moduleIds: string[] = [];

  let lastKey: Record<string, any> | undefined;
  do {
    const courseResult = await docClient.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': `COURSE#${courseId}` },
        ProjectionExpression: 'pk, sk',
        ExclusiveStartKey: lastKey,
      })
    );

    for (const item of courseResult.Items || []) {
      allItemsToDelete.push({ pk: item.pk, sk: item.sk });

      // Collect module IDs for querying module-level lesson items
      const sk = item.sk as string;
      if (sk.startsWith('MODULE#')) {
        const parts = sk.replace('MODULE#', '').split('#');
        if (parts[1]) {
          moduleIds.push(parts[1]);
        }
      }
    }

    lastKey = courseResult.LastEvaluatedKey;
  } while (lastKey);

  if (allItemsToDelete.length === 0) {
    return error(404, 'Course not found');
  }

  // Step 2: For each module, query MODULE#{moduleId} to get lesson items stored there
  for (const moduleId of moduleIds) {
    let moduleLessonLastKey: Record<string, any> | undefined;
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
          ExclusiveStartKey: moduleLessonLastKey,
        })
      );

      for (const item of lessonResult.Items || []) {
        allItemsToDelete.push({ pk: item.pk, sk: item.sk });
      }

      moduleLessonLastKey = lessonResult.LastEvaluatedKey;
    } while (moduleLessonLastKey);
  }

  // Step 3: Batch delete all items
  await batchDelete(allItemsToDelete);

  return success(200, {
    message: 'Course and all associated modules and lessons deleted',
    deletedItemCount: allItemsToDelete.length,
  });
};
