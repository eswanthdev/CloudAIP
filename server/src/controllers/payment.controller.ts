import { Request, Response, NextFunction } from 'express';
import { Payment, Course, Service as ServiceModel } from '../models/index.js';
import { success, error } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import * as stripeService from '../services/stripe.service.js';

export async function createPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { type, itemId } = req.body;

    let amount: number;

    if (type === 'course') {
      const course = await Course.findById(itemId);
      if (!course) throw new AppError('Course not found', 404);
      if (!course.isPublished) throw new AppError('Course is not available', 400);
      amount = course.price;
    } else if (type === 'service') {
      const service = await ServiceModel.findById(itemId);
      if (!service) throw new AppError('Service not found', 404);
      if (!service.price) throw new AppError('Service requires custom pricing', 400);
      amount = service.price;
    } else {
      throw new AppError('Invalid payment type', 400);
    }

    if (amount <= 0) {
      throw new AppError('This item is free', 400);
    }

    const result = await stripeService.createPaymentIntent({
      userId: req.user._id.toString(),
      type,
      itemId,
      amount,
    });

    success(res, result, 'Payment intent created');
  } catch (err) {
    next(err);
  }
}

export async function handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      error(res, 'Missing stripe signature', 400);
      return;
    }

    await stripeService.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);

    const filter: Record<string, unknown> = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'firstName lastName email')
        .populate('course', 'title slug')
        .populate('service', 'title slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter),
    ]);

    success(res, { payments }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const payment = await Payment.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title slug')
      .populate('service', 'title slug');

    if (!payment) throw new AppError('Payment not found', 404);

    if (req.user.role !== 'admin' && payment.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    success(res, { payment });
  } catch (err) {
    next(err);
  }
}
