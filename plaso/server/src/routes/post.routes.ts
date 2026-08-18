import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all post routes
router.use(authenticate);

router.post('/', postController.createPost);
router.get('/feed', postController.getFeed);
router.get('/user/:userId', postController.getUserPosts);
router.get('/saved', postController.getSavedPosts); // Using /saved for saved posts
router.get('/:id', postController.getPost);
router.delete('/:id', postController.deletePost);

// Likes
router.post('/:id/like', postController.likePost);
router.delete('/:id/like', postController.unlikePost);

// Comments related to a post
router.get('/:id/comments', postController.getComments);
router.post('/:id/comments', postController.addComment);

// Saves
router.post('/:id/save', postController.savePost);
router.delete('/:id/save', postController.unsavePost);

export default router;
