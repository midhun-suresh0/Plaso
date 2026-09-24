import mongoose from 'mongoose';
import Review, { ReviewStatus } from '../models/review.model';
import ReviewReport from '../models/reviewReport.model';
import Order, { OrderStatus, PaymentStatus } from '../models/order.model';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';
import { AppError } from '../types';

export class ReviewService {
  /**
   * Verify if a user is eligible to review an order/listing combination.
   */
  private static async checkReviewEligibility(userId: string, orderId: string, listingId?: string) {
    const order = await Order.findOne({
      _id: orderId,
      buyer: userId,
    });

    if (!order) {
      throw new AppError('Order not found or unauthorized', 404);
    }

    if (order.orderStatus !== OrderStatus.COMPLETED) {
      throw new AppError('You can only review completed orders', 400);
    }

    if (![PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED].includes(order.paymentStatus)) {
      throw new AppError('Payment must be settled to review this order', 400);
    }

    if (listingId) {
      const hasListing = order.items.some(item => item.listing.toString() === listingId);
      if (!hasListing) {
        throw new AppError('This listing is not part of the specified order', 400);
      }
    }

    return order;
  }

  static async createReview(userId: string, data: any) {
    const { order: orderId, listing: listingId, rating, title, comment, images } = data;

    const order = await this.checkReviewEligibility(userId, orderId, listingId);

    // Ensure the business matches the order
    const businessId = order.business.toString();

    // Check for existing review
    const existingReview = await Review.findOne({
      author: userId,
      order: orderId,
      listing: listingId || { $exists: false }
    });

    if (existingReview) {
      throw new AppError('You have already reviewed this item', 400);
    }

    const review = await Review.create({
      author: userId,
      business: businessId,
      listing: listingId,
      order: orderId,
      rating,
      title,
      comment,
      images: images || [],
    });

    // Notify Business Owner
    await NotificationService.createNotification({
      recipient: businessId, 
      sender: userId,
      type: NotificationType.COMMENT, 
    });

    return review;
  }

  static async updateReview(userId: string, reviewId: string, data: any) {
    const review = await Review.findOne({ _id: reviewId, author: userId });
    
    if (!review) {
      throw new AppError('Review not found or unauthorized', 404);
    }
    
    if (review.status === ReviewStatus.REMOVED || review.status === ReviewStatus.HIDDEN) {
      throw new AppError('Cannot edit a moderated review', 400);
    }

    if (data.rating) review.rating = data.rating;
    if (data.title !== undefined) review.title = data.title;
    if (data.comment) review.comment = data.comment;
    if (data.images) review.images = data.images;

    await review.save();
    return review;
  }

  static async deleteReview(userId: string, reviewId: string, isAdmin: boolean = false) {
    const query: any = { _id: reviewId };
    if (!isAdmin) {
      query.author = userId;
    }

    const review = await Review.findOneAndDelete(query);
    if (!review) {
      throw new AppError('Review not found or unauthorized', 404);
    }

    return true;
  }

  static async getListingReviews(listingId: string, page: number = 1, limit: number = 10, sortBy: string = 'newest') {
    const skip = (page - 1) * limit;
    
    const sortObj: any = {};
    if (sortBy === 'newest') sortObj.createdAt = -1;
    if (sortBy === 'highest') sortObj.rating = -1;
    if (sortBy === 'lowest') sortObj.rating = 1;
    if (sortBy === 'helpful') sortObj.helpfulCount = -1;

    const matchStage = { 
      listing: new mongoose.Types.ObjectId(listingId),
      status: ReviewStatus.PUBLISHED 
    };

    const reviews = await Review.find(matchStage)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .lean();

    const total = await Review.countDocuments(matchStage);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getBusinessReviews(businessId: string, page: number = 1, limit: number = 10, sortBy: string = 'newest') {
    const skip = (page - 1) * limit;
    
    const sortObj: any = {};
    if (sortBy === 'newest') sortObj.createdAt = -1;
    if (sortBy === 'highest') sortObj.rating = -1;
    if (sortBy === 'lowest') sortObj.rating = 1;
    if (sortBy === 'helpful') sortObj.helpfulCount = -1;

    const matchStage = { 
      business: new mongoose.Types.ObjectId(businessId),
      status: ReviewStatus.PUBLISHED 
    };

    const reviews = await Review.find(matchStage)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar')
      .lean();

    const total = await Review.countDocuments(matchStage);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getBusinessRatingStats(businessId: string) {
    const stats = await Review.aggregate([
      { 
        $match: { 
          business: new mongoose.Types.ObjectId(businessId),
          status: ReviewStatus.PUBLISHED 
        } 
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        }
      }
    ]);

    if (stats.length === 0) {
      return { averageRating: 0, totalReviews: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
    }

    const { averageRating, totalReviews, fiveStar, fourStar, threeStar, twoStar, oneStar } = stats[0];
    return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      distribution: {
        5: fiveStar,
        4: fourStar,
        3: threeStar,
        2: twoStar,
        1: oneStar
      }
    };
  }

  static async getListingRatingStats(listingId: string) {
    const stats = await Review.aggregate([
      { 
        $match: { 
          listing: new mongoose.Types.ObjectId(listingId),
          status: ReviewStatus.PUBLISHED 
        } 
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        }
      }
    ]);

    if (stats.length === 0) {
      return { averageRating: 0, totalReviews: 0 };
    }

    return {
      averageRating: parseFloat(stats[0].averageRating.toFixed(1)),
      totalReviews: stats[0].totalReviews
    };
  }

  static async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const matchStage = { author: new mongoose.Types.ObjectId(userId) };

    const reviews = await Review.find(matchStage)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('business', 'name logo slug')
      .populate('listing', 'title images slug')
      .lean();

    const total = await Review.countDocuments(matchStage);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getReviewByOrder(userId: string, orderId: string) {
    const review = await Review.findOne({
      author: new mongoose.Types.ObjectId(userId),
      order: new mongoose.Types.ObjectId(orderId),
    }).lean();
    return review;
  }

  static async respondToReview(businessOwnerId: string, reviewId: string, comment: string) {
    // Need to verify the review belongs to a business owned by this user
    // Since we don't have direct access to Business model here, we will fetch the review, 
    // then fetch the business to verify ownership.
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    // Mongoose population or separate query to check business ownership
    const businessId = review.business;
    const Business = mongoose.model('Business');
    const business = await Business.findOne({ _id: businessId, owner: businessOwnerId });

    if (!business) {
      throw new AppError('Unauthorized to respond to this review', 403);
    }

    review.businessResponse = {
      comment,
      respondedAt: new Date()
    };
    
    await review.save();

    // Notify author
    await NotificationService.createNotification({
      recipient: review.author.toString(),
      sender: businessOwnerId,
      type: NotificationType.COMMENT,
    });

    return review;
  }

  static async reportReview(userId: string, reviewId: string, reason: string, description?: string) {
    const existingReport = await ReviewReport.findOne({ review: reviewId, reporter: userId });
    if (existingReport) {
      throw new AppError('You have already reported this review', 400);
    }

    const review = await Review.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    const report = await ReviewReport.create({
      review: reviewId,
      reporter: userId,
      reason,
      description
    });

    // Increment report count on review
    review.reportCount += 1;
    if (review.reportCount >= 5) {
      // Auto-hide if reported too many times, requires admin approval
      review.status = ReviewStatus.HIDDEN;
    }
    await review.save();

    return report;
  }

  static async markHelpful(userId: string, reviewId: string) {
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    // Check if already voted
    const hasVoted = review.helpfulVotes.some(id => id.toString() === userId);
    
    if (hasVoted) {
      // Toggle off
      review.helpfulVotes = review.helpfulVotes.filter(id => id.toString() !== userId);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      // Toggle on
      review.helpfulVotes.push(userObjectId);
      review.helpfulCount += 1;
    }

    await review.save();
    return review;
  }

  // Admin Methods
  static async getAdminReviews(status?: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) query.status = status;

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email')
      .populate('business', 'name')
      .lean();

    const total = await Review.countDocuments(query);
    
    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async moderateReview(adminId: string, reviewId: string, status: ReviewStatus, ) {
    const review = await Review.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);

    review.status = status;
    await review.save();

    // Notify author if hidden/removed
    if (status === ReviewStatus.HIDDEN || status === ReviewStatus.REMOVED) {
      await NotificationService.createNotification({
        recipient: review.author.toString(),
        sender: adminId,
        type: NotificationType.COMMENT,
      });
    }

    return review;
  }
}
