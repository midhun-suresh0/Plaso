import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import { AppError, HttpStatus } from '../types';

export const notificationController = {
  getNotifications: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await NotificationService.getNotifications(userId, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const notificationId = req.params.id as string;

      const notification = await NotificationService.markAsRead(notificationId, userId);
      if (!notification) {
        return next(new AppError('Notification not found', HttpStatus.NOT_FOUND));
      }

      res.json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const modifiedCount = await NotificationService.markAllAsRead(userId);
      res.json({ success: true, data: { modifiedCount } });
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const count = await NotificationService.getUnreadCount(userId);
      res.json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  }
};
