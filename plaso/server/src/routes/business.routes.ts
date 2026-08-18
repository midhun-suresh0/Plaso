import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

// Ensure all business routes are authenticated
router.use(authenticate);

// --- Public / Discovery Routes (Any authenticated user) ---
router.get('/nearby', BusinessController.getNearbyBusinesses);
router.get('/search', BusinessController.searchBusinesses);
router.get('/:id', BusinessController.getBusinessById);

// --- Business Owner Routes ---
router.post(
  '/',
  authorize(UserRole.BUSINESS_OWNER),
  BusinessController.createBusiness
);
router.get(
  '/owner/me',
  authorize(UserRole.BUSINESS_OWNER),
  BusinessController.getMyBusiness
);
router.patch(
  '/owner/me',
  authorize(UserRole.BUSINESS_OWNER),
  BusinessController.updateMyBusiness
);

// --- Admin Routes ---
router.get(
  '/admin/list',
  authorize(UserRole.ADMIN),
  BusinessController.getAdminBusinesses
);
router.patch(
  '/admin/:id/status',
  authorize(UserRole.ADMIN),
  BusinessController.updateBusinessStatus
);

export default router;
