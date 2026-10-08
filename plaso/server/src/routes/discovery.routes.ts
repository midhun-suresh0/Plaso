import { Router } from 'express';
import { discoveryController } from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/users/suggestions', discoveryController.getSuggestedUsers);
router.get('/nearby', discoveryController.getNearbyEntities);

export default router;
