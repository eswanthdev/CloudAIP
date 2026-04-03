import { Router } from 'express';
import * as serviceRequestController from '../controllers/serviceRequest.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createServiceRequestSchema } from '../validators/service.validator.js';

const router = Router();

router.post('/', optionalAuth, validate(createServiceRequestSchema), serviceRequestController.createServiceRequest);

router.use(authenticate);

router.get('/', serviceRequestController.getServiceRequests);
router.get('/:id', serviceRequestController.getServiceRequest);
router.patch('/:id', authorize('admin'), serviceRequestController.updateServiceRequest);

export default router;
