import { emailTransporter, EMAIL_FROM } from '../config/email.js';
import { env } from '../config/env.js';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await emailTransporter.sendMail({
    from: `"CloudAIP" <${EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">Welcome to CloudAIP, ${firstName}!</h1>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}"
         style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Verify Email Address
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4a5568;">${verificationUrl}</p>
      <p>This link expires in 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #718096; font-size: 12px;">If you did not create an account, please ignore this email.</p>
    </body>
    </html>
  `;

  await sendEmail(email, 'Verify your email - CloudAIP', html);
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">Password Reset Request</h1>
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your password. Click the button below to set a new password:</p>
      <a href="${resetUrl}"
         style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #4a5568;">${resetUrl}</p>
      <p>This link expires in 1 hour.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #718096; font-size: 12px;">If you did not request a password reset, please ignore this email.</p>
    </body>
    </html>
  `;

  await sendEmail(email, 'Password Reset - CloudAIP', html);
}

export async function sendEnrollmentConfirmation(
  email: string,
  firstName: string,
  courseTitle: string
): Promise<void> {
  const dashboardUrl = `${env.CLIENT_URL}/dashboard/enrollments`;

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">Enrollment Confirmed!</h1>
      <p>Hi ${firstName},</p>
      <p>You have been successfully enrolled in <strong>${courseTitle}</strong>.</p>
      <p>You can start learning right away by visiting your dashboard:</p>
      <a href="${dashboardUrl}"
         style="display: inline-block; background-color: #38a169; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Go to Dashboard
      </a>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #718096; font-size: 12px;">CloudAIP - Elevating your cloud skills.</p>
    </body>
    </html>
  `;

  await sendEmail(email, `Enrollment Confirmed: ${courseTitle} - CloudAIP`, html);
}

export async function sendLeadNotification(
  leadName: string,
  leadEmail: string,
  message: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">New Lead Received</h1>
      <p><strong>Name:</strong> ${leadName}</p>
      <p><strong>Email:</strong> ${leadEmail}</p>
      <p><strong>Message:</strong></p>
      <p style="background: #f7fafc; padding: 12px; border-radius: 6px;">${message}</p>
      <a href="${env.CLIENT_URL}/admin/leads"
         style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        View in Admin Panel
      </a>
    </body>
    </html>
  `;

  await sendEmail(EMAIL_FROM, 'New Lead - CloudAIP', html);
}

export async function sendServiceRequestUpdate(
  email: string,
  firstName: string,
  serviceTitle: string,
  status: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a365d;">Service Request Update</h1>
      <p>Hi ${firstName},</p>
      <p>Your service request for <strong>${serviceTitle}</strong> has been updated.</p>
      <p>New status: <strong>${status}</strong></p>
      <a href="${env.CLIENT_URL}/dashboard/service-requests"
         style="display: inline-block; background-color: #3182ce; color: white; padding: 12px 24px;
                text-decoration: none; border-radius: 6px; margin: 16px 0;">
        View Details
      </a>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #718096; font-size: 12px;">CloudAIP - Your trusted cloud partner.</p>
    </body>
    </html>
  `;

  await sendEmail(email, `Service Request Update - ${serviceTitle}`, html);
}
