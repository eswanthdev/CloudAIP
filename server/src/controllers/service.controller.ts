import { Request, Response, NextFunction } from 'express';
import { Service } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import mongoose from 'mongoose';

export async function getServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);

    const filter: Record<string, unknown> = {};

    if (!req.user || req.user.role !== 'admin') {
      filter.isPublished = true;
    }

    if (req.query.category) filter.category = req.query.category;
    if (req.query.isFeatured === 'true') filter.isFeatured = true;

    const [services, total] = await Promise.all([
      Service.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      Service.countDocuments(filter),
    ]);

    success(res, { services }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.idOrSlug;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const service = await Service.findOne(
      isObjectId ? { _id: identifier } : { slug: identifier }
    );

    if (!service) throw new AppError('Service not found', 404);

    success(res, { service });
  } catch (err) {
    next(err);
  }
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await Service.create(req.body);
    success(res, { service }, 'Service created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!service) throw new AppError('Service not found', 404);

    success(res, { service }, 'Service updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) throw new AppError('Service not found', 404);

    success(res, null, 'Service deleted');
  } catch (err) {
    next(err);
  }
}
