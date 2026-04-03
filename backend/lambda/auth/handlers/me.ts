import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const getMe = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser) {
    return error(401, 'Authentication required');
  }

  const result = await docClient.send(
    new GetCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${authUser.userId}`, sk: 'PROFILE' },
    })
  );

  if (!result.Item) {
    return error(404, 'User not found');
  }

  // Remove sensitive fields
  const {
    passwordHash,
    refreshTokens,
    emailVerificationToken,
    emailVerificationExpires,
    resetPasswordToken,
    resetPasswordExpires,
    ...safeUser
  } = result.Item;

  return success(200, { user: safeUser });
};
