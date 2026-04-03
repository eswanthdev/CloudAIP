import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';
import { parsePagination, decodeCursor, buildPaginatedResponse } from '/opt/nodejs/src/pagination';

export const listServices = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Public endpoint - auth is optional
  const user = getUserFromEvent(event);
  const isAdmin = user?.role === 'admin';
  const { limit, cursor, sortDirection } = parsePagination(event);
  const params = event.queryStringParameters || {};

  const queryParams: any = {
    TableName: MAIN_TABLE,
    IndexName: 'GSI9-ServiceListIndex',
    KeyConditionExpression: 'serviceEntityType = :set',
    ExpressionAttributeValues: {
      ':set': 'SERVICE',
    },
    Limit: limit,
    ScanIndexForward: sortDirection === 'ASC',
  };

  // Build filter expressions
  const filterParts: string[] = [];
  const exprAttrNames: Record<string, string> = {};

  if (!isAdmin) {
    filterParts.push('isPublished = :published');
    queryParams.ExpressionAttributeValues[':published'] = true;
  }

  if (params.category) {
    filterParts.push('#cat = :category');
    exprAttrNames['#cat'] = 'category';
    queryParams.ExpressionAttributeValues[':category'] = params.category;
  }

  if (params.isFeatured === 'true') {
    filterParts.push('isFeatured = :featured');
    queryParams.ExpressionAttributeValues[':featured'] = true;
  }

  if (filterParts.length > 0) {
    queryParams.FilterExpression = filterParts.join(' AND ');
  }

  if (Object.keys(exprAttrNames).length > 0) {
    queryParams.ExpressionAttributeNames = exprAttrNames;
  }

  if (cursor) {
    const exclusiveStartKey = decodeCursor(cursor);
    if (exclusiveStartKey) {
      queryParams.ExclusiveStartKey = exclusiveStartKey;
    }
  }

  const result = await docClient.send(new QueryCommand(queryParams));
  const services = result.Items || [];

  const response = buildPaginatedResponse(
    services,
    result.LastEvaluatedKey as Record<string, unknown> | undefined,
    result.Count ?? services.length
  );

  return success(200, response);
};
