import { Request, Response, NextFunction } from 'express';
import { Progress, Lesson, Enrollment } from '../models/index.js';
import { success } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { checkCourseCompletion } from '../services/certificate.service.js';

export async function updateProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { lessonId, courseId } = req.params;
    const { isCompleted, watchedSeconds } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new AppError('Lesson not found', 404);

    const updateData: Record<string, unknown> = {
      lastAccessedAt: new Date(),
    };

    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) updateData.completedAt = new Date();
    }
    if (watchedSeconds !== undefined) {
      updateData.watchedSeconds = watchedSeconds;
    }

    const progress = await Progress.findOneAndUpdate(
      { user: req.user._id, course: courseId, lesson: lessonId },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Check if all lessons are complete and update enrollment status
    if (isCompleted) {
      const allComplete = await checkCourseCompletion(req.user._id.toString(), courseId);
      if (allComplete) {
        await Enrollment.findOneAndUpdate(
          { user: req.user._id, course: courseId, status: 'active' },
          { status: 'completed' }
        );
      }
    }

    success(res, { progress }, 'Progress updated');
  } catch (err) {
    next(err);
  }
}

export async function getCourseProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const { courseId } = req.params;

    const [progressRecords, totalLessons] = await Promise.all([
      Progress.find({ user: req.user._id, course: courseId }),
      Lesson.countDocuments({ course: courseId }),
    ]);

    const completedLessons = progressRecords.filter((p) => p.isCompleted).length;
    const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    success(res, {
      progress: progressRecords,
      summary: {
        totalLessons,
        completedLessons,
        percentage,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getProgressSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);

    const enrollments = await Enrollment.find({
      user: req.user._id,
      status: { $in: ['active', 'completed'] },
    }).populate('course', 'title slug totalLessons');

    const summaries = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedLessons = await Progress.countDocuments({
          user: req.user!._id,
          course: enrollment.course,
          isCompleted: true,
        });

        const course = enrollment.course as any;
        const totalLessons = course.totalLessons || 0;
        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          courseId: course._id,
          courseTitle: course.title,
          courseSlug: course.slug,
          status: enrollment.status,
          completedLessons,
          totalLessons,
          percentage,
        };
      })
    );

    success(res, { summaries });
  } catch (err) {
    next(err);
  }
}
