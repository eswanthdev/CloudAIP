import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const listUsers = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const qs = event.queryStringParameters || {};
  const limit = Math.min(Math.max(parseInt(qs.limit || '25', 10), 1), 100);
  const search = qs.search?.toLowerCase().trim();
  const roleFilter = qs.role;

  let exclusiveStartKey: Record<string, any> | undefined;
  if (qs.lastKey) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(qs.lastKey, 'base64url').toString('utf-8'));
    } catch {
      return error(400, 'Invalid pagination token');
    }
  }

  let queryParams: any;

  if (roleFilter) {
    // Query GSI10-UserRoleIndex for specific role
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI10-UserRoleIndex',
      KeyConditionExpression: '#role = :role',
      ExpressionAttributeNames: { '#role': 'role' } as Record<string, string>,
      ExpressionAttributeValues: { ':role': roleFilter } as Record<string, any>,
      Limit: limit,
      ScanIndexForward: false,
    };
  } else {
    // Query GSI3-EntityTypeIndex for all users
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeNames: {} as Record<string, string>,
      ExpressionAttributeValues: { ':entityType': 'USER' } as Record<string, any>,
      Limit: limit,
      ScanIndexForward: false,
    };
  }

  // Add search filter
  if (search) {
    const filterParts: string[] = [];
    queryParams.ExpressionAttributeValues[':search'] = search;

    filterParts.push('(contains(#firstName, :search) OR contains(#lastName, :search) OR contains(#email, :search))');
    queryParams.ExpressionAttributeNames['#firstName'] = 'firstName';
    queryParams.ExpressionAttributeNames['#lastName'] = 'lastName';
    queryParams.ExpressionAttributeNames['#email'] = 'email';

    queryParams.FilterExpression = filterParts.join(' AND ');
  }

  // Clean up empty ExpressionAttributeNames
  if (Object.keys(queryParams.ExpressionAttributeNames).length === 0) {
    delete queryParams.ExpressionAttributeNames;
  }

  if (exclusiveStartKey) {
    queryParams.ExclusiveStartKey = exclusiveStartKey;
  }

  const result = await docClient.send(new QueryCommand(queryParams));

  // Strip sensitive fields from all users
  const users = (result.Items || []).map((item: Record<string, any>) => {
    const {
      passwordHash,
      refreshTokens,
      emailVerificationToken,
      emailVerificationExpires,
      resetPasswordToken,
      resetPasswordExpires,
      ...safeUser
    } = item;
    return safeUser;
  });

  const responseBody: Record<string, any> = {
    users,
    count: users.length,
  };

  if (result.LastEvaluatedKey) {
    responseBody.lastKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url');
  }

  return success(200, responseBody);
};
