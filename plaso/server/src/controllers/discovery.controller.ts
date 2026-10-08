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
  },

  getNearbyEntities: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { latitude, longitude, radius, category, type, search } = req.query;
      
      if (!latitude || !longitude) {
        res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        return;
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        res.status(400).json({ success: false, message: 'Invalid latitude' });
        return;
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        res.status(400).json({ success: false, message: 'Invalid longitude' });
        return;
      }

      const rad = radius ? parseFloat(radius as string) : 5; // Default 5km

      const result = await DiscoveryService.getNearbyEntities(
        lat, 
        lng, 
        rad, 
        category as string, 
        type as string, 
        search as string
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
};
