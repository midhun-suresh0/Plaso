import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// USER routes
router.post('/', authorize(UserRole.USER, UserRole.ADMIN), OrderController.createOrder);
router.get('/', authorize(UserRole.USER, UserRole.ADMIN), OrderController.getMyOrders);
router.patch('/:id/cancel', authorize(UserRole.USER, UserRole.ADMIN), OrderController.cancelOrder);
router.patch('/:id/complete', authorize(UserRole.USER, UserRole.ADMIN), OrderController.confirmOrderCompletion);
router.patch('/:id/dispute', authorize(UserRole.USER, UserRole.ADMIN), OrderController.disputeOrder);

// BUSINESS_OWNER routes
router.get('/business/:businessId', authorize(UserRole.BUSINESS_OWNER, UserRole.ADMIN), OrderController.getBusinessOrders);
router.patch('/business/:id/status', authorize(UserRole.BUSINESS_OWNER, UserRole.ADMIN), OrderController.updateBusinessOrderStatus);

// ADMIN routes
router.get('/admin/all', authorize(UserRole.ADMIN), OrderController.getAdminOrders);

// Shared GET route (logic inside controller limits access)
router.get('/:id', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), OrderController.getOrderById);

export default router;
