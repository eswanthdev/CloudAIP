import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Webhook needs raw body, handled separately in app.ts
router.post('/webhook', paymentController.handleWebhook);

router.use(authenticate);

router.post('/create-intent', paymentController.createPaymentIntent);
router.get('/', paymentController.getPayments);
router.get('/:id', paymentController.getPayment);

export default router;
