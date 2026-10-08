import { Types } from 'mongoose';
import UserPreference from '../models/userPreference.model';
import UserInteraction, { InteractionType } from '../models/userInteraction.model';
import Post from '../models/post.model';
import Business from '../models/business.model';
import MarketplaceListing from '../models/marketplaceListing.model';
import Follow from '../models/follow.model';
import BusinessFollow from '../models/businessFollow.model';

// Weights for interactions
const INTERACTION_WEIGHTS: Record<InteractionType, number> = {
  [InteractionType.POST_VIEW]: 1,
  [InteractionType.POST_COMMENT]: 3,
  [InteractionType.POST_LIKE]: 4,
  [InteractionType.POST_SAVE]: 5,
  [InteractionType.POST_SHARE]: 5,
  [InteractionType.USER_FOLLOW]: 10,
  [InteractionType.BUSINESS_FOLLOW]: 10,
  [InteractionType.BUSINESS_VIEW]: 2,
  [InteractionType.LISTING_VIEW]: 2,
  [InteractionType.LISTING_SAVE]: 5,
  [InteractionType.LISTING_PURCHASE]: 15,
  [InteractionType.SEARCH]: 3,
  [InteractionType.STORY_VIEW]: 1,
  [InteractionType.STORY_REACTION]: 4,
  [InteractionType.REVIEW]: 8,
  [InteractionType.MESSAGE_BUSINESS]: 10,
  [InteractionType.NOT_INTERESTED]: -10
};

export class RecommendationService {
  /**
   * Track a user interaction
   */
  static async trackInteraction(
    userId: string,
    type: InteractionType,
    targetId: string,
    targetModel: 'Post' | 'User' | 'Business' | 'MarketplaceListing' | 'Story',
    metadata?: any
  ): Promise<void> {
    try {
      const weight = INTERACTION_WEIGHTS[type] || 1;
      
      const interaction = new UserInteraction({
        user: new Types.ObjectId(userId),
        type,
        targetId: new Types.ObjectId(targetId),
        targetModel,
        weight,
        metadata
      });

      await interaction.save();
    } catch (error) {
      console.error('Failed to track interaction:', error);
      // We don't throw here to prevent blocking main flows
    }
  }

  /**
   * Get user preferences or initialize if missing
   */
  static async getUserPreference(userId: string) {
    let pref = await UserPreference.findOne({ user: userId });
    if (!pref) {
      pref = new UserPreference({ user: new Types.ObjectId(userId) });
      await pref.save();
    }
    return pref;
  }

  /**
   * Get personalized feed combining multiple sources
   */
  static async getPersonalizedFeed(userId: string, page = 1, limit = 10, userLocation?: { coordinates: number[] }, radius?: number) {
    const skip = (page - 1) * limit;
    
    // 1. Get user interactions to build ad-hoc preference (simplified ML approach)
    const recentInteractions = await UserInteraction.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    // Build category weights based on recent interactions (if we have metadata categories)
    // For now, we will use a hybrid fetch:
    // 50% from followed users/businesses
    // 30% from nearby (if location provided)
    // 20% random popular/fresh

    const follows = await Follow.find({ follower: userId });
    const followedUserIds = follows.map(f => f.following);
    
    const bFollows = await BusinessFollow.find({ follower: userId });
    const followedBusinessIds = bFollows.map(f => f.business);

    // Sub-queries
    const queryBase: any = { visibility: 'PUBLIC' };
    
    // Not interested filter
    const notInterested = recentInteractions.filter(i => i.type === InteractionType.NOT_INTERESTED).map(i => i.targetId);
    if (notInterested.length > 0) {
      queryBase._id = { $nin: notInterested };
    }

    // Fetch followed content
    const followedPosts = await Post.find({
      ...queryBase,
      $or: [
        { author: { $in: followedUserIds }, authorType: 'User' },
        { business: { $in: followedBusinessIds }, authorType: 'Business' }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name username profileImage')
      .populate('business', 'name logo');

    // Fetch nearby content if location available
    let nearbyPosts: any[] = [];
    if (userLocation && userLocation.coordinates.length === 2 && radius) {
      nearbyPosts = await Post.find({
        ...queryBase,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: userLocation.coordinates,
            },
            $maxDistance: radius * 1000, // convert km to meters
          },
        },
        _id: { $nin: followedPosts.map(p => p._id).concat(notInterested) }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('author', 'name username profileImage')
      .populate('business', 'name logo');
    }

    // Fetch popular/fresh content as filler
    const excludeIds = [...followedPosts.map(p => p._id), ...nearbyPosts.map(p => p._id), ...notInterested];
    const popularPosts = await Post.find({
      ...queryBase,
      _id: { $nin: excludeIds }
    })
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(limit)
      .populate('author', 'name username profileImage')
      .populate('business', 'name logo');

    // Mix and score them
    let allPosts = [...followedPosts, ...nearbyPosts, ...popularPosts];
    
    // De-duplicate just in case
    const uniqueMap = new Map();
    allPosts.forEach(post => uniqueMap.set(post._id.toString(), post));
    allPosts = Array.from(uniqueMap.values());

    // Score posts
    const scoredPosts = allPosts.map(post => {
      let score = 0;
      const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      
      // Freshness score (exponential decay)
      const freshnessScore = Math.exp(-ageHours / 48) * 10;
      score += freshnessScore;

      // Popularity score
      score += (post.likeCount * 0.5) + (post.commentCount * 1);

      // Social score
      if (post.authorType === 'User' && followedUserIds.includes(post.author._id)) score += 20;
      if (post.authorType === 'Business' && followedBusinessIds.includes(post.business?._id)) score += 20;

      // Interaction bonus
      const pastInteractions = recentInteractions.filter(i => i.targetId.toString() === post._id.toString());
      pastInteractions.forEach(i => score += (i.weight * 2));

      return { post, score };
    });

    // Sort by score
    scoredPosts.sort((a, b) => b.score - a.score);

    // Apply pagination slice
    const paginatedPosts = scoredPosts.slice(skip, skip + limit).map(sp => {
      const postObj = sp.post.toObject();
      postObj.recommendationReason = sp.score > 30 ? 'Highly recommended' : undefined;
      return postObj;
    });

    return {
      posts: paginatedPosts,
      hasMore: paginatedPosts.length === limit
    };
  }

  /**
   * Get Recommended Businesses
   */
  static async getRecommendedBusinesses(userId: string, userLocation?: { coordinates: number[] }, radius = 50) {
    const pref = await this.getUserPreference(userId);
    const follows = await Follow.find({ follower: userId, followingType: 'Business' });
    const followedIds = follows.map(f => f.following);

    const query: any = {
      isApproved: true,
      _id: { $nin: followedIds }
    };

    if (pref.preferredBusinessCategories && pref.preferredBusinessCategories.length > 0) {
      query.category = { $in: pref.preferredBusinessCategories };
    }

    if (userLocation && userLocation.coordinates.length === 2) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userLocation.coordinates,
          },
          $maxDistance: radius * 1000,
        },
      };
    }

    const businesses = await Business.find(query)
      .limit(10)
      .sort({ rating: -1, reviewCount: -1 });

    return businesses.map(b => {
      const obj: any = b.toObject();
      obj.recommendationReason = 'Recommended near you';
      return obj;
    });
  }

  /**
   * Get Recommended Listings
   */
  static async getRecommendedListings(userId: string, userLocation?: { coordinates: number[] }, radius = 50) {
    const pref = await this.getUserPreference(userId);
    
    const query: any = { isActive: true };

    if (pref.preferredMarketplaceCategories && pref.preferredMarketplaceCategories.length > 0) {
      query.category = { $in: pref.preferredMarketplaceCategories };
    }

    if (userLocation && userLocation.coordinates.length === 2) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userLocation.coordinates,
          },
          $maxDistance: radius * 1000,
        },
      };
    }

    const listings = await MarketplaceListing.find(query)
      .populate('business', 'name logo')
      .limit(10)
      .sort({ createdAt: -1 });

    return listings;
  }

  /**
   * Get Trending Content (Aggregated)
   */
  static async getTrending() {
    // A simplified trending approach: recent highly liked posts
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7); // Last 7 days

    const trendingPosts = await Post.find({
      visibility: 'PUBLIC',
      createdAt: { $gte: dateLimit }
    } as any)
      .sort({ likeCount: -1, commentCount: -1 })
      .limit(10)
      .populate('author', 'name username profileImage')
      .populate('business', 'name logo');

    return {
      trendingPosts
    };
  }

  /**
   * Search suggestions
   */
  static async getSearchSuggestions(_userId: string, query: string, _userLocation?: { coordinates: number[] }) {
    if (!query || query.length < 2) return [];

    const regex = new RegExp(query, 'i');
    
    // Find matching categories or names
    const businesses = await Business.find({
      isApproved: true,
      $or: [
        { name: regex },
        { category: regex }
      ]
    }).limit(3).select('name category logo');

    const suggestions: any[] = [];
    
    businesses.forEach(b => {
      suggestions.push({
        text: b.name,
        type: 'BUSINESS',
        id: b._id,
        image: b.logo
      });
    });

    // Add generic category suggestion if matched
    if (businesses.length > 0) {
      suggestions.push({
        text: `${businesses[0].category} near you`,
        type: 'CATEGORY',
        query: businesses[0].category
      });
    }

    return suggestions;
  }
}
