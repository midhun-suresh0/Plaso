import User, { IUser, LocationPrivacy } from '../models/user.model';
import { AppError, HttpStatus } from '../types';
import Follow from '../models/follow.model';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';
import Post from '../models/post.model';

export class UserService {
  /**
   * Calculate profile completion percentage
   */
  static calculateProfileCompletion(user: IUser): number {
    let completedFields = 0;
    const totalFields = 6;

    if (user.name) completedFields++;
    if (user.username) completedFields++;
    if (user.bio) completedFields++;
    if (user.profileImage) completedFields++;
    if (user.interests && user.interests.length > 0) completedFields++;
    if (user.location && user.location.coordinates && user.location.coordinates.length === 2) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Find a user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Update profile fields (safe update)
   */
  static async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
    // Whitelist allowed fields to prevent role/email injection
    const allowedUpdates: any = {};

    if (data.name !== undefined) allowedUpdates.name = data.name;
    if (data.username !== undefined) allowedUpdates.username = data.username;
    if (data.bio !== undefined) allowedUpdates.bio = data.bio;
    if (data.profileImage !== undefined) allowedUpdates.profileImage = data.profileImage;
    if (data.interests !== undefined) allowedUpdates.interests = data.interests;
    if (data.discoveryRadius !== undefined) allowedUpdates.discoveryRadius = data.discoveryRadius;
    if (data.locationPrivacy !== undefined) allowedUpdates.locationPrivacy = data.locationPrivacy;

    return User.findByIdAndUpdate(userId, { $set: allowedUpdates }, { new: true, runValidators: true });
  }

  /**
   * Update location (GeoJSON)
   */
  static async updateLocation(userId: string, latitude: number, longitude: number): Promise<IUser | null> {
    if (latitude < -90 || latitude > 90) {
      throw new AppError('Invalid latitude. Must be between -90 and 90.', HttpStatus.BAD_REQUEST);
    }
    if (longitude < -180 || longitude > 180) {
      throw new AppError('Invalid longitude. Must be between -180 and 180.', HttpStatus.BAD_REQUEST);
    }

    const location = {
      type: 'Point',
      coordinates: [longitude, latitude], // GeoJSON format: [longitude, latitude]
    };

    return User.findByIdAndUpdate(userId, { $set: { location } }, { new: true, runValidators: true });
  }

  /**
   * Get user profile with stats
   */
  static async getUserProfileWithStats(targetUserId: string, currentUserId?: string) {
    const user = await User.findById(targetUserId).select('-password');
    if (!user) throw new AppError('User not found', HttpStatus.NOT_FOUND);

    const [followerCount, followingCount, postCount] = await Promise.all([
      Follow.countDocuments({ following: targetUserId }),
      Follow.countDocuments({ follower: targetUserId }),
      Post.countDocuments({
        author: targetUserId,
        visibility: { $in: [LocationPrivacy.PUBLIC, LocationPrivacy.NEARBY] }
      })
    ]);

    let isFollowing = false;
    if (currentUserId && currentUserId !== targetUserId) {
      const followDoc = await Follow.findOne({ follower: currentUserId, following: targetUserId });
      isFollowing = !!followDoc;
    }

    // Strip exact coordinates if it's not the current user
    let safeUser = user.toObject();
    if (currentUserId !== targetUserId && safeUser.location) {
      delete (safeUser as any).location.coordinates;
    }

    return {
      ...safeUser,
      followerCount,
      followingCount,
      postCount,
      isFollowing
    };
  }

  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new AppError('Cannot follow yourself', HttpStatus.BAD_REQUEST);
    }
    try {
      const follow = new Follow({ follower: followerId, following: followingId });
      await follow.save();

      // Trigger notification
      await NotificationService.createNotification({
        recipient: followingId,
        sender: followerId,
        type: NotificationType.FOLLOW
      });

      return true;
    } catch (error: any) {
      if (error.code === 11000) return false;
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string) {
    const deleted = await Follow.findOneAndDelete({ follower: followerId, following: followingId });
    return !!deleted;
  }

  /**
   * Get Followers
   */
  static async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const followers = await Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'name username profileImage role isVerified')
      .lean();

    const totalCount = await Follow.countDocuments({ following: userId });

    return {
      users: followers.map(f => f.follower),
      page,
      limit,
      totalCount,
      hasMore: (skip + followers.length) < totalCount
    };
  }

  /**
   * Get Following
   */
  static async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const following = await Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', 'name username profileImage role isVerified')
      .lean();

    const totalCount = await Follow.countDocuments({ follower: userId });

    return {
      users: following.map(f => f.following),
      page,
      limit,
      totalCount,
      hasMore: (skip + following.length) < totalCount
    };
  }
}
