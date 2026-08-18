import { Router } from 'express';
import { searchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/users', searchController.searchUsers);
router.get('/posts', searchController.searchPosts);

export default router;
