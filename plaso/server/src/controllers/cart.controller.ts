import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { HttpStatus } from '../types';

export class CartController {
  static async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await CartService.getCart(req.user!.userId);
      res.status(HttpStatus.OK).json({ success: true, cart: cart || { items: [] } });
    } catch (error) {
      next(error);
    }
  }

  static async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { listingId, quantity } = req.body;
      const cart = await CartService.addItem(req.user!.userId, listingId, quantity || 1);
      res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      next(error);
    }
  }

  static async updateItemQuantity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const cart = await CartService.updateItemQuantity(req.user!.userId, itemId as string, quantity);
      res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      next(error);
    }
  }

  static async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { itemId } = req.params;
      const cart = await CartService.removeItem(req.user!.userId, itemId as string);
      res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      next(error);
    }
  }

  static async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await CartService.clearCart(req.user!.userId);
      res.status(HttpStatus.OK).json({ success: true, message: 'Cart cleared successfully' });
    } catch (error) {
      next(error);
    }
  }
}
