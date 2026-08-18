import User from '../models/user.model';
import Follow from '../models/follow.model';
import mongoose from 'mongoose';

export class DiscoveryService {
  /**
   * Get user suggestions based on shared interests or just recent active users
   */
  static async getSuggestedUsers(userId: string, limit: number = 5) {
    const currentUser = await User.findById(userId).select('interests location');
    if (!currentUser) return [];

    // Find who the user is already following to exclude them
    const following = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = following.map(f => f.following.toString());
    
    // Always exclude current user
    const excludeIds = [userId, ...followingIds];

    // Simple heuristic: users with overlapping interests, or just active users
    let query: any = {
      _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) },
      isActive: true,
    };

    if (currentUser.interests && currentUser.interests.length > 0) {
      // First try to find users with at least one shared interest
      query.interests = { $in: currentUser.interests };
      
      let suggestions = await User.find(query)
        .select('name username profileImage interests')
        .limit(limit)
        .lean();

      // If we don't have enough, fill the rest with random/recent active users
      if (suggestions.length < limit) {
        delete query.interests;
        const additionalExclude = suggestions.map(s => s._id.toString());
        query._id.$nin.push(...additionalExclude.map(id => new mongoose.Types.ObjectId(id)));
        
        const moreUsers = await User.find(query)
          .select('name username profileImage interests')
          .limit(limit - suggestions.length)
          .lean();
          
        suggestions = [...suggestions, ...moreUsers];
      }

      // Add a sharedInterests count for the frontend to display
      return suggestions.map(s => {
        const shared = s.interests?.filter(i => currentUser.interests?.includes(i)).length || 0;
        return {
          _id: s._id,
          name: s.name,
          username: s.username,
          profileImage: s.profileImage,
          sharedInterests: shared
        };
      });
    } else {
      // If no interests, just get some recent users
      const suggestions = await User.find(query)
        .select('name username profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
        
      return suggestions.map(s => ({
        _id: s._id,
        name: s.name,
        username: s.username,
        profileImage: s.profileImage,
        sharedInterests: 0
      }));
    }
  }
}
