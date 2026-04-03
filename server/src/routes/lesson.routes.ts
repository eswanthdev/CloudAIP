import { Router } from 'express';
import * as lessonController from '../controllers/lesson.controller.js';
import { authenticate, requireEnrollment } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

// Admin routes
router.post(
  '/courses/:courseId/modules/:moduleId/lessons',
  authenticate,
  authorize('admin'),
  lessonController.createLesson
);
router.patch('/lessons/:id', authenticate, authorize('admin'), lessonController.updateLesson);
router.delete('/lessons/:id', authenticate, authorize('admin'), lessonController.deleteLesson);
router.put(
  '/modules/:moduleId/lessons/reorder',
  authenticate,
  authorize('admin'),
  lessonController.reorderLessons
);

// Student routes - require enrollment
router.get(
  '/courses/:courseId/lessons/:id/video',
  authenticate,
  requireEnrollment('courseId'),
  lessonController.getVideoUrl
);

export default router;
