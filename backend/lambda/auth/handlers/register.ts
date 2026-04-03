import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';
import { hashPassword } from '/opt/nodejs/src/password';
import { generateAccessToken, generateRefreshToken } from '/opt/nodejs/src/jwt';

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(320),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1, 'First name is required').max(100).trim(),
  lastName: z.string().min(1, 'Last name is required').max(100).trim(),
});

export const register = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let body: unknown;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const validation = registerSchema.safeParse(body);
  if (!validation.success) {
    const messages = validation.error.errors.map((e) => e.message);
    return error(400, messages.join(', '));
  }

  const { email, password, firstName, lastName } = validation.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check email uniqueness via GSI1-EmailIndex
  const existingUser = await docClient.send(
    new QueryCommand({
      TableName: MAIN_TABLE,
      IndexName: 'GSI1-EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': normalizedEmail },
      Limit: 1,
    })
  );

  if (existingUser.Items && existingUser.Items.length > 0) {
    return error(409, 'An account with this email already exists');
  }

  const userId = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(password);
  const emailVerificationToken = randomUUID();
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const userItem = {
    pk: `USER#${userId}`,
    sk: 'PROFILE',
    userId,
    email: normalizedEmail,
    passwordHash,
    firstName,
    lastName,
    role: 'student',
    isActive: true,
    isEmailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
    entityType: 'USER',
    createdAt: now,
    updatedAt: now,
    refreshTokens: [],
  };

  await docClient.send(
    new PutCommand({
      TableName: MAIN_TABLE,
      Item: userItem,
      ConditionExpression: 'attribute_not_exists(pk)',
    })
  );

  const accessToken = generateAccessToken({ userId, email: normalizedEmail, role: 'student' });
  const refreshTokenValue = generateRefreshToken({ userId });

  // Store refresh token on user record
  const { UpdateCommand } = await import('@aws-sdk/lib-dynamodb');
  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
      UpdateExpression: 'SET refreshTokens = list_append(refreshTokens, :token)',
      ExpressionAttributeValues: {
        ':token': [refreshTokenValue],
      },
    })
  );

  return success(201, {
    message: 'Registration successful. Please verify your email.',
    user: {
      userId,
      email: normalizedEmail,
      firstName,
      lastName,
      role: 'student',
      isEmailVerified: false,
    },
    tokens: {
      accessToken,
      refreshToken: refreshTokenValue,
    },
  });
};
