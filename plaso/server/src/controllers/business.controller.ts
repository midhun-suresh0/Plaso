import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service';
import { HttpStatus } from '../types';
import { BusinessStatus } from '../models/business.model';
import { RecommendationService } from '../services/recommendation.service';
import { InteractionType } from '../models/userInteraction.model';

export class BusinessController {
  // --- Business Owner Endpoints ---

  static async createBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const data = { ...req.body };

      // Handle uploaded files if present
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files.logo && files.logo[0]) {
          data.logo = `/uploads/businesses/${files.logo[0].filename}`;
        }
        if (files.coverImage && files.coverImage[0]) {
          data.coverImage = `/uploads/businesses/${files.coverImage[0].filename}`;
        }
      }

      // If location was stringified in FormData, parse it
      if (typeof data.location === 'string') {
        try {
          data.location = JSON.parse(data.location);
        } catch {
          // ignore
        }
      }

      const business = await BusinessService.createBusiness(ownerId, data);
      res.status(HttpStatus.CREATED).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  static async getOwnerBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const businesses = await BusinessService.getOwnerBusinesses(ownerId);
      res.status(HttpStatus.OK).json({ success: true, data: businesses });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const { businessId, ...updateData } = req.body;
      if (!businessId) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'businessId is required' });
        return;
      }

      // Handle uploaded files if present
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files.logo && files.logo[0]) {
          updateData.logo = `/uploads/businesses/${files.logo[0].filename}`;
        }
        if (files.coverImage && files.coverImage[0]) {
          updateData.coverImage = `/uploads/businesses/${files.coverImage[0].filename}`;
        }
      }

      if (typeof updateData.location === 'string') {
        try {
          updateData.location = JSON.parse(updateData.location);
        } catch {
          // ignore
        }
      }

      const business = await BusinessService.updateBusiness(ownerId, businessId, updateData);
      res.status(HttpStatus.OK).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  // --- Public Endpoints ---

  static async getNearbyBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const { lng, lat, radius, category } = req.query;
      
      const longitude = parseFloat(lng as string);
      const latitude = parseFloat(lat as string);
      const maxDistance = radius ? parseFloat(radius as string) : 5; // default 5km

      if (isNaN(longitude) || isNaN(latitude)) {
        res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: 'Invalid coordinates' });
        return;
      }

      const businesses = await BusinessService.getNearbyBusinesses(longitude, latitude, maxDistance, category as string);
      res.status(HttpStatus.OK).json({ success: true, data: businesses });
    } catch (error) {
      next(error);
    }
  }

  static async searchBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, category, page, limit } = req.query;
      const result = await BusinessService.searchBusinesses(
        q as string, 
        category as string, 
        page ? parseInt(page as string) : 1, 
        limit ? parseInt(limit as string) : 20
      );
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const business = await BusinessService.getBusinessById(id as string);
      
      // If user is authenticated, track the view
      if (req.user) {
        RecommendationService.trackInteraction(
          req.user!.userId,
          InteractionType.BUSINESS_VIEW,
          id as string,
          'Business'
        );
      }

      res.status(HttpStatus.OK).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  // --- Admin Endpoints ---

  static async getAdminBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const result = await BusinessService.getAdminBusinesses(
        status as BusinessStatus,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.status(HttpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const business = await BusinessService.updateBusinessStatus(id as string, status as BusinessStatus);
      res.status(HttpStatus.OK).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }
}
