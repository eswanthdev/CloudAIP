import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getEnrollment = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  // enrollmentId is a composite: userId__courseId
  const path = event.requestContext?.http?.path || (event as any).path;
  const enrollmentId = path.split('/enrollments/')[1];

  if (!enrollmentId) {
    return error(400, 'Enrollment ID is required');
  }

  // Parse composite key: userId__courseId
  const parts = enrollmentId.split('__');
  let targetUserId: string;
  let courseId: string;

  if (parts.length === 2) {
    targetUserId = parts[0];
    courseId = parts[1];
  } else {
    // Assume it's just a courseId and use the current user
    targetUserId = user.userId;
    courseId = enrollmentId;
  }

  // Non-admin can only view own enrollments
  if (user.role !== 'admin' && targetUserId !== user.userId) {
    return error(403, 'Access denied');
  }

  const enrollmentResult = await docClient.send(
    new GetCommand({
      TableName: ACTIVITY_TABLE,
      Key: { pk: `USER#${targetUserId}`, sk: `ENROLL#${courseId}` },
    })
  );

  if (!enrollmentResult.Item) {
    return error(404, 'Enrollment not found');
  }

  // Fetch course details
  const courseResult = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `COURSE#${courseId}`, sk: 'METADATA' },
    })
  );

  const enrollment = {
    ...enrollmentResult.Item,
    course: courseResult.Item
      ? {
          courseId: courseResult.Item.courseId || courseId,
          title: courseResult.Item.title || '',
          description: courseResult.Item.description || '',
          thumbnail: courseResult.Item.thumbnail || '',
          duration: courseResult.Item.duration || '',
        }
      : null,
  };

  return success(200, { enrollment });
};
