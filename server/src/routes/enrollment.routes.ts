import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', enrollmentController.enroll);
router.get('/', enrollmentController.getEnrollments);
router.get('/:id', enrollmentController.getEnrollment);

export default router;
