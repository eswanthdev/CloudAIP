import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getProgressSummary = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  // Get all enrollments for the user
  const enrollmentsResult = await docClient.send(
    new QueryCommand({
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'ENROLL#',
      },
    })
  );

  const enrollments = enrollmentsResult.Items || [];

  // For each enrolled course, get progress count and total lesson count
  const courseSummaries = await Promise.all(
    enrollments.map(async (enrollment: any) => {
      const courseId = enrollment.courseId;

      // Get completed lessons count
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

      const progressItems = progressResult.Items || [];
      const completedLessons = progressItems.filter((p: any) => p.isCompleted).length;

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
      const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const totalWatchedSeconds = progressItems.reduce(
        (sum: number, p: any) => sum + (p.watchedSeconds || 0),
        0
      );

      return {
        courseId,
        courseName: enrollment.courseName || '',
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        totalLessons,
        completedLessons,
        completionPercentage,
        totalWatchedSeconds,
        lastAccessedAt: progressItems.length > 0
          ? progressItems.sort((a: any, b: any) =>
              (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || '')
            )[0]?.lastAccessedAt
          : null,
      };
    })
  );

  return success(200, {
    totalCourses: courseSummaries.length,
    courses: courseSummaries,
  });
};
