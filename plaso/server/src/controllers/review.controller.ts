import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { HttpStatus } from '../types';

export class ReviewController {
  static async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.createReview(req.user!.userId, req.body);
      res.status(HttpStatus.CREATED).json({ success: true, message: 'Review submitted successfully', data: review });
    } catch (error) {
      next(error);
    }
  }

  static async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.updateReview(req.user!.userId, (req.params.id as string), req.body);
      res.status(HttpStatus.OK).json({ success: true, message: 'Review updated successfully', data: review });
    } catch (error) {
      next(error);
    }
  }

  static async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      await ReviewService.deleteReview(req.user!.userId, (req.params.id as string), isAdmin);
      res.status(HttpStatus.OK).json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async getListingReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy } = req.query;
      const data = await ReviewService.getListingReviews(
        (req.params.listingId as string),
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        sortBy as 'newest' | 'highest' | 'lowest'
      );
      res.status(HttpStatus.OK).json({ success: true, message: 'Reviews retrieved', data });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sortBy } = req.query;
      const data = await ReviewService.getBusinessReviews(
        (req.params.businessId as string),
        page ? Number(page) : 1,
        limit ? Number(limit) : 10,
        sortBy as 'newest' | 'highest' | 'lowest'
      );
      res.status(HttpStatus.OK).json({ success: true, message: 'Business reviews retrieved', data });
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await ReviewService.getBusinessRatingStats((req.params.businessId as string));
      res.status(HttpStatus.OK).json({ success: true, message: 'Business rating stats retrieved', data });
    } catch (error) {
      next(error);
    }
  }

  static async getListingRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ReviewService.getListingRatingStats((req.params.listingId as string) as string);
      res.status(HttpStatus.OK).json({ success: true, message: 'Rating stats retrieved', data: stats });
    } catch (error) {
      next(error);
    }
  }

  static async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit } = req.query;
      const data = await ReviewService.getUserReviews(
        req.user!.userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 10
      );
      res.status(HttpStatus.OK).json({ success: true, message: 'User reviews retrieved', data });
    } catch (error) {
      next(error);
    }
  }

  static async getReviewByOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.getReviewByOrder(req.user!.userId, (req.params.orderId as string) as string);
      res.status(HttpStatus.OK).json({ success: true, message: 'Review retrieved', data: review });
    } catch (error) {
      next(error);
    }
  }

  static async respondToReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { comment } = req.body;
      const review = await ReviewService.respondToReview(req.user!.userId, (req.params.reviewId as string) as string, comment);
      res.status(HttpStatus.OK).json({ success: true, message: 'Responded to review', data: review });
    } catch (error) {
      next(error);
    }
  }

  static async markHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await ReviewService.markHelpful(req.user!.userId, (req.params.reviewId as string) as string);
      res.status(HttpStatus.OK).json({ success: true, message: 'Review marked as helpful', data: review });
    } catch (error) {
      next(error);
    }
  }

  static async reportReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason, description } = req.body;
      const report = await ReviewService.reportReview((req.params.reviewId as string) as string, req.user!.userId, reason, description);
      res.status(HttpStatus.CREATED).json({ success: true, message: 'Review reported', data: report });
    } catch (error) {
      next(error);
    }
  }

  // Admin Methods
  static async getAdminReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, page, limit } = req.query;
      const data = await ReviewService.getAdminReviews(
        status as any,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20
      );
      res.status(HttpStatus.OK).json({ success: true, message: 'Admin reviews retrieved', data });
    } catch (error) {
      next(error);
    }
  }

  static async moderateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const review = await ReviewService.moderateReview((req.params.reviewId as string) as string, status, reason);
      res.status(HttpStatus.OK).json({ success: true, message: 'Review moderated', data: review });
    } catch (error) {
      next(error);
    }
  }
}
