import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import courseRoutes from './course.routes.js';
import moduleRoutes from './module.routes.js';
import lessonRoutes from './lesson.routes.js';
import enrollmentRoutes from './enrollment.routes.js';
import progressRoutes from './progress.routes.js';
import certificateRoutes from './certificate.routes.js';
import serviceRoutes from './service.routes.js';
import serviceRequestRoutes from './serviceRequest.routes.js';
import leadRoutes from './lead.routes.js';
import paymentRoutes from './payment.routes.js';
import uploadRoutes from './upload.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courses', courseRoutes);
router.use('/', moduleRoutes);       // Uses /courses/:courseId/modules and /modules/:id
router.use('/', lessonRoutes);       // Uses /courses/:courseId/modules/:moduleId/lessons etc.
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);
router.use('/certificates', certificateRoutes);
router.use('/services', serviceRoutes);
router.use('/service-requests', serviceRequestRoutes);
router.use('/leads', leadRoutes);
router.use('/payments', paymentRoutes);
router.use('/uploads', uploadRoutes);
router.use('/admin', adminRoutes);

export default router;
