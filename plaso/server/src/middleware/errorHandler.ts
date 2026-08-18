import { Request, Response, NextFunction } from 'express';
import { AppError, HttpStatus } from '../types';

/**
 * Centralized error-handling middleware.
 * Catches all errors and returns a consistent JSON response.
 * Does not expose sensitive server/database information.
 */
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('ERROR MIDDLEWARE CAUGHT:', err);

  // Handle known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid resource identifier',
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if ('code' in err && (err as Record<string, unknown>).code === 11000) {
    res.status(HttpStatus.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
    });
    return;
  }

  // Handle unknown/unexpected errors
  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || 'Internal server error',
    stack: err.stack,
  });
}
