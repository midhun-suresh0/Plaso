import { Request, Response, NextFunction } from 'express';
import { AppError, HttpStatus } from '../types';

/**
 * 404 catch-all middleware for undefined routes.
 * Must be mounted after all valid routes.
 */
export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, HttpStatus.NOT_FOUND));
}
