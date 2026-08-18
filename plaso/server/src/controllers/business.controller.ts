import { Request, Response, NextFunction } from 'express';
import { BusinessService } from '../services/business.service';
import { HttpStatus } from '../types';
import { BusinessStatus } from '../models/business.model';

export class BusinessController {
  // --- Business Owner Endpoints ---

  static async createBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const business = await BusinessService.createBusiness(ownerId, req.body);
      res.status(HttpStatus.CREATED).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  static async getMyBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const business = await BusinessService.getOwnerBusiness(ownerId);
      res.status(HttpStatus.OK).json({ success: true, data: business });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerId = req.user!.userId;
      const business = await BusinessService.updateBusiness(ownerId, req.body);
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
