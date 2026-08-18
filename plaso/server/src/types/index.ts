/**
 * Standard API response structure used across all endpoints.
 */
export interface ApiResponse<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Custom application error with HTTP status code.
 * Used by the centralized error handler.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * HTTP status codes used throughout the application.
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Global type augmentation for Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}
