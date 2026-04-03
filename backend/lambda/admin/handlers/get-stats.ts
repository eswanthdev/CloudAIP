import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE, ACTIVITY_TABLE, LEADS_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getStats = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  // Run all queries in parallel
  const [
    totalUsersResult,
    totalEnrollmentsResult,
    activeEnrollmentsResult,
    totalLeadsResult,
    newLeadsResult,
    succeededPaymentsResult,
    totalCoursesResult,
  ] = await Promise.all([
    // Total users
    docClient.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        IndexName: 'GSI3-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'USER' },
        Select: 'COUNT',
      })
    ),
    // Total enrollments
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI7-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'ENROLLMENT' },
        Select: 'COUNT',
      })
    ),
    // Active enrollments
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI2-EnrollStatusIndex',
        KeyConditionExpression: 'enrollStatusKey = :esk',
        ExpressionAttributeValues: { ':esk': 'ENROLL#STATUS#active' },
        Select: 'COUNT',
      })
    ),
    // Total leads
    docClient.send(
      new ScanCommand({
        TableName: LEADS_TABLE,
        Select: 'COUNT',
      })
    ),
    // New leads
    docClient.send(
      new QueryCommand({
        TableName: LEADS_TABLE,
        IndexName: 'StatusIndex',
        KeyConditionExpression: '#s = :status',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':status': 'new' },
        Select: 'COUNT',
      })
    ),
    // Succeeded payments (need amounts for revenue)
    docClient.send(
      new QueryCommand({
        TableName: ACTIVITY_TABLE,
        IndexName: 'GSI4-PaymentStatusIndex',
        KeyConditionExpression: 'paymentStatusKey = :psk',
        ExpressionAttributeValues: { ':psk': 'PAYMENT#STATUS#succeeded' },
        ProjectionExpression: 'amount',
      })
    ),
    // Total courses
    docClient.send(
      new QueryCommand({
        TableName: MAIN_TABLE,
        IndexName: 'GSI3-EntityTypeIndex',
        KeyConditionExpression: 'entityType = :et',
        ExpressionAttributeValues: { ':et': 'COURSE' },
        Select: 'COUNT',
      })
    ),
  ]);

  // Calculate total revenue from succeeded payments
  const succeededPayments = succeededPaymentsResult.Items || [];
  const totalRevenue = succeededPayments.reduce(
    (sum: number, item: any) => sum + (item.amount || 0),
    0
  );

  return success(200, {
    stats: {
      totalUsers: totalUsersResult.Count || 0,
      totalEnrollments: totalEnrollmentsResult.Count || 0,
      activeEnrollments: activeEnrollmentsResult.Count || 0,
      totalLeads: totalLeadsResult.Count || 0,
      newLeads: newLeadsResult.Count || 0,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalPayments: succeededPayments.length,
      totalCourses: totalCoursesResult.Count || 0,
    },
  });
};
