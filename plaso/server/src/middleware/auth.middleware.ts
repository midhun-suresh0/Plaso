import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AppError, HttpStatus } from '../types';

/**
 * Middleware to authenticate requests via JWT
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Verify token and extract payload
    const payload = AuthService.verifyToken(token);

    // Attach to request
    req.user = payload;

    next();
  } catch (error: any) {
    // If it's a JWT error, return a clean 401
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new AppError('Invalid or expired token', HttpStatus.UNAUTHORIZED));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to authorize specific roles
 * @param allowedRoles Array of roles permitted to access the route
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', HttpStatus.UNAUTHORIZED));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', HttpStatus.FORBIDDEN));
    }

    next();
  };
};
