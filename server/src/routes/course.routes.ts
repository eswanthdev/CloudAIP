import { Router } from 'express';
import * as courseController from '../controllers/course.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';

const router = Router();

router.get('/', optionalAuth, courseController.getCourses);
router.get('/:idOrSlug', optionalAuth, courseController.getCourse);

router.use(authenticate, authorize('admin'));

router.post('/', validate(createCourseSchema), courseController.createCourse);
router.patch('/:id', validate(updateCourseSchema), courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.patch('/:id/toggle-publish', courseController.togglePublish);

export default router;
