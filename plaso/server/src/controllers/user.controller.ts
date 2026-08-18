import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AppError, HttpStatus } from '../types';

export class UserController {
  /**
   * Get current authenticated user profile
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const userStats = await UserService.getUserProfileWithStats(userId, userId);
      const user = await UserService.getUserById(userId); // still need base user for completion
      const completionPercentage = UserService.calculateProfileCompletion(user!);

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: {
          user: userStats,
          completionPercentage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      // MongoDB unique index might throw E11000 duplicate key error, handled by error middleware usually
      const updatedUser = await UserService.updateProfile(userId, req.body);
      
      if (!updatedUser) {
        throw new AppError('User not found', HttpStatus.NOT_FOUND);
      }

      const completionPercentage = UserService.calculateProfileCompletion(updatedUser);

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
          completionPercentage,
        },
      });
    } catch (error: any) {
      // Handle MongoDB duplicate key error for username
      if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
        next(new AppError('Username is already taken', HttpStatus.CONFLICT));
      } else if (error.name === 'ValidationError') {
        next(new AppError(error.message, HttpStatus.BAD_REQUEST));
      } else {
        console.error('Update profile error:', error);
        next(error);
      }
    }
  }

  /**
   * Update current user location
   */
  static async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        throw new AppError('Latitude and longitude are required', HttpStatus.BAD_REQUEST);
      }

      const updatedUser = await UserService.updateLocation(userId, Number(latitude), Number(longitude));
      
      if (!updatedUser) {
        throw new AppError('User not found', HttpStatus.NOT_FOUND);
      }

      const completionPercentage = UserService.calculateProfileCompletion(updatedUser);

      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Location updated successfully',
        data: {
          user: updatedUser,
          completionPercentage,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get public profile
   */
  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = (req as any).user.userId;
      const targetUserId = req.params.id as string;
      
      const profile = await UserService.getUserProfileWithStats(targetUserId, currentUserId);
      
      res.status(HttpStatus.OK).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Follow a user
   */
  static async followUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user?.userId;
      const followingId = req.params.id as string;
      
      if (!followerId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

      const followed = await UserService.followUser(followerId, followingId);
      res.status(HttpStatus.OK).json({ success: true, data: { followed } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const followerId = req.user?.userId;
      const followingId = req.params.id as string;
      
      if (!followerId) throw new AppError('Unauthorized', HttpStatus.UNAUTHORIZED);

      const unfollowed = await UserService.unfollowUser(followerId, followingId);
      res.status(HttpStatus.OK).json({ success: true, data: { unfollowed } });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Followers
   */
  static async getFollowers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const followers = await UserService.getFollowers(userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, data: followers });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Following
   */
  static async getFollowing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const following = await UserService.getFollowing(userId, page, limit);
      res.status(HttpStatus.OK).json({ success: true, data: following });
    } catch (error) {
      next(error);
    }
  }
}
