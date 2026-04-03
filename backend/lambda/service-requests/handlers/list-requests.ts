import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, ACTIVITY_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { parsePagination, decodeCursor, buildPaginatedResponse } from '/opt/nodejs/src/pagination';

export const listRequests = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const { limit, cursor, sortDirection } = parsePagination(event);
  const params = event.queryStringParameters || {};
  const isAdmin = user.role === 'admin';

  let queryParams: any;

  if (isAdmin && params.status) {
    // Admin: filter by status using GSI6-SvcReqStatusIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI6-SvcReqStatusIndex',
      KeyConditionExpression: 'svcReqStatusKey = :srsk',
      ExpressionAttributeValues: {
        ':srsk': `SVCREQ#STATUS#${params.status}`,
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else if (isAdmin) {
    // Admin: get all service requests via GSI7-EntityTypeIndex
    queryParams = {
      TableName: ACTIVITY_TABLE,
      IndexName: 'GSI7-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      ExpressionAttributeValues: {
        ':et': 'SERVICE_REQUEST',
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else {
    // Client: get own requests
    queryParams = {
      TableName: ACTIVITY_TABLE,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${user.userId}`,
        ':skPrefix': 'SVCREQ#',
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
  const requests = result.Items || [];

  const response = buildPaginatedResponse(
    requests,
    result.LastEvaluatedKey as Record<string, unknown> | undefined,
    result.Count ?? requests.length
  );

  return success(200, response);
};
