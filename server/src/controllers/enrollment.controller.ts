import { Request, Response, NextFunction } from 'express';
import { Enrollment, Course } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export async function enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);
    if (!course.isPublished) throw new AppError('Course is not available', 400);

    const existing = await Enrollment.findOne({
      user: req.user._id,
      course: courseId,
    });

    if (existing) {
      if (existing.status === 'cancelled') {
        existing.status = 'active';
        await existing.save();
        success(res, { enrollment: existing }, 'Re-enrolled successfully');
        return;
      }
      throw new AppError('Already enrolled in this course', 409);
    }

    // For free courses, enroll directly. For paid, require paymentId.
    if (course.price > 0 && !req.body.paymentId) {
      throw new AppError('Payment required for this course', 402);
    }

    const enrollment = await Enrollment.create({
      user: req.user._id,
      course: courseId,
      status: 'active',
      paymentId: req.body.paymentId || undefined,
    });

    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    success(res, { enrollment }, 'Enrolled successfully', 201);
  } catch (err) {
    next(err);
  }
}

export async function getEnrollments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);

    const filter: Record<string, unknown> = {};

    // Admin can see all, users see their own
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    } else if (req.query.userId) {
      filter.user = req.query.userId;
    }

    if (req.query.status) filter.status = req.query.status;

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate('course', 'title slug thumbnail category difficulty')
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Enrollment.countDocuments(filter),
    ]);

    success(res, { enrollments }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getEnrollment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('user', 'firstName lastName email');

    if (!enrollment) throw new AppError('Enrollment not found', 404);

    // Ensure user can only see their own enrollment unless admin
    if (req.user.role !== 'admin' && enrollment.user.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    success(res, { enrollment });
  } catch (err) {
    next(err);
  }
}
