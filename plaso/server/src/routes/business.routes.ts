import { Router } from 'express';
import { BusinessController } from '../controllers/business.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

import { upload } from '../middleware/upload';

const router = Router();

// Ensure all business routes are authenticated
router.use(authenticate);

const businessUpload = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]);

// --- Public / Discovery Routes (Any authenticated user) ---
router.get('/nearby', BusinessController.getNearbyBusinesses);
router.get('/search', BusinessController.searchBusinesses);
router.get('/:id', BusinessController.getBusinessById);

// --- Business Owner Routes ---
router.post(
  '/',
  authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN),
  businessUpload,
  BusinessController.createBusiness
);
router.get(
  '/owner/me',
  authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN),
  BusinessController.getOwnerBusinesses
);
router.patch(
  '/owner/me',
  authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN),
  businessUpload,
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
