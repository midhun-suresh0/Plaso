import User, { LocationPrivacy } from '../models/user.model';
import Post from '../models/post.model';

export class SearchService {
  /**
   * Search users by name or username
   */
  static async searchUsers(query: string, page: number = 1, limit: number = 20) {
    if (!query || query.trim() === '') {
      return { users: [], page, limit, totalCount: 0, hasMore: false };
    }

    const skip = (page - 1) * limit;
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex characters
    const regex = new RegExp(safeQuery, 'i');

    const searchCriteria = {
      isActive: true,
      $or: [
        { name: { $regex: regex } },
        { username: { $regex: regex } }
      ]
    };

    const users = await User.find(searchCriteria)
      .select('name username profileImage')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await User.countDocuments(searchCriteria);

    return {
      users,
      page,
      limit,
      totalCount,
      hasMore: skip + users.length < totalCount
    };
  }

  /**
   * Search posts by content
   */
  static async searchPosts(query: string, page: number = 1, limit: number = 20) {
    if (!query || query.trim() === '') {
      return { posts: [], page, limit, totalCount: 0, hasMore: false };
    }

    const skip = (page - 1) * limit;

    // Use text index for post content search. Requires text index on content field.
    const searchCriteria = {
      $text: { $search: query },
      visibility: { $in: [LocationPrivacy.PUBLIC, LocationPrivacy.NEARBY] }
    };

    const posts = await Post.find(searchCriteria)
      .sort({ score: { $meta: 'textScore' } }) // Sort by text search relevance
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profileImage')
      .lean();

    const totalCount = await Post.countDocuments(searchCriteria);

    return {
      posts,
      page,
      limit,
      totalCount,
      hasMore: skip + posts.length < totalCount
    };
  }
}
