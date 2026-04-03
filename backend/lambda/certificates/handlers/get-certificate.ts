import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getCertificate = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const user = getUserFromEvent(event);
  if (!user) {
    return error(401, 'Authentication required');
  }

  const path = event.requestContext?.http?.path || (event as any).path;
  const certId = path.split('/certificates/')[1];

  if (!certId) {
    return error(400, 'Certificate ID is required');
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `CERT#${certId}`, sk: 'METADATA' },
    })
  );

  if (!result.Item) {
    return error(404, 'Certificate not found');
  }

  // Non-admin can only view own certificates
  if (user.role !== 'admin' && result.Item.certUserId !== user.userId) {
    return error(403, 'Access denied');
  }

  return success(200, { certificate: result.Item });
};
