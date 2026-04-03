import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { parsePagination, decodeCursor, buildPaginatedResponse } from '/opt/nodejs/src/pagination';

export const listCertificates = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const { limit, cursor, sortDirection } = parsePagination(event);
  const isAdmin = user.role === 'admin';

  let queryParams: any;

  if (isAdmin) {
    // Admin: get all certificates via GSI3-EntityTypeIndex
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :et',
      ExpressionAttributeValues: {
        ':et': 'CERTIFICATE',
      },
      Limit: limit,
      ScanIndexForward: sortDirection === 'ASC',
    };
  } else {
    // Student: get own certificates via GSI8-CertUserIndex
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI8-CertUserIndex',
      KeyConditionExpression: 'certUserId = :uid',
      ExpressionAttributeValues: {
        ':uid': user.userId,
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
  const certificates = (result.Items || []).map((item: any) => {
    const { htmlContent, ...rest } = item;
    return rest;
  });

  const response = buildPaginatedResponse(
    certificates,
    result.LastEvaluatedKey as Record<string, unknown> | undefined,
    result.Count ?? certificates.length
  );

  return success(200, response);
};
