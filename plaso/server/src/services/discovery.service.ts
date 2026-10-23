import User from '../models/user.model';
import Follow from '../models/follow.model';
import mongoose from 'mongoose';

export class DiscoveryService {
  /**
   * Get user suggestions based on shared interests or recent active users
   */
  static async getSuggestedUsers(userId: string, limit: number = 10) {
    const currentUser = await User.findById(userId).select('interests location');
    if (!currentUser) return [];

    // Find who the user is already following to exclude them
    const following = await Follow.find({ follower: userId }).select('following').lean();
    const followingIds = following.map(f => f.following.toString());
    
    // Always exclude current user + followed users
    const excludeIds = [userId, ...followingIds];
    const validExcludeObjectIds = excludeIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));

    // Simple heuristic: users with overlapping interests or active users (exclude ADMINs)
    let query: any = {
      _id: { $nin: validExcludeObjectIds },
      isActive: { $ne: false },
      role: { $ne: 'ADMIN' },
    };

    if (currentUser.interests && currentUser.interests.length > 0) {
      // First try to find users with at least one shared interest
      query.interests = { $in: currentUser.interests };
      
      let suggestions = await User.find(query)
        .select('name username profileImage interests createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // If we don't have enough, fill the rest with other active users
      if (suggestions.length < limit) {
        delete query.interests;
        const additionalExclude = suggestions.map(s => s._id);
        query._id.$nin = [...validExcludeObjectIds, ...additionalExclude];
        
        const moreUsers = await User.find(query)
          .select('name username profileImage interests createdAt')
          .sort({ createdAt: -1 })
          .limit(limit - suggestions.length)
          .lean();
          
        suggestions = [...suggestions, ...moreUsers];
      }

      // Add a sharedInterests count for the frontend to display
      return suggestions.map(s => {
        const shared = s.interests?.filter((i: string) => currentUser.interests?.includes(i)).length || 0;
        return {
          _id: s._id,
          name: s.name || s.username || 'Plaso User',
          username: s.username,
          profileImage: s.profileImage,
          sharedInterests: shared
        };
      });
    } else {
      // If no interests, just get recent active users
      const suggestions = await User.find(query)
        .select('name username profileImage createdAt')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
        
      return suggestions.map(s => ({
        _id: s._id,
        name: s.name || s.username || 'Plaso User',
        username: s.username,
        profileImage: s.profileImage,
        sharedInterests: 0
      }));
    }
  }

  /**
   * Get nearby entities (businesses, listings, posts)
   */
  static async getNearbyEntities(
    lat: number, 
    lng: number, 
    radius: number, // in km
    category?: string,
    type?: string,
    search?: string
  ) {
    const radiusInMeters = radius * 1000;
    
    // Default fetch all if type is not specified or is 'all'
    const fetchBusinesses = !type || type === 'all' || type === 'businesses' || type === 'recommended';
    const fetchListings = !type || type === 'all' || type === 'marketplace' || type === 'recommended';
    const fetchPosts = !type || type === 'all' || type === 'posts' || type === 'recommended';

    const results: any = {
      businesses: [],
      listings: [],
      posts: []
    };

    const point = {
      type: 'Point',
      coordinates: [lng, lat]
    };

    // 1. Businesses
    if (fetchBusinesses) {
      let query: any = {
        location: {
          $near: {
            $geometry: point,
            $maxDistance: radiusInMeters
          }
        },
        verificationStatus: 'APPROVED',
        isActive: true
      };

      if (category && category !== 'All' && category !== 'Recommended') {
        query.category = category;
      }
      
      if (search) {
        query.$text = { $search: search };
      }

      results.businesses = await mongoose.model('Business').find(query)
        .select('name category coverImage logo address location rating isOpen')
        .limit(50)
        .lean();
    }

    // 2. Marketplace Listings
    if (fetchListings) {
      let query: any = {
        location: {
          $near: {
            $geometry: point,
            $maxDistance: radiusInMeters
          }
        },
        isActive: true
      };

      if (category && category !== 'All' && category !== 'Recommended') {
        query.category = category;
      }
      
      if (search) {
        query.$text = { $search: search };
      }

      results.listings = await mongoose.model('MarketplaceListing').find(query)
        .select('title price images category location business')
        .populate('business', 'name logo')
        .limit(50)
        .lean();
    }

    // 3. Posts (Public / Nearby)
    if (fetchPosts) {
      let query: any = {
        location: {
          $near: {
            $geometry: point,
            $maxDistance: radiusInMeters
          }
        },
        visibility: { $in: ['PUBLIC', 'NEARBY'] }
      };

      if (search) {
        query.$text = { $search: search };
      }

      results.posts = await mongoose.model('Post').find(query)
        .select('content media location locationName author createdAt')
        .populate('author', 'name username profileImage')
        .limit(50)
        .lean();
    }

    return results;
  }
}
