import { Request, Response, NextFunction } from 'express';
import { ServiceRequest, Service, User } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { sendServiceRequestUpdate } from '../services/email.service.js';

export async function createServiceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const serviceExists = await Service.findById(req.body.service);
    if (!serviceExists) throw new AppError('Service not found', 404);

    const serviceRequest = await ServiceRequest.create({
      ...req.body,
      user: req.user?._id || undefined,
    });

    success(res, { serviceRequest }, 'Service request submitted', 201);
  } catch (err) {
    next(err);
  }
}

export async function getServiceRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);

    const filter: Record<string, unknown> = {};

    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;

    const [requests, total] = await Promise.all([
      ServiceRequest.find(filter)
        .populate('service', 'title slug category')
        .populate('user', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceRequest.countDocuments(filter),
    ]);

    success(res, { serviceRequests: requests }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getServiceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const serviceRequest = await ServiceRequest.findById(req.params.id)
      .populate('service', 'title slug category')
      .populate('user', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName');

    if (!serviceRequest) throw new AppError('Service request not found', 404);

    if (req.user.role !== 'admin' && serviceRequest.user?.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    success(res, { serviceRequest });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowedUpdates = ['status', 'adminNotes', 'assignedTo'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const serviceRequest = await ServiceRequest.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('service', 'title slug')
      .populate('user', 'firstName lastName email');

    if (!serviceRequest) throw new AppError('Service request not found', 404);

    // Send email notification if status changed
    if (req.body.status && serviceRequest.user) {
      try {
        const user = await User.findById(serviceRequest.user);
        const service = await Service.findById(serviceRequest.service);
        if (user && service) {
          await sendServiceRequestUpdate(
            user.email,
            user.firstName,
            service.title,
            req.body.status
          );
        }
      } catch {
        console.warn('Failed to send service request update email');
      }
    }

    success(res, { serviceRequest }, 'Service request updated');
  } catch (err) {
    next(err);
  }
}
