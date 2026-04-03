import { Router } from 'express';
import * as moduleController from '../controllers/module.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.post('/courses/:courseId/modules', moduleController.createModule);
router.patch('/modules/:id', moduleController.updateModule);
router.delete('/modules/:id', moduleController.deleteModule);
router.put('/courses/:courseId/modules/reorder', moduleController.reorderModules);

export default router;
