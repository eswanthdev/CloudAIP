import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { parsePagination, decodeCursor, buildPaginatedResponse } from '/opt/nodejs/src/pagination';

export const listPayments = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const { limit, cursor, sortDirection } = parsePagination(event);
  const params = event.queryStringParameters || {};
  const isAdmin = user.role === 'admin';

  let queryParams: any;

  if (isAdmin && params.status) {
    // Admin: filter by status using GSI4-PaymentStatusIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI4-PaymentStatusIndex',
      KeyConditionExpression: 'paymentStatusKey = :psk',
      ExpressionAttributeValues: {
        ':psk': `PAYMENT#STATUS#${params.status}`,
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else if (isAdmin) {
    // Admin: get all payments via GSI7-EntityTypeIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI7-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      ExpressionAttributeValues: {
        ':et': 'PAYMENT',
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else {
    // User: get own payments
    queryParams = {
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'PAYMENT#',
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
  const payments = (result.Items || []).map((item: any) => {
    // Strip sensitive fields
    const { stripePaymentIntentId, ...rest } = item;
    return rest;
  });

  const response = buildPaginatedResponse(
    payments,
    result.LastEvaluatedKey as Record<string, unknown> | undefined,
    result.Count ?? payments.length
  );

  return success(200, response);
};
