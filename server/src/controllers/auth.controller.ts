import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { success, error } from '../utils/apiResponse.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.register(req.body);
    success(res, {
      user: result.user,
      tokens: result.tokens,
    }, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    success(res, {
      user: result.user,
      tokens: result.tokens,
    }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      error(res, 'Refresh token is required', 400);
      return;
    }
    const tokens = await authService.refreshToken(token);
    success(res, { tokens }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: token } = req.body;
    if (req.user && token) {
      await authService.logout(req.user._id.toString(), token);
    }
    success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.forgotPassword(req.body.email);
    success(res, null, 'If the email exists, a reset link has been sent');
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    success(res, null, 'Password reset successful');
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      error(res, 'Verification token is required', 400);
      return;
    }
    await authService.verifyEmail(token);
    success(res, null, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      error(res, 'Not authenticated', 401);
      return;
    }
    success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
}
