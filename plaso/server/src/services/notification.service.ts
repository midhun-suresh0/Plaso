import Notification, { NotificationType } from '../models/notification.model';

export class NotificationService {
  /**
   * Create a notification.
   * Prevents self-notifications and debounces duplicates where appropriate.
   */
  static async createNotification({
    recipient,
    sender,
    type,
    post,
    comment,
  }: {
    recipient: string;
    sender: string;
    type: NotificationType;
    post?: string;
    comment?: string;
  }) {
    // 1. Prevent self-notifications
    if (recipient === sender) {
      return null;
    }

    // 2. Prevent duplicate notifications for likes/follows to avoid spam
    // If a like/follow notification already exists from this sender for this post/recipient, don't create another
    if (type === NotificationType.LIKE && post) {
      const existing = await Notification.findOne({ recipient, sender, type, post });
      if (existing) return existing;
    } else if (type === NotificationType.FOLLOW) {
      const existing = await Notification.findOne({ recipient, sender, type });
      if (existing) return existing;
    }

    const notification = new Notification({
      recipient,
      sender,
      type,
      post,
      comment,
    });

    await notification.save();
    return notification;
  }

  /**
   * Get notifications for a user (paginated)
   */
  static async getNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const notificationsQuery = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name username profileImage')
      .populate('post', 'content')
      .lean();

    const totalCount = await Notification.countDocuments({ recipient: userId });

    return {
      notifications: notificationsQuery,
      page,
      limit,
      totalCount,
      hasMore: skip + notificationsQuery.length < totalCount,
    };
  }

  /**
   * Mark a specific notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount;
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string) {
    const count = await Notification.countDocuments({ recipient: userId, isRead: false });
    return count;
  }
}
