import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getCourseProgress = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const courseId = path.split('/progress/courses/')[1];

  if (!courseId) {
    return error(400, 'Course ID is required');
  }

  // Get all lesson progress for this course
  const progressResult = await docClient.send(
    new QueryCommand({
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': `PROGRESS#${courseId}#`,
      },
    })
  );

  const lessons = progressResult.Items || [];

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
  const completedLessons = lessons.filter((l: any) => l.isCompleted).length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return success(200, {
    courseId,
    totalLessons,
    completedLessons,
    completionPercentage,
    lessons,
  });
};
