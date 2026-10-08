import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All recommendation routes require authentication
router.use(authenticate);

router.get('/feed', RecommendationController.getFeed);
router.get('/businesses', RecommendationController.getBusinesses);
router.get('/listings', RecommendationController.getListings);
router.get('/trending', RecommendationController.getTrending);
router.get('/search-suggestions', RecommendationController.getSearchSuggestions);
router.post('/feedback', RecommendationController.submitFeedback);
router.post('/preferences', RecommendationController.setupPreferences);

export default router;
