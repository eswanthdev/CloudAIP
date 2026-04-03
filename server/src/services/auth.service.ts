import crypto from 'crypto';
import { User, IUser } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'client';
  company?: string;
  phone?: string;
}

export async function register(input: RegisterInput): Promise<{ user: IUser; tokens: AuthTokens }> {
  const existingUser = await User.findOne({ email: input.email });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await hashPassword(input.password);

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    email: input.email,
    passwordHash,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role || 'student',
    company: input.company,
    phone: input.phone,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role);

  await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken },
  });

  try {
    await sendVerificationEmail(user.email, user.firstName, verificationToken);
  } catch {
    // Don't fail registration if email sending fails
    console.warn('Failed to send verification email to', user.email);
  }

  return { user, tokens: { accessToken, refreshToken } };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: IUser; tokens: AuthTokens }> {
  const user = await User.findOne({ email }).select('+passwordHash +refreshTokens');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken(user._id.toString(), user.role);
  const refreshToken = generateRefreshToken(user._id.toString(), user.role);

  // Keep only last 5 refresh tokens
  const tokens = user.refreshTokens || [];
  const updatedTokens = [...tokens.slice(-4), refreshToken];
  await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

  return { user, tokens: { accessToken, refreshToken } };
}

export async function refreshToken(token: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(token);

  const user = await User.findById(payload.userId).select('+refreshTokens');
  if (!user) {
    throw new AppError('User not found', 401);
  }

  const tokenExists = user.refreshTokens?.includes(token);
  if (!tokenExists) {
    // Potential token reuse - clear all refresh tokens
    await User.findByIdAndUpdate(user._id, { refreshTokens: [] });
    throw new AppError('Invalid refresh token. All sessions revoked.', 401);
  }

  const newAccessToken = generateAccessToken(user._id.toString(), user.role);
  const newRefreshToken = generateRefreshToken(user._id.toString(), user.role);

  // Replace old refresh token with new one
  const updatedTokens = (user.refreshTokens || []).map((t: string) =>
    t === token ? newRefreshToken : t
  );
  await User.findByIdAndUpdate(user._id, { refreshTokens: updatedTokens });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function logout(userId: string, token: string): Promise<void> {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: token },
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: resetToken,
    passwordResetExpires: resetExpires,
  });

  try {
    await sendPasswordResetEmail(user.email, user.firstName, resetToken);
  } catch {
    console.warn('Failed to send password reset email to', user.email);
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await hashPassword(newPassword);

  await User.findByIdAndUpdate(user._id, {
    passwordHash,
    passwordResetToken: undefined,
    passwordResetExpires: undefined,
    refreshTokens: [], // Invalidate all sessions
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  }).select('+emailVerificationToken +emailVerificationExpires');

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  await User.findByIdAndUpdate(user._id, {
    isEmailVerified: true,
    emailVerificationToken: undefined,
    emailVerificationExpires: undefined,
  });
}
