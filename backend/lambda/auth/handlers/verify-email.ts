import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';

export const verifyEmail = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Extract token from path: /auth/verify-email/{token}
  const path = event.requestContext?.http?.path || (event as any).path || '';
  const token = event.pathParameters?.token || path.split('/').pop();

  if (!token) {
    return error(400, 'Verification token is required');
  }

  // Query user by verification token via GSI
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI5-VerifyTokenIndex',
      KeyConditionExpression: 'emailVerificationToken = :token',
      ExpressionAttributeValues: { ':token': token },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return error(400, 'Invalid or expired verification token');
  }

  const user = result.Items[0];

  // Check if already verified
  if (user.isEmailVerified) {
    return success(200, { message: 'Email is already verified' });
  }

  // Check expiry
  if (user.emailVerificationExpires && new Date(user.emailVerificationExpires) < new Date()) {
    return error(400, 'Verification token has expired. Please request a new one.');
  }

  // Update user to verified
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: user.pk, sk: 'PROFILE' },
      UpdateExpression: 'SET isEmailVerified = :verified, updatedAt = :now REMOVE emailVerificationToken, emailVerificationExpires',
      ExpressionAttributeValues: {
        ':verified': true,
        ':now': now,
      },
    })
  );

  return success(200, { message: 'Email verified successfully' });
};
