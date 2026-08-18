import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Protect all user routes
router.use(authenticate);

// Profile routes
router.get('/me', UserController.getMe);
router.get('/me/followers', (req, res, next) => { (req.params as any).id = (req as any).user.userId; UserController.getFollowers(req, res, next); });
router.get('/me/following', (req, res, next) => { (req.params as any).id = (req as any).user.userId; UserController.getFollowing(req, res, next); });
router.patch('/me', UserController.updateProfile);
router.patch('/me/location', UserController.updateLocation);
router.get('/me/saved-posts', postController.getSavedPosts);

// Follow routes
router.post('/:id/follow', UserController.followUser);
router.delete('/:id/follow', UserController.unfollowUser);
router.get('/:id/followers', UserController.getFollowers);
router.get('/:id/following', UserController.getFollowing);
router.get('/me/followers', UserController.getFollowers); // Will use 'me' if needed, but handled by the same controller if we adjust it. Actually, wait. 'me' will be parsed as id 'me'.
// Wait, /:id will parse 'me'. So I should put /me/... above /:id

// Public Profile
router.get('/:id', UserController.getPublicProfile);

export default router;
