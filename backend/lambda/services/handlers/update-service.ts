import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const ALLOWED_FIELDS = new Set([
  'title', 'description', 'shortDescription', 'category', 'icon', 'image',
  'features', 'pricing', 'isPublished', 'isFeatured', 'order', 'slug',
]);

export const updateService = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const serviceId = path.split('/services/')[1];

  if (!serviceId) {
    return error(400, 'Service ID is required');
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  // Build dynamic SET expression
  const expressionParts: string[] = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  const now = new Date().toISOString();
  expressionParts.push('#updatedAt = :updatedAt');
  exprAttrNames['#updatedAt'] = 'updatedAt';
  exprAttrValues[':updatedAt'] = now;

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_FIELDS.has(key)) continue;

    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    expressionParts.push(`${attrName} = ${attrValue}`);
    exprAttrNames[attrName] = key;
    exprAttrValues[attrValue] = value;
  }

  // Update serviceOrder if order changed
  if (body.order !== undefined) {
    expressionParts.push('#serviceOrder = :serviceOrder');
    exprAttrNames['#serviceOrder'] = 'serviceOrder';
    exprAttrValues[':serviceOrder'] = String(body.order).padStart(5, '0');
  }

  if (expressionParts.length <= 1) {
    return error(400, 'No valid fields to update');
  }

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `SERVICE#${serviceId}`, sk: 'METADATA' },
        UpdateExpression: `SET ${expressionParts.join(', ')}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ConditionExpression: 'attribute_exists(pk)',
        ReturnValues: 'ALL_NEW',
      })
    );

    return success(200, { service: result.Attributes });
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error(404, 'Service not found');
    }
    throw err;
  }
};
