import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

export const deleteUser = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const userId = event.pathParameters?.userId;
  if (!userId) {
    return error(400, 'User ID is required');
  }

  // Prevent self-deletion
  if (userId === authUser.userId) {
    return error(400, 'Cannot deactivate your own account');
  }

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: MAIN_TABLE,
        Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
        UpdateExpression: 'SET isActive = :inactive, updatedAt = :now, refreshTokens = :empty',
        ExpressionAttributeValues: {
          ':inactive': false,
          ':now': new Date().toISOString(),
          ':empty': [],
        },
        ConditionExpression: 'attribute_exists(pk)',
      })
    );
  } catch (err: any) {
    if (err.name === 'ConditionalCheckFailedException') {
      return error(404, 'User not found');
    }
    throw err;
  }

  return success(200, { message: 'User deactivated successfully' });
};
