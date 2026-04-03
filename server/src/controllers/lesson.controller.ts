import { Request, Response, NextFunction } from 'express';
import { Lesson, Course } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { getSignedDownloadUrl } from '../services/s3.service.js';

export async function createLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { courseId, moduleId } = req.params;

    const lastLesson = await Lesson.findOne({ module: moduleId }).sort({ order: -1 });
    const order = lastLesson ? lastLesson.order + 1 : 0;

    const lesson = await Lesson.create({
      ...req.body,
      course: courseId,
      module: moduleId,
      order: req.body.order ?? order,
    });

    // Update total lessons count on course
    const totalLessons = await Lesson.countDocuments({ course: courseId });
    await Course.findByIdAndUpdate(courseId, { totalLessons });

    success(res, { lesson }, 'Lesson created', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const allowedUpdates = ['title', 'description', 'type', 'duration', 'videoKey', 'content', 'resources', 'isFree'];
    const updates: Record<string, unknown> = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const lesson = await Lesson.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    success(res, { lesson }, 'Lesson updated');
  } catch (err) {
    next(err);
  }
}

export async function deleteLesson(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await Lesson.findByIdAndDelete(req.params.id);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    // Re-order remaining lessons in the module
    await Lesson.updateMany(
      { module: lesson.module, order: { $gt: lesson.order } },
      { $inc: { order: -1 } }
    );

    // Update total lessons count
    const totalLessons = await Lesson.countDocuments({ course: lesson.course });
    await Course.findByIdAndUpdate(lesson.course, { totalLessons });

    success(res, null, 'Lesson deleted');
  } catch (err) {
    next(err);
  }
}

export async function getVideoUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      throw new AppError('Lesson not found', 404);
    }

    if (!lesson.videoKey) {
      throw new AppError('No video associated with this lesson', 400);
    }

    const url = await getSignedDownloadUrl(lesson.videoKey, 7200);
    success(res, { url });
  } catch (err) {
    next(err);
  }
}

export async function reorderLessons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { moduleId } = req.params;
    const { lessonIds } = req.body as { lessonIds: string[] };

    if (!Array.isArray(lessonIds)) {
      throw new AppError('lessonIds must be an array', 400);
    }

    const bulkOps = lessonIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, module: moduleId },
        update: { order: index },
      },
    }));

    await Lesson.bulkWrite(bulkOps);

    const lessons = await Lesson.find({ module: moduleId }).sort({ order: 1 });
    success(res, { lessons }, 'Lessons reordered');
  } catch (err) {
    next(err);
  }
}
