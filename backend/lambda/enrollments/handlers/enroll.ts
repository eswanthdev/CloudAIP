import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const enrollSchema = z.object({
  courseId: z.string().min(1, 'courseId is required'),
});

export const enroll = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
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

  const validation = enrollSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const { courseId } = validation.data;

  // Verify course exists in MainTable
  const courseResult = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
    })
  );

  if (!courseResult.Item) {
    return error(404, 'Course not found');
  }

  // Check if already enrolled
  const existingEnrollment = await docClient.send(
    new GetCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: `USER#${user.userId}`, sk: `ENROLL#${courseId}` },
    })
  );

  if (existingEnrollment.Item) {
    return error(409, 'Already enrolled in this course');
  }

  const now = new Date().toISOString();
  const enrollmentId = randomUUID();

  const enrollmentItem = {
    pk: `USER#${user.userId}`,
    sk: `ENROLL#${courseId}`,
    enrollmentId,
    userId: user.userId,
    courseId,
    courseName: courseResult.Item.title || courseResult.Item.courseName || '',
    status: 'active',
    enrolledAt: now,
    createdAt: now,
    updatedAt: now,
    entityType: 'ENROLLMENT',
    enrollCourseKey: `ENROLL#COURSE#${courseId}`,
    enrollStatusKey: 'ENROLL#STATUS#active',
  };

  // PutItem with condition to prevent race conditions
  try {
    await docClient.send(
      new PutCommand({
        TableName: ACTIVITY_TABLE,
        Item: enrollmentItem,
        ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
      })
    );
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error(409, 'Already enrolled in this course');
    }
    throw err;
  }

  // Increment course enrollmentCount
  try {
    await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
        UpdateExpression: 'ADD enrollmentCount :inc',
        ExpressionAttributeValues: { ':inc': 1 },
      })
    );
  } catch (err) {
    console.error('Failed to increment enrollmentCount:', err);
  }

  return success(201, {
    enrollment: {
      enrollmentId,
      userId: user.userId,
      courseId,
      courseName: enrollmentItem.courseName,
      status: 'active',
      enrolledAt: now,
    },
  });
};
