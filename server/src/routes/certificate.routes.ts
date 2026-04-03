import { Router } from 'express';
import * as certificateController from '../controllers/certificate.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/verify/:certificateNumber', certificateController.verifyCertificate);

router.use(authenticate);

router.post('/courses/:courseId', certificateController.generateCertificate);
router.get('/', certificateController.getCertificates);
router.get('/:id', certificateController.getCertificate);
router.get('/:id/download', certificateController.downloadCertificate);

export default router;
