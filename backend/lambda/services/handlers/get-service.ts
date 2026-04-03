import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';

export const getService = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Public endpoint
  const path = event.requestContext?.http?.path || (event as any).path;
  const serviceId = path.split('/services/')[1];

  if (!serviceId) {
    return error(400, 'Service ID is required');
  }

  // Try direct GetItem first (by ID)
  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `SERVICE#${serviceId}`, sk: 'METADATA' },
    })
  );

  if (result.Item) {
    return success(200, { service: result.Item });
  }

  // If not found by ID, try slug via GSI2-SlugIndex
  const slugResult = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI2-SlugIndex',
      KeyConditionExpression: 'slug = :slug',
      ExpressionAttributeValues: {
        ':slug': serviceId,
      },
      Limit: 1,
    })
  );

  if (slugResult.Items && slugResult.Items.length > 0) {
    return success(200, { service: slugResult.Items[0] });
  }

  return error(404, 'Service not found');
};
