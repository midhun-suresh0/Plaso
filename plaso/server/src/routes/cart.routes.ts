import { Router } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

// All cart routes require authentication and USER role
router.use(authenticate);
router.use(authorize(UserRole.USER));

router.get('/', CartController.getCart);
router.post('/items', CartController.addItem);
router.patch('/items/:itemId', CartController.updateItemQuantity);
router.delete('/items/:itemId', CartController.removeItem);
router.delete('/', CartController.clearCart);

export default router;
