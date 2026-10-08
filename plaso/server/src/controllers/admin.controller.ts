import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { HttpStatus } from '../types';

export class AdminController {
  static async getOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const overview = await AdminService.getOverview(range);
      res.status(HttpStatus.OK).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }

  static async getUserAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getUserAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getBusinessAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMarketplaceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getMarketplaceAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getOrderAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getRevenueAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getRevenueAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getSocialAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getSocialAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getReviewAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getReviewAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getTrendsAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || '30d';
      const data = await AdminService.getTrendsAnalytics(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getTopEntities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const range = (req.query.range as string) || 'all';
      const data = await AdminService.getTopEntities(range);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getIntelligenceAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getIntelligenceAnalytics();
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const role = req.query.role ? String(req.query.role) : undefined;
      const data = await AdminService.getUsers(page, limit, search, role);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getUserDetails(String(req.params.id));
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reason } = req.body;
      const data = await AdminService.updateUserStatus(String(req.params.id), status, req.user!.userId, reason);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const data = await AdminService.getBusinesses(page, limit, search, status);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reason } = req.body;
      const data = await AdminService.updateBusinessStatus(String(req.params.id), status, req.user!.userId, reason);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getListings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const data = await AdminService.getListings(page, limit, search, status);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async moderateListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, reason } = req.body;
      const data = await AdminService.moderateListing(String(req.params.id), status, req.user!.userId, reason);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search ? String(req.query.search) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const targetType = req.query.targetType ? String(req.query.targetType) : undefined;
      const data = await AdminService.getReports(page, limit, search, status, targetType);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, note } = req.body;
      const data = await AdminService.updateReportStatus(String(req.params.id), status, req.user!.userId, note);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async moderateContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = String(req.params.type);
      const id = String(req.params.id);
      const { action, reason } = req.body;
      const data = await AdminService.moderateContent(type, id, action, req.user!.userId, reason);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const action = req.query.action ? String(req.query.action) : undefined;
      const targetType = req.query.targetType ? String(req.query.targetType) : undefined;
      const adminId = req.query.adminId ? String(req.query.adminId) : undefined;
      const data = await AdminService.getAuditLogs(page, limit, action, targetType, adminId);
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AdminService.getSystemHealth();
      res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
