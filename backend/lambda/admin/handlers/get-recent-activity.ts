import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

interface ActivityItem {
  entityType: string;
  createdAt: string;
  [key: string]: any;
}

export const getRecentActivity = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const queryLimit = 10;

  // Query recent enrollments, payments, and service requests in parallel
  const [enrollmentsResult, paymentsResult, serviceRequestsResult] = await Promise.all([
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI7-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'ENROLLMENT' },
        Limit: queryLimit,
        ScanIndexForward: false, // newest first
      })
    ),
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI7-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'PAYMENT' },
        Limit: queryLimit,
        ScanIndexForward: false,
      })
    ),
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI7-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'SERVICE_REQUEST' },
        Limit: queryLimit,
        ScanIndexForward: false,
      })
    ),
  ]);

  // Merge all activities
  const allActivities: ActivityItem[] = [
    ...(enrollmentsResult.Items || []).map((item: any) => ({
      ...item,
      activityType: 'enrollment',
      summary: `New enrollment: ${item.courseName || item.courseId}`,
    })),
    ...(paymentsResult.Items || []).map((item: any) => ({
      ...item,
      activityType: 'payment',
      summary: `Payment ${item.status}: $${item.amount || 0} for ${item.itemName || item.type}`,
    })),
    ...(serviceRequestsResult.Items || []).map((item: any) => ({
      ...item,
      activityType: 'service_request',
      summary: `Service request from ${item.name}: ${item.serviceName || item.serviceId}`,
    })),
  ];

  // Sort by createdAt descending (newest first)
  allActivities.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // Return top 20 combined
  const recentActivity = allActivities.slice(0, 20);

  return success(200, {
    activities: recentActivity,
    count: recentActivity.length,
  });
};
