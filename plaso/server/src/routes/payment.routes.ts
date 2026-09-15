import { Router } from 'express';
import PaymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';


const router = Router();

// Webhook route - rawBody is attached in app.ts express.json middleware
router.post('/webhook', PaymentController.webhook);

// Protected routes
router.use(authenticate);

router.post('/create-order', PaymentController.createOrder);
router.post('/verify', PaymentController.verifyPayment);
router.get('/:orderId/status', PaymentController.getStatus);

// Admin only routes
router.post('/:orderId/refund', authorize(UserRole.ADMIN), PaymentController.refund);

export default router;
