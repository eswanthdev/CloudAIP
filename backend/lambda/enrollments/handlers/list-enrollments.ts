import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { parsePagination, decodeCursor, encodeCursor, buildPaginatedResponse } from '/opt/nodejs/src/pagination';

export const listEnrollments = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const { limit, cursor, sortDirection } = parsePagination(event);
  const params = event.queryStringParameters || {};
  const isAdmin = user.role === 'admin';

  let queryParams: any;

  if (isAdmin && params.courseId) {
    // Admin: filter by courseId using GSI1-EnrollCourseIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI1-EnrollCourseIndex',
      KeyConditionExpression: 'enrollCourseKey = :eck',
      ExpressionAttributeValues: {
        ':eck': `ENROLL#COURSE#${params.courseId}`,
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else if (isAdmin && params.status) {
    // Admin: filter by status using GSI2-EnrollStatusIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI2-EnrollStatusIndex',
      KeyConditionExpression: 'enrollStatusKey = :esk',
      ExpressionAttributeValues: {
        ':esk': `ENROLL#STATUS#${params.status}`,
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else {
    // Student: get own enrollments
    queryParams = {
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'ENROLL#',
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  }

  if (cursor) {
    const exclusiveStartKey = decodeCursor(cursor);
    if (exclusiveStartKey) {
      queryParams.ExclusiveStartKey = exclusiveStartKey;
    }
  }

  const result = await docClient.send(new QueryCommand(queryParams));
  const enrollments = result.Items || [];

  // Batch-fetch course metadata for enrichment
  if (enrollments.length > 0) {
    const courseIds = [...new Set(enrollments.map((e: any) => e.courseId).filter(Boolean))];
    const keys = courseIds.map((cid) => ({ pk: `COURSE#${cid}`, sk: 'METADATA' }));

    if (keys.length > 0) {
      try {
        const batchResult = await docClient.send(
          new BatchGetCommand({
            RequestItems: {
              [MAIN_TABLE]: { Keys: keys },
            },
          })
        );

        const courses = batchResult.Responses?.[MAIN_TABLE] || [];
        const courseMap = new Map<string, any>();
        for (const course of courses) {
          const cid = course.pk.replace('COURSE#', '');
          courseMap.set(cid, course);
        }

        for (const enrollment of enrollments as any[]) {
          const course = courseMap.get(enrollment.courseId);
          if (course) {
            enrollment.courseTitle = course.title || '';
            enrollment.courseThumbnail = course.thumbnail || '';
          }
        }
      } catch (err) {
        console.error('Failed to batch-fetch course metadata:', err);
      }
    }
  }

  const response = buildPaginatedResponse(
    enrollments,
    result.LastEvaluatedKey as Record<string, unknown> | undefined,
    result.Count ?? enrollments.length
  );

  return success(200, response);
};
