import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticate as requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Protect all messaging routes
router.use(requireAuth);

router.get('/unread-count', MessageController.getUnreadCount);
router.get('/', MessageController.getConversations);
router.post('/', MessageController.findOrCreateConversation);
router.get('/:id', MessageController.getConversation);
router.get('/:id/messages', MessageController.getMessages);
router.post('/:id/messages', MessageController.sendMessage);
router.patch('/:id/read', MessageController.markAsRead);

export default router;
