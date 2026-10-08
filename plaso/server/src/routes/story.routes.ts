import { Router } from 'express';
import { StoryController } from '../controllers/story.controller';
import { authenticate as requireAuth } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload';

const router = Router();

// All story routes require authentication
router.use(requireAuth);

router.post('/', upload.single('storyMedia'), StoryController.createStory);
router.get('/active', StoryController.getActiveStories);
router.post('/:id/view', StoryController.viewStory);
router.post('/:id/react', StoryController.reactToStory);
router.get('/:id/viewers', StoryController.getStoryViewers);
router.delete('/:id', StoryController.deleteStory);

export default router;
