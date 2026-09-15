import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '../models/order.model';
import { HttpStatus } from '../types';

export class OrderController {
  static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const checkoutData = req.body;
      const orders = await OrderService.createOrder(req.user!.userId, checkoutData);
      res.status(HttpStatus.CREATED).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }

  static async getMyOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderService.getMyOrders(req.user!.userId);
      res.status(HttpStatus.OK).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }

  static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.getOrderById(req.params.id as string, req.user!.userId, req.user!.role);
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const order = await OrderService.cancelOrder(req.params.id as string, req.user!.userId, reason || 'Cancelled by user');
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  static async confirmOrderCompletion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const order = await OrderService.confirmOrderCompletion(req.params.id as string, req.user!.userId);
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  static async disputeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const order = await OrderService.disputeOrder(req.params.id as string, req.user!.userId, reason);
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  // Business Endpoints
  static async getBusinessOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderService.getBusinessOrders(req.params.businessId as string, req.user!.userId);
      res.status(HttpStatus.OK).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const order = await OrderService.updateBusinessOrderStatus(req.params.id as string, req.user!.userId, status as OrderStatus);
      res.status(HttpStatus.OK).json({ success: true, order });
    } catch (error) {
      next(error);
    }
  }

  // Admin Endpoints
  static async getAdminOrders(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await OrderService.getAdminOrders();
      res.status(HttpStatus.OK).json({ success: true, orders });
    } catch (error) {
      next(error);
    }
  }
}
