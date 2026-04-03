import { Request, Response, NextFunction } from 'express';
import { User } from '../models/index.js';
import { success, error } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);
    const filter: Record<string, unknown> = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    success(res, { users }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    success(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'company', 'avatar', 'role'];
    const updates: Record<string, unknown> = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    success(res, { user }, 'User updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    success(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
}
