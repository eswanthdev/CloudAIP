import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { comparePassword } from '/opt/nodejs/src/password';
import { generateAccessToken, generateRefreshToken } from '/opt/nodejs/src/jwt';

export const login = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let body: { email?: string; password?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const { email, password } = body;

  if (!email || !password) {
    return error(400, 'Email and password are required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Query user by email via GSI
  const result = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI1-EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': normalizedEmail },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) {
    return error(401, 'Invalid email or password');
  }

  const user = result.Items[0];

  // Verify password
  const isPasswordValid = await comparePassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return error(401, 'Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    return error(403, 'Account has been deactivated. Please contact support.');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  });
  const refreshTokenValue = generateRefreshToken({ userId: user.userId });

  // Update lastLoginAt and store refresh token
  const now = new Date().toISOString();
  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: user.pk, sk: 'PROFILE' },
      UpdateExpression: 'SET lastLoginAt = :now, updatedAt = :now, refreshTokens = list_append(if_not_exists(refreshTokens, :empty), :token)',
      ExpressionAttributeValues: {
        ':now': now,
        ':token': [refreshTokenValue],
        ':empty': [],
      },
    })
  );

  // Return user data without sensitive fields
  const { passwordHash, refreshTokens, emailVerificationToken, emailVerificationExpires, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;

  return success(200, {
    message: 'Login successful',
    user: safeUser,
    tokens: {
      accessToken,
      refreshToken: refreshTokenValue,
    },
  });
};
