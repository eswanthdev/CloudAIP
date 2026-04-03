import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const deleteService = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user || user.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const serviceId = path.split('/services/')[1];

  if (!serviceId) {
    return error(400, 'Service ID is required');
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `SERVICE#${serviceId}`, sk: 'METADATA' },
        ConditionExpression: 'attribute_exists(pk)',
      })
    );

    return success(200, { message: 'Service deleted successfully' });
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error(404, 'Service not found');
    }
    throw err;
  }
};
