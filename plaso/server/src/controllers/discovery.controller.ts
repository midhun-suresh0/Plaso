import { Request, Response, NextFunction } from 'express';
import { DiscoveryService } from '../services/discovery.service';

export const discoveryController = {
  getSuggestedUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const limit = parseInt(req.query.limit as string) || 5;

      const suggestions = await DiscoveryService.getSuggestedUsers(userId, limit);
      res.json({ success: true, data: suggestions });
    } catch (error) {
      next(error);
    }
  }
};
