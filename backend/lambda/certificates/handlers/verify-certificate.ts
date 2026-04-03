import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';

export const verifyCertificate = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // PUBLIC endpoint - no auth required
  const path = event.requestContext?.http?.path || (event as any).path;
  const certNumber = path.split('/certificates/verify/')[1];

  if (!certNumber) {
    return error(400, 'Certificate number is required');
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI7-CertNumberIndex',
      KeyConditionExpression: 'certificateNumber = :cn',
      ExpressionAttributeValues: {
        ':cn': certNumber,
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return error(404, 'Certificate not found');
  }

  const cert = result.Items[0];

  return success(200, {
    valid: true,
    certificate: {
      certificateNumber: cert.certificateNumber,
      userName: cert.userName,
      courseName: cert.courseName,
      issuedAt: cert.issuedAt,
    },
  });
};
