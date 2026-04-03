import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getPayment = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const paymentId = path.split('/payments/')[1];

  if (!paymentId) {
    return error(400, 'Payment ID is required');
  }

  const isAdmin = user.role === 'admin';

  let queryParams: any;

  if (isAdmin) {
    // Admin can look up by paymentId across all users
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI7-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      FilterExpression: 'paymentId = :pid',
      ExpressionAttributeValues: {
        ':et': 'PAYMENT',
        ':pid': paymentId,
      },
      Limit: 1,
    };
  } else {
    // User: search within own payments
    queryParams = {
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      FilterExpression: 'paymentId = :pid',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'PAYMENT#',
        ':pid': paymentId,
      },
    };
  }

  const result = await docClient.send(new QueryCommand(queryParams));

  if (!result.Items || result.Items.length === 0) {
    return error(404, 'Payment not found');
  }

  const payment = result.Items[0];

  // Verify ownership for non-admin
  if (!isAdmin && payment.userId !== user.userId) {
    return error(403, 'Access denied');
  }

  // Strip sensitive fields for non-admin
  if (!isAdmin) {
    delete payment.stripePaymentIntentId;
  }

  return success(200, { payment });
};
