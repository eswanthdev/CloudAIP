import { Request, Response, NextFunction } from 'express';
import { Course, Module, Lesson } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { parsePagination, paginationMeta } from '../utils/pagination.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import mongoose from 'mongoose';

export async function getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit, skip } = parsePagination(req.query.page as string, req.query.limit as string);
    const filter: Record<string, unknown> = {};

    // Public listing only shows published courses unless admin
    if (!req.user || req.user.role !== 'admin') {
      filter.isPublished = true;
    }

    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.isFeatured === 'true') filter.isFeatured = true;

    if (req.query.search) {
      filter.$text = { $search: req.query.search as string };
    }

    const sortOptions: Record<string, 1 | -1> = {};
    const sortParam = req.query.sort as string;
    if (sortParam === 'price') sortOptions.price = 1;
    else if (sortParam === '-price') sortOptions.price = -1;
    else if (sortParam === 'rating') sortOptions.rating = -1;
    else if (sortParam === 'popular') sortOptions.enrollmentCount = -1;
    else sortOptions.createdAt = -1;

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate('instructor', 'firstName lastName avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    success(res, { courses }, undefined, 200, { pagination: paginationMeta(total, { page, limit, skip }) });
  } catch (err) {
    next(err);
  }
}

export async function getCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const identifier = req.params.idOrSlug;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

    const course = await Course.findOne(
      isObjectId ? { _id: identifier } : { slug: identifier }
    ).populate('instructor', 'firstName lastName avatar');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Also fetch modules and lessons
    const modules = await Module.find({ course: course._id }).sort({ order: 1 });
    const lessons = await Lesson.find({ course: course._id }).sort({ order: 1 });

    success(res, { course, modules, lessons });
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const course = await Course.create({
      ...req.body,
      instructor: req.user._id,
    });

    success(res, { course }, 'Course created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('instructor', 'firstName lastName avatar');

    if (!course) {
      throw new AppError('Course not found', 404);
    }

    success(res, { course }, 'Course updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteCourse(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    // Clean up related data
    await Promise.all([
      Module.deleteMany({ course: course._id }),
      Lesson.deleteMany({ course: course._id }),
    ]);

    success(res, null, 'Course deleted');
  } catch (err) {
    next(err);
  }
}

export async function togglePublish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }

    course.isPublished = !course.isPublished;
    await course.save();

    success(res, { course }, `Course ${course.isPublished ? 'published' : 'unpublished'}`);
  } catch (err) {
    next(err);
  }
}
