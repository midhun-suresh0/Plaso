import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

// Public / Authenticated discovery routes
router.get('/listing/:listingId', authenticate, ReviewController.getListingReviews);
router.get('/listing/:listingId/stats', authenticate, ReviewController.getListingRatingStats);
router.get('/business/:businessId', authenticate, ReviewController.getBusinessReviews);
router.get('/business/:businessId/stats', authenticate, ReviewController.getBusinessRatingStats);

// User specific routes
router.use(authenticate);

// Get my reviews
router.get('/me', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.getMyReviews);
router.get('/order/:orderId', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.getReviewByOrder);

// Create, update, delete own review
router.post('/', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.createReview);
router.patch('/:id', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.updateReview);
router.delete('/:id', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.deleteReview);

// Interactions
router.post('/:id/report', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.reportReview);
router.post('/:id/helpful', authorize(UserRole.USER, UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.markHelpful);

// Business Owner Routes
router.post('/:id/respond', authorize(UserRole.BUSINESS_OWNER, UserRole.ADMIN), ReviewController.respondToReview);

// Admin Routes
router.get('/admin/all', authorize(UserRole.ADMIN), ReviewController.getAdminReviews);
router.patch('/admin/:id/moderate', authorize(UserRole.ADMIN), ReviewController.moderateReview);

export default router;
