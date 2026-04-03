import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { getUserFromEvent } from '/opt/nodejs/src/auth-utils';

const ALLOWED_FIELDS = ['role', 'isActive', 'firstName', 'lastName'] as const;
const VALID_ROLES = ['student', 'instructor', 'admin'];

export const updateUser = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const authUser = getUserFromEvent(event);
  if (!authUser || authUser.role !== 'admin') {
    return error(403, 'Admin access required');
  }

  const userId = event.pathParameters?.userId;
  if (!userId) {
    return error(400, 'User ID is required');
  }

  let body: Record<string, any>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  // Validate role if provided
  if (body.role && !VALID_ROLES.includes(body.role)) {
    return error(400, `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
  }

  // Build dynamic update expression
  const updateParts: string[] = [];
  const exprAttrNames: Record<string, string> = {};
  const exprAttrValues: Record<string, any> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updateParts.push(`#${field} = :${field}`);
      exprAttrNames[`#${field}`] = field;
      exprAttrValues[`:${field}`] = body[field];
    }
  }

  if (updateParts.length === 0) {
    return error(400, 'No valid fields to update');
  }

  // Always update updatedAt
  updateParts.push('#updatedAt = :updatedAt');
  exprAttrNames['#updatedAt'] = 'updatedAt';
  exprAttrValues[':updatedAt'] = new Date().toISOString();

  const result = await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
      UpdateExpression: `SET ${updateParts.join(', ')}`,
      ExpressionAttributeNames: exprAttrNames,
      ExpressionAttributeValues: exprAttrValues,
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW',
    })
  );

  if (!result.Attributes) {
    return error(404, 'User not found');
  }

  const {
    passwordHash,
    refreshTokens,
    emailVerificationToken,
    emailVerificationExpires,
    resetPasswordToken,
    resetPasswordExpires,
    ...safeUser
  } = result.Attributes;

  return success(200, { user: safeUser });
};
