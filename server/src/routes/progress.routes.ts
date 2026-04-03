import { Router } from 'express';
import * as progressController from '../controllers/progress.controller.js';
import { authenticate, requireEnrollment } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.put(
  '/courses/:courseId/lessons/:lessonId',
  requireEnrollment('courseId'),
  progressController.updateProgress
);
router.get(
  '/courses/:courseId',
  requireEnrollment('courseId'),
  progressController.getCourseProgress
);
router.get('/summary', progressController.getProgressSummary);

export default router;
