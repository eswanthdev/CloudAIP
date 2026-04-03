import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const progressSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
  lessonId: z.string().min(1, 'lessonId is required'),
  isCompleted: z.boolean().optional().default(false),
  watchedSeconds: z.number().min(0).optional().default(0),
});

export const updateProgress = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = progressSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const { courseId, lessonId, isCompleted, watchedSeconds } = validation.data;

  // Verify enrollment exists
  const enrollmentResult = await docClient.send(
    new GetCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: `USER#${user.userId}`, sk: `ENROLL#${courseId}` },
    })
  );

  if (!enrollmentResult.Item) {
    return error(403, 'Not enrolled in this course');
  }

  const now = new Date().toISOString();

  const progressItem: Record<string, any> = {
    pk: `USER#${user.userId}`,
    sk: `PROGRESS#${courseId}#${lessonId}`,
    userId: user.userId,
    courseId,
    lessonId,
    isCompleted,
    watchedSeconds,
    lastAccessedAt: now,
    updatedAt: now,
    entityType: 'PROGRESS',
    progressUserKey: `PROGRESS#USER#${user.userId}`,
    progressCourseKey: `COURSE#${courseId}`,
  };

  if (isCompleted) {
    progressItem.completedAt = now;
  }

  // Upsert progress record
  await docClient.send(
    new PutCommand({
      TableName: ACTIVITY_TABLE,
      Item: progressItem,
    })
  );

  // Check if all lessons for the course are completed
  if (isCompleted) {
    try {
      // Get total lesson count from MainTable
      const totalLessonsResult = await docClient.send(
        new QueryCommand({
          TableName: MAIN_TABLE,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
          ExpressionAttributeValues: {
            ':pk': `COURSE#${courseId}`,
            ':skPrefix': 'LESSON#',
          },
          Select: 'COUNT',
        })
      );

      const totalLessons = totalLessonsResult.Count || 0;

      // Get completed lesson count from ActivityTable
      const completedResult = await docClient.send(
        new QueryCommand({
          TableName: ACTIVITY_TABLE,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
          FilterExpression: 'isCompleted = :isTrue',
          ExpressionAttributeValues: {
            ':pk': `USER#${user.userId}`,
            ':skPrefix': `PROGRESS#${courseId}#`,
            ':isTrue': true,
          },
        })
      );

      const completedLessons = completedResult.Count || 0;

      // If all lessons completed, update enrollment status
      if (totalLessons > 0 && completedLessons >= totalLessons) {
        await docClient.send(
          new UpdateCommand({
            TableName: ACTIVITY_TABLE,
            Key: { pk: `USER#${user.userId}`, sk: `ENROLL#${courseId}` },
            UpdateExpression: 'SET #status = :status, enrollStatusKey = :esk, completedAt = :now, updatedAt = :now',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
              ':status': 'completed',
              ':esk': 'ENROLL#STATUS#completed',
              ':now': now,
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed to check/update course completion:', err);
    }
  }

  return success(200, {
    progress: {
      courseId,
      lessonId,
      isCompleted,
      watchedSeconds,
      lastAccessedAt: now,
    },
  });
};
