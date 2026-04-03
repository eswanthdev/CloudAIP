import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getRequest = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const requestId = path.split('/service-requests/')[1];

  if (!requestId) {
    return error(400, 'Request ID is required');
  }

  const isAdmin = user.role === 'admin';

  // We need to find the request by requestId. Since we don't have a direct PK/SK,
  // query by entityType GSI and filter by requestId
  let queryParams: any;

  if (isAdmin) {
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI7-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      FilterExpression: 'requestId = :rid',
      ExpressionAttributeValues: {
        ':et': 'SERVICE_REQUEST',
        ':rid': requestId,
      },
      Limit: 1,
    };
  } else {
    // Non-admin: search within own requests
    queryParams = {
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      FilterExpression: 'requestId = :rid',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'SVCREQ#',
        ':rid': requestId,
      },
    };
  }

  const result = await docClient.send(new QueryCommand(queryParams));

  if (!result.Items || result.Items.length === 0) {
    return error(404, 'Service request not found');
  }

  const request = result.Items[0];

  // Verify ownership for non-admin
  if (!isAdmin && request.userId !== user.userId) {
    return error(403, 'Access denied');
  }

  return success(200, { serviceRequest: request });
};
