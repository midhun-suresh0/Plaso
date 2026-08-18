import { Request, Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Health check controller.
 * Returns a simple response confirming the API is running.
 */
export function getHealthStatus(_req: Request, res: Response): void {
  const response: ApiResponse = {
    success: true,
    message: 'Plaso API is running',
  };

  res.status(200).json(response);
}
