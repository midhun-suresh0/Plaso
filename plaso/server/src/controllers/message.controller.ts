import { Request, Response, NextFunction } from 'express';
import { MessageService } from '../services/message.service';
import { HttpStatus } from '../types';
import { MessageType } from '../models/message.model';

export class MessageController {
  static async getConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversations = await MessageService.getConversations(userId);
      res.status(HttpStatus.OK).json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  }

  static async findOrCreateConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { targetUserId, businessId, listingId } = req.body;
      
      const conversation = await MessageService.findOrCreateConversation(
        userId,
        targetUserId,
        businessId,
        listingId
      );
      
      res.status(HttpStatus.OK).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  static async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      
      const conversation = await MessageService.getConversation(conversationId, userId);
      res.status(HttpStatus.OK).json({ success: true, data: conversation });
    } catch (error) {
      next(error);
    }
  }

  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;
      
      const messages = await MessageService.getMessages(conversationId, userId, limit, skip);
      res.status(HttpStatus.OK).json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }

  static async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      const { content, messageType } = req.body;
      
      const message = await MessageService.sendMessage(
        conversationId,
        userId,
        content,
        messageType as MessageType
      );
      
      res.status(HttpStatus.CREATED).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const conversationId = req.params.id as string;
      
      await MessageService.markAsRead(conversationId, userId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Marked as read' });
    } catch (error) {
      next(error);
    }
  }

  static async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const count = await MessageService.getUnreadCount(userId);
      res.status(HttpStatus.OK).json({ success: true, data: count });
    } catch (error) {
      next(error);
    }
  }
}
