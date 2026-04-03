import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', adminController.getStats);
router.get('/recent-activity', adminController.getRecentActivity);

export default router;
