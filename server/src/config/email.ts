import nodemailer from 'nodemailer';
import { env } from './env.js';

export const emailTransporter = nodemailer.createTransport({
  host: env.SES_SMTP_HOST,
  port: env.SES_SMTP_PORT,
  secure: false,
  auth: {
    user: env.SES_SMTP_USER,
    pass: env.SES_SMTP_PASS,
  },
});

export const EMAIL_FROM = env.EMAIL_FROM;

export async function verifyEmailConnection(): Promise<void> {
  try {
    if (env.SES_SMTP_USER && env.SES_SMTP_PASS) {
      await emailTransporter.verify();
      console.log('Email transporter verified successfully');
    } else {
      console.warn('Email credentials not configured. Email sending disabled.');
    }
  } catch (error) {
    console.warn('Email transporter verification failed:', error instanceof Error ? error.message : error);
  }
}
