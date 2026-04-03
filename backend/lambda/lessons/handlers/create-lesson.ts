import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { QueryCommand, BatchWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['video', 'text', 'quiz', 'assignment', 'lab']).default('video'),
  duration: z.number().min(0).optional().default(0),
  videoKey: z.string().max(500).optional(),
  content: z.string().max(50000).optional(),
  resources: z.array(z.object({
    title: z.string().max(200),
    url: z.string().url(),
    type: z.string().max(50).optional(),
  })).max(20).optional().default([]),
  isFree: z.boolean().optional().default(false),
});

function padOrder(order: number): string {
  return String(order).padStart(3, '0');
}

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

export const createLesson = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const moduleId = event.pathParameters?.moduleId;
  if (!moduleId) {
    return error(400, 'Module ID is required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = createLessonSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  // Get the module to find courseId
  const module = await findModuleById(moduleId);
  if (!module) {
    return error(404, 'Module not found');
  }

  const courseId = module.courseId;
  const data = validation.data;
  const lessonId = randomUUID();
  const now = new Date().toISOString();

  // Query existing lessons under this module for order
  const existingLessons = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `MODULE#${moduleId}`,
        ':skPrefix': 'LESSON#',
      },
      Select: 'COUNT',
    })
  );

  const nextOrder = (existingLessons.Count || 0) + 1;
  const paddedOrder = padOrder(nextOrder);

  const lessonBaseFields = {
    lessonId,
    moduleId,
    courseId,
    title: data.title,
    description: data.description || null,
    type: data.type,
    duration: data.duration,
    videoKey: data.videoKey || null,
    content: data.content || null,
    resources: data.resources,
    isFree: data.isFree,
    order: nextOrder,
    entityType: 'LESSON',
    createdAt: now,
    updatedAt: now,
  };

  // Write TWO items:
  // 1. PK=MODULE#{moduleId}, SK=LESSON#{order}#{lessonId} (for module-level queries)
  // 2. PK=COURSE#{courseId}, SK=LESSON#{moduleId}#{order}#{lessonId} (for course-level queries)
  const moduleLessonItem = {
    pk: `MODULE#${moduleId}`,
    sk: `LESSON#${paddedOrder}#${lessonId}`,
    ...lessonBaseFields,
  };

  const courseLessonItem = {
    pk: `COURSE#${courseId}`,
    sk: `LESSON#${moduleId}#${paddedOrder}#${lessonId}`,
    ...lessonBaseFields,
  };

  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [MAIN_TABLE]: [
          { PutRequest: { Item: moduleLessonItem } },
          { PutRequest: { Item: courseLessonItem } },
        ],
      },
    })
  );

  // Increment lesson counts on module and course
  await Promise.all([
    docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: module.sk },
        UpdateExpression: 'SET lessonCount = if_not_exists(lessonCount, :zero) + :one, updatedAt = :now',
        ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':now': now },
      })
    ),
    docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
        UpdateExpression: 'SET lessonCount = if_not_exists(lessonCount, :zero) + :one, updatedAt = :now',
        ExpressionAttributeValues: { ':zero': 0, ':one': 1, ':now': now },
      })
    ),
  ]);

  return success(201, { lesson: moduleLessonItem });
};
