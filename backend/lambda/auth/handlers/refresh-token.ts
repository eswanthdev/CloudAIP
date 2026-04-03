import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '/opt/nodejs/src/jwt';

export const refreshToken = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let body: { refreshToken?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const { refreshToken: token } = body;

  if (!token) {
    return error(400, 'Refresh token is required');
  }

  // Verify the refresh token
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token) as { userId: string };
  } catch {
    return error(401, 'Invalid or expired refresh token');
  }

  // Look up the user
  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${payload.userId}`, sk: 'PROFILE' },
    })
  );

  if (!result.Item) {
    return error(401, 'User not found');
  }

  const user = result.Item;

  if (!user.isActive) {
    return error(403, 'Account has been deactivated');
  }

  // Verify the refresh token exists in user's stored tokens
  const storedTokens: string[] = user.refreshTokens || [];
  if (!storedTokens.includes(token)) {
    return error(401, 'Refresh token has been revoked');
  }

  // Generate new token pair
  const newAccessToken = generateAccessToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });
  const newRefreshToken = generateRefreshToken({ userId: user.userId });

  // Replace old refresh token with new one
  const updatedTokens = storedTokens.filter((t: string) => t !== token);
  updatedTokens.push(newRefreshToken);

  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${payload.userId}`, sk: 'PROFILE' },
      UpdateExpression: 'SET refreshTokens = :tokens, updatedAt = :now',
      ExpressionAttributeValues: {
        ':tokens': updatedTokens,
        ':now': new Date().toISOString(),
      },
    })
  );

  return success(200, {
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
};
