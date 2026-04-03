import { Router } from 'express';
import * as leadController from '../controllers/lead.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLeadSchema } from '../validators/service.validator.js';

const router = Router();

// Public route - anyone can submit a lead
router.post('/', validate(createLeadSchema), leadController.createLead);

// Admin routes
router.use(authenticate, authorize('admin'));
router.get('/', leadController.getLeads);
router.patch('/:id', leadController.updateLead);

export default router;
