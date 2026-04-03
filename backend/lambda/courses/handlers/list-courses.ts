import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const listCourses = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  const isAdmin = authUser?.role === 'admin';

  const qs = event.queryStringParameters || {};
  const limit = Math.min(Math.max(parseInt(qs.limit || '25', 10), 1), 100);
  const category = qs.category;
  const difficulty = qs.difficulty;
  const isFeatured = qs.isFeatured;
  const search = qs.search?.toLowerCase().trim();

  let exclusiveStartKey: Record<string, any> | undefined;
  if (qs.lastKey) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(qs.lastKey, 'base64url').toString('utf-8'));
    } catch {
      return error(400, 'Invalid pagination token');
    }
  }

  let queryParams: any;

  if (category) {
    // Query GSI4-CategoryIndex
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI4-CategoryIndex',
      KeyConditionExpression: 'category = :category',
      ExpressionAttributeNames: {} as Record<string, string>,
      ExpressionAttributeValues: { ':category': category } as Record<string, any>,
      Limit: limit,
      ScanIndexForward: false,
    };
  } else {
    // Query GSI3-EntityTypeIndex for all courses
    queryParams = {
      TableName: MAIN_TABLE,
      IndexName: 'GSI3-EntityTypeIndex',
      KeyConditionExpression: 'entityType = :entityType',
      ExpressionAttributeNames: {} as Record<string, string>,
      ExpressionAttributeValues: { ':entityType': 'COURSE' } as Record<string, any>,
      Limit: limit,
      ScanIndexForward: false,
    };
  }

  // Build filter expressions
  const filterParts: string[] = [];

  // Non-admin users can only see published courses
  if (!isAdmin) {
    filterParts.push('isPublished = :published');
    queryParams.ExpressionAttributeValues[':published'] = true;
  }

  if (difficulty) {
    filterParts.push('#difficulty = :difficulty');
    queryParams.ExpressionAttributeNames['#difficulty'] = 'difficulty';
    queryParams.ExpressionAttributeValues[':difficulty'] = difficulty;
  }

  if (isFeatured !== undefined) {
    filterParts.push('isFeatured = :isFeatured');
    queryParams.ExpressionAttributeValues[':isFeatured'] = isFeatured === 'true';
  }

  if (search) {
    filterParts.push('contains(#title, :search)');
    queryParams.ExpressionAttributeNames['#title'] = 'title';
    queryParams.ExpressionAttributeValues[':search'] = search;
  }

  if (filterParts.length > 0) {
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

  const responseBody: Record<string, any> = {
    courses: result.Items || [],
    count: result.Count || 0,
  };

  if (result.LastEvaluatedKey) {
    responseBody.lastKey = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64url');
  }

  return success(200, responseBody);
};
