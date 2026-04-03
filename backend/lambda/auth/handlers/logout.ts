import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const logout = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser) {
    return error(401, 'Authentication required');
  }

  let body: { refreshToken?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const { refreshToken } = body;

  // Get current user record
  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${authUser.userId}`, sk: 'PROFILE' },
    })
  );

  if (!result.Item) {
    return error(404, 'User not found');
  }

  const storedTokens: string[] = result.Item.refreshTokens || [];

  if (refreshToken) {
    // Remove specific refresh token
    const updatedTokens = storedTokens.filter((t: string) => t !== refreshToken);
    await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `USER#${authUser.userId}`, sk: 'PROFILE' },
        UpdateExpression: 'SET refreshTokens = :tokens, updatedAt = :now',
        ExpressionAttributeValues: {
          ':tokens': updatedTokens,
          ':now': new Date().toISOString(),
        },
      })
    );
  } else {
    // Remove all refresh tokens (logout from all devices)
    await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `USER#${authUser.userId}`, sk: 'PROFILE' },
        UpdateExpression: 'SET refreshTokens = :empty, updatedAt = :now',
        ExpressionAttributeValues: {
          ':empty': [],
          ':now': new Date().toISOString(),
        },
      })
    );
  }

  return success(200, { message: 'Logged out successfully' });
};
