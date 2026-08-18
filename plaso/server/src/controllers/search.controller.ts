import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';

export const searchController = {
  searchUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SearchService.searchUsers(query, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  searchPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await SearchService.searchPosts(query, page, limit);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
