import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/presigned-url', authorize('admin'), uploadController.getPresignedUploadUrl);
router.delete('/', authorize('admin'), uploadController.deleteUpload);

export default router;
