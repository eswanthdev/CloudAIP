import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { hashPassword } from '/opt/nodejs/src/password';

export const resetPassword = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  // Extract token from path: /auth/reset-password/{token}
  const path = event.requestContext?.http?.path || (event as any).path || '';
  const token = event.pathParameters?.token || path.split('/').pop();

  if (!token) {
    return error(400, 'Reset token is required');
  }

  let body: { password?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const { password } = body;

  if (!password || password.length < 8) {
    return error(400, 'Password must be at least 8 characters');
  }

  if (password.length > 128) {
    return error(400, 'Password must be at most 128 characters');
  }

  // Query user by reset token via GSI
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI6-ResetTokenIndex',
      KeyConditionExpression: 'resetPasswordToken = :token',
      ExpressionAttributeValues: { ':token': token },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return error(400, 'Invalid or expired reset token');
  }

  const user = result.Items[0];

  // Check expiry
  if (user.resetPasswordExpires && new Date(user.resetPasswordExpires) < new Date()) {
    return error(400, 'Reset token has expired. Please request a new one.');
  }

  // Hash new password and update user
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: user.pk, sk: 'PROFILE' },
      UpdateExpression: 'SET passwordHash = :hash, updatedAt = :now, refreshTokens = :empty REMOVE resetPasswordToken, resetPasswordExpires',
      ExpressionAttributeValues: {
        ':hash': passwordHash,
        ':now': now,
        ':empty': [],
      },
    })
  );

  return success(200, { message: 'Password has been reset successfully. Please log in with your new password.' });
};
