import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../models/user.model';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Analytics
router.get('/analytics/overview', AdminController.getOverview);
router.get('/analytics/users', AdminController.getUserAnalytics);
router.get('/analytics/businesses', AdminController.getBusinessAnalytics);
router.get('/analytics/marketplace', AdminController.getMarketplaceAnalytics);
router.get('/analytics/orders', AdminController.getOrderAnalytics);
router.get('/analytics/revenue', AdminController.getRevenueAnalytics);
router.get('/analytics/social', AdminController.getSocialAnalytics);
router.get('/analytics/reviews', AdminController.getReviewAnalytics);
router.get('/analytics/trends', AdminController.getTrendsAnalytics);
router.get('/analytics/top', AdminController.getTopEntities);
router.get('/analytics/intelligence', AdminController.getIntelligenceAnalytics);

// Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);

router.get('/businesses', AdminController.getBusinesses);
router.patch('/businesses/:id/status', AdminController.updateBusinessStatus);

router.get('/listings', AdminController.getListings);
router.patch('/listings/:id/moderate', AdminController.moderateListing);

router.get('/reports', AdminController.getReports);
router.patch('/reports/:id', AdminController.updateReportStatus);

router.patch('/content/:type/:id/moderate', AdminController.moderateContent);

router.get('/audit-logs', AdminController.getAuditLogs);
router.get('/system-health', AdminController.getSystemHealth);

export default router;
