import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.patch('/:id', postController.editComment);
router.delete('/:id', postController.deleteComment);

export default router;
