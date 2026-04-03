import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Enrollment } from '../models/Enrollment.js';
import { AppError } from './errorHandler.middleware.js';

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError('Invalid or expired token', 401));
    }
  }
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (user) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
}

export function requireEnrollment(courseIdParam = 'courseId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      if (req.user.role === 'admin') {
        next();
        return;
      }

      const courseId = req.params[courseIdParam];
      if (!courseId) {
        throw new AppError('Course ID is required', 400);
      }

      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: courseId,
        status: 'active',
      });

      if (!enrollment) {
        throw new AppError('You are not enrolled in this course', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
