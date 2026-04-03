import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const createModuleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
});

function padOrder(order: number): string {
  return String(order).padStart(3, '0');
}

export const createModule = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const courseId = event.pathParameters?.courseId;
  if (!courseId) {
    return error(400, 'Course ID is required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createModuleSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const data = validation.data;
  const moduleId = randomUUID();
  const now = new Date().toISOString();

  // Query existing modules for this course to determine next order number
  const existingModules = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `COURSE#${courseId}`,
        ':skPrefix': 'MODULE#',
      },
      Select: 'COUNT',
    })
  );

  const nextOrder = (existingModules.Count || 0) + 1;
  const paddedOrder = padOrder(nextOrder);

  const moduleItem = {
    pk: `COURSE#${courseId}`,
    sk: `MODULE#${paddedOrder}#${moduleId}`,
    moduleId,
    courseId,
    title: data.title,
    description: data.description || null,
    order: nextOrder,
    lessonCount: 0,
    duration: 0,
    entityType: 'MODULE',
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: MAIN_TABLE,
      Item: moduleItem,
    })
  );

  // Increment module count on the course
  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
      UpdateExpression: 'SET moduleCount = if_not_exists(moduleCount, :zero) + :one, updatedAt = :now',
      ExpressionAttributeValues: {
        ':zero': 0,
        ':one': 1,
        ':now': now,
      },
    })
  );

  return success(201, { module: moduleItem });
};
