import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { docClient, MAIN_TABLE } from '/opt/nodejs/src/dynamo-client';
import { success, error } from '/opt/nodejs/src/response';

const sesClient = new SESClient({});
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@cloudaip.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://cloudaip.com';

export const forgotPassword = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let body: { email?: string };
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return error(400, 'Invalid JSON body');
  }

  const { email } = body;

  if (!email) {
    return error(400, 'Email is required');
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Always return success to prevent email enumeration
  const successResponse = success(200, {
    message: 'If an account with that email exists, a password reset link has been sent.',
  });

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
    return successResponse;
  }

  const user = result.Items[0];

  if (!user.isActive) {
    return successResponse;
  }

  // Generate reset token and set expiry (1 hour)
  const resetToken = randomUUID();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await docClient.send(
    new UpdateCommand({
      TableName: MAIN_TABLE,
      Key: { pk: user.pk, sk: 'PROFILE' },
      UpdateExpression: 'SET resetPasswordToken = :token, resetPasswordExpires = :expires, updatedAt = :now',
      ExpressionAttributeValues: {
        ':token': resetToken,
        ':expires': resetExpires,
        ':now': new Date().toISOString(),
      },
    })
  );

  // Send reset email via SES
  const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sesClient.send(
      new SendEmailCommand({
        Source: SES_FROM_EMAIL,
        Destination: { ToAddresses: [normalizedEmail] },
        Message: {
          Subject: {
            Data: 'Reset Your CloudAIP Password',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #1a1a2e; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #6366f1;">Reset Your Password</h2>
  <p>Hi ${user.firstName || 'there'},</p>
  <p>We received a request to reset your CloudAIP password. Click the button below to create a new password:</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="${resetLink}" style="background: #6366f1; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">Reset Password</a>
  </p>
  <p>This link will expire in 1 hour.</p>
  <p>If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">CloudAIP - Cloud & AI Training Platform</p>
</body>
</html>`,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `Reset your CloudAIP password by visiting: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
              Charset: 'UTF-8',
            },
          },
        },
      })
    );
  } catch (emailErr) {
    console.error('Failed to send reset email:', emailErr);
    // Don't fail the request - token is already saved
  }

  return successResponse;
};
