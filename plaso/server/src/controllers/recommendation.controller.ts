import { Request, Response, NextFunction } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { InteractionType } from '../models/userInteraction.model';
import UserPreference from '../models/userPreference.model';
import { HttpStatus } from '../types';

export class RecommendationController {
  /**
   * Get personalized feed
   */
  static async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const radius = parseFloat(req.query.radius as string) || 50;
      
      let userLocation;
      if (req.query.longitude && req.query.latitude) {
        userLocation = {
          coordinates: [parseFloat(req.query.longitude as string), parseFloat(req.query.latitude as string)]
        };
      }

      const feed = await RecommendationService.getPersonalizedFeed(userId, page, limit, userLocation, radius);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: feed
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommended businesses
   */
  static async getBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const radius = parseFloat(req.query.radius as string) || 50;
      
      let userLocation;
      if (req.query.longitude && req.query.latitude) {
        userLocation = {
          coordinates: [parseFloat(req.query.longitude as string), parseFloat(req.query.latitude as string)]
        };
      }

      const businesses = await RecommendationService.getRecommendedBusinesses(userId, userLocation, radius);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: businesses
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recommended listings
   */
  static async getListings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const radius = parseFloat(req.query.radius as string) || 50;
      
      let userLocation;
      if (req.query.longitude && req.query.latitude) {
        userLocation = {
          coordinates: [parseFloat(req.query.longitude as string), parseFloat(req.query.latitude as string)]
        };
      }

      const listings = await RecommendationService.getRecommendedListings(userId, userLocation, radius);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: listings
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get trending content
   */
  static async getTrending(_req: Request, res: Response, next: NextFunction) {
    try {
      const trending = await RecommendationService.getTrending();
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: trending
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search suggestions
   */
  static async getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const query = req.query.q as string;
      let userLocation;
      if (req.query.longitude && req.query.latitude) {
        userLocation = {
          coordinates: [parseFloat(req.query.longitude as string), parseFloat(req.query.latitude as string)]
        };
      }

      const suggestions = await RecommendationService.getSearchSuggestions(userId, query, userLocation);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Post interaction feedback (e.g. NOT_INTERESTED)
   */
  static async submitFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { type, targetId, targetModel } = req.body;
      
      if (!Object.values(InteractionType).includes(type)) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid interaction type' });
        return;
      }

      await RecommendationService.trackInteraction(userId, type as InteractionType, targetId, targetModel);
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Feedback recorded successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup initial preferences
   */
  static async setupPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { categories } = req.body;
      
      await UserPreference.findOneAndUpdate(
        { user: userId },
        { 
          $set: { 
            preferredCategories: categories 
          }
        },
        { upsert: true, new: true }
      );
      
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Preferences saved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
