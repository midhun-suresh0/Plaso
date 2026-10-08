import mongoose from 'mongoose';
import User, { UserRole } from '../models/user.model';
import Business, { BusinessStatus } from '../models/business.model';
import MarketplaceListing from '../models/marketplaceListing.model';
import Order, { OrderStatus, PaymentStatus } from '../models/order.model';
import Transaction from '../models/transaction.model';
import Post from '../models/post.model';
import Comment from '../models/comment.model';
import Review, { ReviewStatus } from '../models/review.model';
import Report, { TargetType, ReportStatus } from '../models/report.model';
import AdminAuditLog, { AuditAction } from '../models/adminAuditLog.model';
import { AppError } from '../types';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';

export class AdminService {
  // Utility for date ranges
  private static getDateFilter(range: string) {
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case 'all': return {}; // No filter
      default: startDate.setDate(now.getDate() - 30); break;
    }
    return { $gte: startDate };
  }

  // --- OVERVIEW ---
  static async getOverview(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const totalUsers = await User.countDocuments(createdAtQuery);
    const activeUsers = await User.countDocuments({ ...createdAtQuery, isActive: true });
    const totalBusinesses = await Business.countDocuments(createdAtQuery);
    const pendingBusinesses = await Business.countDocuments({ ...createdAtQuery, verificationStatus: BusinessStatus.PENDING });
    const totalListings = await MarketplaceListing.countDocuments(createdAtQuery);
    const totalOrders = await Order.countDocuments(createdAtQuery);
    const completedOrders = await Order.countDocuments({ ...createdAtQuery, orderStatus: OrderStatus.COMPLETED });
    const pendingReports = await Report.countDocuments({ ...createdAtQuery, status: ReportStatus.OPEN });
    const totalReviews = await Review.countDocuments(createdAtQuery);

    const successfulTransactions = await Transaction.aggregate([
      { $match: { ...createdAtQuery, paymentStatus: PaymentStatus.PAID } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = successfulTransactions.length > 0 ? successfulTransactions[0].totalRevenue : 0;

    return {
      totalUsers,
      activeUsers,
      totalBusinesses,
      pendingBusinesses,
      totalListings,
      totalOrders,
      completedOrders,
      totalRevenue,
      pendingReports,
      totalReviews,
    };
  }

  // --- USER ANALYTICS ---
  static async getUserAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const total = await User.countDocuments(createdAtQuery);
    const active = await User.countDocuments({ ...createdAtQuery, isActive: true });
    const inactive = total - active;
    
    const byRole = await User.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Grouping by day for trends
    const dateFormat = range === '7d' || range === '30d' ? '%Y-%m-%d' : '%Y-%m';
    const growth = await User.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return {
      total,
      active,
      inactive,
      byRole,
      growth
    };
  }

  // --- BUSINESS ANALYTICS ---
  static async getBusinessAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const total = await Business.countDocuments(createdAtQuery);
    
    const byStatus = await Business.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
    ]);

    const byCategory = await Business.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const dateFormat = range === '7d' || range === '30d' ? '%Y-%m-%d' : '%Y-%m';
    const growth = await Business.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return { total, byStatus, byCategory, growth };
  }

  // --- MARKETPLACE ANALYTICS ---
  static async getMarketplaceAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const total = await MarketplaceListing.countDocuments(createdAtQuery);
    const active = await MarketplaceListing.countDocuments({ ...createdAtQuery, isActive: true });
    const inactive = total - active;

    const byCategory = await MarketplaceListing.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return { total, active, inactive, byCategory };
  }

  // --- ORDER ANALYTICS ---
  static async getOrderAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const total = await Order.countDocuments(createdAtQuery);
    
    const byStatus = await Order.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const dateFormat = range === '7d' || range === '30d' ? '%Y-%m-%d' : '%Y-%m';
    const trend = await Order.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return { total, byStatus, trend };
  }

  // --- REVENUE ANALYTICS ---
  static async getRevenueAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const totalTransactions = await Transaction.countDocuments(createdAtQuery);

    const successfulTransactions = await Transaction.aggregate([
      { $match: { ...createdAtQuery, paymentStatus: PaymentStatus.PAID } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalRevenue = successfulTransactions.length > 0 ? successfulTransactions[0].totalRevenue : 0;

    const refundedTransactions = await Transaction.aggregate([
      { $match: { ...createdAtQuery, paymentStatus: PaymentStatus.REFUNDED } },
      { $group: { _id: null, totalRefunded: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalRefunded = refundedTransactions.length > 0 ? refundedTransactions[0].totalRefunded : 0;

    const byStatus = await Transaction.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    const dateFormat = range === '7d' || range === '30d' ? '%Y-%m-%d' : '%Y-%m';
    const trend = await Transaction.aggregate([
      { $match: { ...createdAtQuery, paymentStatus: PaymentStatus.PAID } },
      { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt' } }, revenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);

    return { totalTransactions, totalRevenue, totalRefunded, byStatus, trend };
  }

  // --- SOCIAL ANALYTICS ---
  static async getSocialAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const posts = await Post.countDocuments(createdAtQuery);
    const comments = await Comment.countDocuments(createdAtQuery);
    // Note: Likes/Saves might be on user actions or separate collections depending on implementation, 
    // assuming we are just counting total posts and comments for now
    
    return { posts, comments };
  }

  // --- REVIEW ANALYTICS ---
  static async getReviewAnalytics(range: string) {
    const dateFilter = this.getDateFilter(range);
    const createdAtQuery = range === 'all' ? {} : { createdAt: dateFilter };

    const total = await Review.countDocuments(createdAtQuery);
    
    const byRating = await Review.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const averageRatingResult = await Review.aggregate([
      { $match: createdAtQuery },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = averageRatingResult.length > 0 ? Number(averageRatingResult[0].avgRating.toFixed(2)) : 0;

    return { total, byRating, avgRating };
  }

  // --- TRENDS ANALYTICS ---
  static async getTrendsAnalytics(range: string) {
    const userGrowth = await this.getUserAnalytics(range);
    const orderTrend = await this.getOrderAnalytics(range);
    const revenueTrend = await this.getRevenueAnalytics(range);
    
    return {
      users: userGrowth.growth,
      orders: orderTrend.trend,
      revenue: revenueTrend.trend,
    };
  }

  // --- TOP ENTITIES ---
  static async getTopEntities(_range: string) {
    // Top businesses by completed orders
    const topBusinesses = await Order.aggregate([
      { $match: { orderStatus: OrderStatus.COMPLETED } },
      { $group: { _id: '$business', ordersCount: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { ordersCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'businesses',
          localField: '_id',
          foreignField: '_id',
          as: 'businessDetails'
        }
      },
      { $unwind: '$businessDetails' },
      {
        $project: {
          _id: 1,
          name: '$businessDetails.name',
          ordersCount: 1,
          revenue: 1,
          rating: '$businessDetails.averageRating',
          reviews: '$businessDetails.reviewCount'
        }
      }
    ]);

    return { topBusinesses };
  }

  // --- INTELLIGENCE ANALYTICS ---
  static async getIntelligenceAnalytics() {
    // Grouping businesses by category across entire platform
    const topCategories = await Business.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return { topCategories };
  }

  // --- MANAGEMENT: USERS ---
  static async getUsers(page: number, limit: number, search?: string, role?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const items = await User.find(query).select('-passwordHash -passwordResetOtpHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await User.countDocuments(query);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async getUserDetails(id: string) {
    const user = await User.findById(id).select('-passwordHash -passwordResetOtpHash').lean();
    if (!user) throw new AppError('User not found', 404);

    const posts = await Post.countDocuments({ author: id });
    const orders = await Order.countDocuments({ buyer: id });
    const reviews = await Review.countDocuments({ author: id });
    
    let businesses: any[] = [];
    if (user.role === UserRole.BUSINESS_OWNER) {
      businesses = await Business.find({ owner: id }).select('name category verificationStatus isActive').lean();
    }

    return { ...user, activity: { posts, orders, reviews }, businesses };
  }

  static async updateUserStatus(id: string, status: string, adminId: string, reason?: string) {
    const user = await User.findById(id);
    if (!user) throw new AppError('User not found', 404);

    // Don't allow suspending other admins easily to prevent lockouts
    if (user.role === UserRole.ADMIN && user._id.toString() !== adminId) {
      throw new AppError('Cannot suspend another admin', 403);
    }

    const isActive = status === 'ACTIVE';
    user.isActive = isActive;
    await user.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: isActive ? AuditAction.USER_RESTORED : AuditAction.USER_SUSPENDED,
      targetType: TargetType.USER,
      targetId: user._id,
      reason
    });

    return user;
  }

  // --- MANAGEMENT: BUSINESSES ---
  static async getBusinesses(page: number, limit: number, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (status) query.verificationStatus = status;

    const items = await Business.find(query).populate('owner', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Business.countDocuments(query);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async updateBusinessStatus(id: string, status: BusinessStatus, adminId: string, reason?: string) {
    const business = await Business.findById(id);
    if (!business) throw new AppError('Business not found', 404);

    business.verificationStatus = status;
    await business.save();

    let action: AuditAction;
    switch(status) {
      case BusinessStatus.APPROVED: action = AuditAction.BUSINESS_APPROVED; break;
      case BusinessStatus.REJECTED: action = AuditAction.BUSINESS_REJECTED; break;
      case BusinessStatus.SUSPENDED: action = AuditAction.BUSINESS_SUSPENDED; break;
      default: action = AuditAction.BUSINESS_RESTORED; break; // E.g., if manually set back to pending
    }

    await AdminAuditLog.create({
      admin: adminId,
      action,
      targetType: TargetType.BUSINESS,
      targetId: business._id,
      reason
    });

    // Notify owner
    await NotificationService.createNotification({
      recipient: business.owner.toString(),
      sender: adminId,
      type: NotificationType.SYSTEM,
      message: `Your business '${business.name}' status has been updated to ${status}. ${reason ? `Reason: ${reason}` : ''}`
    });

    return business;
  }

  // --- MANAGEMENT: LISTINGS ---
  static async getListings(page: number, limit: number, search?: string, status?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    // E.g., status active or inactive
    if (status) query.isActive = status === 'true';

    const items = await MarketplaceListing.find(query).populate('business', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await MarketplaceListing.countDocuments(query);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async moderateListing(id: string, status: boolean, adminId: string, reason?: string) {
    const listing = await MarketplaceListing.findById(id).populate('business');
    if (!listing) throw new AppError('Listing not found', 404);

    listing.isActive = status;
    await listing.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: AuditAction.LISTING_MODERATED,
      targetType: TargetType.LISTING,
      targetId: listing._id,
      metadata: { isActive: status },
      reason
    });

    // Notify owner
    const business = listing.business as any;
    if (business && business.owner) {
      await NotificationService.createNotification({
        recipient: business.owner.toString(),
        sender: adminId,
        type: NotificationType.SYSTEM,
        message: `Your listing '${listing.title}' has been ${status ? 'restored' : 'hidden'} by an admin. ${reason ? `Reason: ${reason}` : ''}`
      });
    }

    return listing;
  }

  // --- REPORTS ---
  static async getReports(page: number, limit: number, _search?: string, status?: string, targetType?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const items = await Report.find(query)
      .populate('reporter', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await Report.countDocuments(query);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  static async updateReportStatus(id: string, status: ReportStatus, adminId: string, note?: string) {
    const report = await Report.findById(id);
    if (!report) throw new AppError('Report not found', 404);

    report.status = status;
    if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
      report.resolvedBy = new mongoose.Types.ObjectId(adminId);
      report.resolvedAt = new Date();
      if (note) report.resolutionNote = note;
    }

    await report.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: status === ReportStatus.RESOLVED ? AuditAction.REPORT_RESOLVED : AuditAction.REPORT_DISMISSED,
      targetType: 'REPORT',
      targetId: report._id,
      reason: note
    });

    return report;
  }

  // --- CONTENT MODERATION ---
  static async moderateContent(type: string, id: string, actionStr: string, adminId: string, reason?: string) {
    // Implement hide/restore for generic content
    let model: any;
    let actionCode: AuditAction;
    let targetEnum: TargetType;

    switch (type.toUpperCase()) {
      case 'POST': 
        model = Post; 
        actionCode = AuditAction.POST_MODERATED; 
        targetEnum = TargetType.POST; 
        break;
      case 'REVIEW': 
        model = Review; 
        actionCode = AuditAction.REVIEW_MODERATED; 
        targetEnum = TargetType.REVIEW; 
        break;
      // Add Story etc if needed
      default:
        throw new AppError('Unsupported content type', 400);
    }

    const item = await model.findById(id);
    if (!item) throw new AppError('Content not found', 404);

    // E.g., we just add a status flag for moderation
    if (actionStr === 'HIDE' || actionStr === 'REMOVE') {
      if (item.status !== undefined) {
        item.status = (model === Review) ? ReviewStatus.REMOVED : 'REMOVED';
      }
      if (item.isActive !== undefined) {
        item.isActive = false;
      }
    } else if (actionStr === 'RESTORE') {
      if (item.status !== undefined) {
        item.status = (model === Review) ? ReviewStatus.PUBLISHED : 'PUBLISHED';
      }
      if (item.isActive !== undefined) {
        item.isActive = true;
      }
    }
    
    await item.save();

    await AdminAuditLog.create({
      admin: adminId,
      action: actionCode,
      targetType: targetEnum,
      targetId: item._id,
      metadata: { action: actionStr },
      reason
    });

    return item;
  }

  // --- AUDIT LOGS ---
  static async getAuditLogs(page: number, limit: number, action?: string, targetType?: string, adminId?: string) {
    const skip = (page - 1) * limit;
    const query: any = {};
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;
    if (adminId) query.admin = adminId;

    const items = await AdminAuditLog.find(query)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    const total = await AdminAuditLog.countDocuments(query);

    return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  // --- SYSTEM HEALTH ---
  static async getSystemHealth() {
    return {
      api: 'Operational',
      mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      payments: 'Configured', // Add actual checks if needed
      environment: process.env.NODE_ENV || 'development'
    };
  }
}
