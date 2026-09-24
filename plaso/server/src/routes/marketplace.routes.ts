import express from 'express';
import {
  createListing,
  updateListing,
  getListingById,
  getNearbyListings,
  searchListings,
  getBusinessListings,
  getOwnerListings,
  deleteListing,
  updateListingStatus,
  getAllListingsForAdmin
} from '../controllers/marketplace.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (though still require authentication to use the app in general)
router.get('/nearby', authenticate, getNearbyListings);
router.get('/search', authenticate, searchListings);
router.get('/business/:businessId', authenticate, getBusinessListings);
router.get('/:id', authenticate, getListingById);

// Owner routes
router.get('/me/listings', authenticate, authorize('BUSINESS_OWNER', 'ADMIN'), getOwnerListings);
router.post('/', authenticate, authorize('BUSINESS_OWNER', 'ADMIN'), createListing);
router.patch('/:id', authenticate, authorize('BUSINESS_OWNER', 'ADMIN'), updateListing);
router.delete('/:id', authenticate, authorize('BUSINESS_OWNER', 'ADMIN'), deleteListing);
router.patch('/:id/status', authenticate, authorize('BUSINESS_OWNER', 'ADMIN'), updateListingStatus);

// Admin routes
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllListingsForAdmin);

export default router;
