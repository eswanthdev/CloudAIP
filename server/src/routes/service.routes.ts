import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createServiceSchema } from '../validators/service.validator.js';

const router = Router();

router.get('/', optionalAuth, serviceController.getServices);
router.get('/:idOrSlug', optionalAuth, serviceController.getService);

router.use(authenticate, authorize('admin'));

router.post('/', validate(createServiceSchema), serviceController.createService);
router.patch('/:id', serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

export default router;
