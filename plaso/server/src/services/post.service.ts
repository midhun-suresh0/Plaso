import mongoose from 'mongoose';
import Post from '../models/post.model';
import User, { LocationPrivacy, UserRole } from '../models/user.model';
import PostLike from '../models/postLike.model';
import Comment from '../models/comment.model';
import SavedPost from '../models/savedPost.model';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';

export const postService = {
  /**
   * Create a new post
   */
  async createPost(
    authorId: string,
    data: { content?: string; media?: string[]; visibility: LocationPrivacy; location?: { longitude: number; latitude: number }; locationName?: string; authorType?: 'USER' | 'BUSINESS'; business?: string }
  ) {
    const postData: any = {
      author: authorId,
      visibility: data.visibility,
    };

    if (data.authorType) postData.authorType = data.authorType;
    if (data.business) postData.business = data.business;
    if (data.content) postData.content = data.content;
    if (data.media && data.media.length > 0) postData.media = data.media;

    if (data.location) {
      postData.location = {
        type: 'Point',
        coordinates: [data.location.longitude, data.location.latitude],
      };
      if (data.locationName) postData.locationName = data.locationName;
    }

    const post = new Post(postData);
    await post.save();
    return post;
  },

  /**
   * Fetch hyperlocal feed based on user location and discovery radius
   */
  async getFeed(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type: 'home' | 'nearby' = 'home'
  ) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (type === 'nearby' && (!user.location || user.location.coordinates.length !== 2)) {
      throw new Error('Location is required to view the nearby feed.');
    }

    const skip = (page - 1) * limit;
    let posts = [];
    let totalCount = 0;
    const pipeline: any[] = [];
    
    const hasLocation = user.location && user.location.coordinates.length === 2;
    const radiusInMeters = (user.discoveryRadius || 5) * 1000;

    if (type === 'nearby') {
      // Strictly nearby posts
      pipeline.push({
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: user.location!.coordinates,
          },
          distanceField: 'rawDistance',
          maxDistance: radiusInMeters,
          spherical: true,
          query: {
            $or: [
              { visibility: LocationPrivacy.PUBLIC },
              { visibility: LocationPrivacy.NEARBY },
              { author: new mongoose.Types.ObjectId(userId) }
            ]
          }
        }
      });
      pipeline.push({ $sort: { createdAt: -1 } });
    } else {
      // Home feed
      if (hasLocation) {
        pipeline.push({
          $match: {
            $or: [
              { visibility: LocationPrivacy.PUBLIC },
              { author: new mongoose.Types.ObjectId(userId) },
              {
                visibility: LocationPrivacy.NEARBY,
                location: {
                  $geoWithin: {
                    $centerSphere: [user.location!.coordinates, radiusInMeters / 6378100] // meters to radians
                  }
                }
              }
            ]
          }
        });
      } else {
        pipeline.push({
          $match: {
            $or: [
              { visibility: LocationPrivacy.PUBLIC },
              { author: new mongoose.Types.ObjectId(userId) }
            ]
          }
        });
      }
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Lookup author details
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    });

    pipeline.push({ $unwind: '$authorInfo' });

    // Lookup business details if it's a business post
    pipeline.push({
      $lookup: {
        from: 'businesses',
        localField: 'business',
        foreignField: '_id',
        as: 'businessInfo'
      }
    });

    pipeline.push({
      $unwind: {
        path: '$businessInfo',
        preserveNullAndEmptyArrays: true
      }
    });

    // Project needed fields and sanitize distance
    pipeline.push({
      $project: {
        _id: 1,
        content: 1,
        media: 1,
        visibility: 1,
        locationName: 1,
        likeCount: 1,
        commentCount: 1,
        createdAt: 1,
        authorType: 1,
        distanceKm: {
          $cond: {
            if: { $gt: ['$rawDistance', null] },
            then: { $round: [{ $divide: ['$rawDistance', 1000] }, 1] },
            else: null
          }
        },
        author: {
          _id: '$authorInfo._id',
          name: '$authorInfo.name',
          username: '$authorInfo.username',
          profileImage: '$authorInfo.profileImage',
          isBusiness: { $eq: ['$authorInfo.role', UserRole.BUSINESS_OWNER] },
          isVerified: '$authorInfo.isVerified'
        },
        business: {
          $cond: {
            if: { $eq: ['$authorType', 'BUSINESS'] },
            then: {
              _id: '$businessInfo._id',
              name: '$businessInfo.name',
              logo: '$businessInfo.logo',
              category: '$businessInfo.category'
            },
            else: null
          }
        }
      }
    });

    // Pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    posts = await Post.aggregate(pipeline);

    // Calculate total count (simplified for performance)
    let query: any = {
      $or: [
        { visibility: LocationPrivacy.PUBLIC },
        { author: new mongoose.Types.ObjectId(userId) }
      ]
    };

    if (type === 'nearby') {
      query = {
        $and: [
          {
            location: {
              $geoWithin: {
                $centerSphere: [user.location!.coordinates, radiusInMeters / 6378100]
              }
            }
          },
          {
            $or: [
              { visibility: LocationPrivacy.PUBLIC },
              { visibility: LocationPrivacy.NEARBY },
              { author: new mongoose.Types.ObjectId(userId) }
            ]
          }
        ]
      };
    } else if (hasLocation) {
       query = {
         $or: [
           { visibility: LocationPrivacy.PUBLIC },
           { author: new mongoose.Types.ObjectId(userId) },
           {
             visibility: LocationPrivacy.NEARBY,
             location: {
               $geoWithin: {
                 $centerSphere: [user.location!.coordinates, radiusInMeters / 6378100]
               }
             }
           }
         ]
       };
    }

    totalCount = await Post.countDocuments(query);

    // Add isLiked and isSaved fields for the requesting user
    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      
      const [likes, saves] = await Promise.all([
        PostLike.find({
          post: { $in: postIds },
          user: new mongoose.Types.ObjectId(userId)
        }).lean(),
        SavedPost.find({
          post: { $in: postIds },
          user: new mongoose.Types.ObjectId(userId)
        }).lean()
      ]);
      
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      const savedPostIds = new Set(saves.map(s => s.post.toString()));
      
      posts = posts.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: savedPostIds.has(p._id.toString())
      }));
    }

    return {
      posts,
      page,
      limit,
      totalCount,
      hasMore: (skip + posts.length) < totalCount
    };
  },

  /**
   * Get posts by user ID
   */
  async getUserPosts(targetUserId: string, currentUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const query: any = { author: targetUserId };
    
    // If not the current user, only show PUBLIC or NEARBY posts (though nearby should ideally check location, 
    // for profile view we typically show public)
    if (targetUserId !== currentUserId) {
      query.visibility = { $in: [LocationPrivacy.PUBLIC, LocationPrivacy.NEARBY] };
    }
    
    // Only fetch USER posts for the user profile, to separate from their business posts if they have a business
    query.authorType = 'USER';

    const postsQuery = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profileImage role isVerified')
      .lean();

    const totalCount = await Post.countDocuments(query);

    let posts = postsQuery as any[];

    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      
      const [likes, saves] = await Promise.all([
        PostLike.find({
          post: { $in: postIds },
          user: new mongoose.Types.ObjectId(currentUserId)
        }).lean(),
        SavedPost.find({
          post: { $in: postIds },
          user: new mongoose.Types.ObjectId(currentUserId)
        }).lean()
      ]);
      
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      const savedPostIds = new Set(saves.map(s => s.post.toString()));
      
      posts = posts.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: savedPostIds.has(p._id.toString())
      }));
    }

    return {
      posts,
      page,
      limit,
      totalCount,
      hasMore: (skip + posts.length) < totalCount
    };
  },

  /**
   * Get posts by business ID
   */
  async getBusinessPosts(businessId: string, currentUserId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const query: any = { 
      business: businessId,
      authorType: 'BUSINESS',
      visibility: { $in: [LocationPrivacy.PUBLIC, LocationPrivacy.NEARBY] }
    };

    const postsQuery = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profileImage role isVerified')
      .populate('business', 'name logo category')
      .lean();

    const totalCount = await Post.countDocuments(query);

    let posts = postsQuery as any[];

    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      
      const [likes, saves] = await Promise.all([
        PostLike.find({ post: { $in: postIds }, user: currentUserId }).lean(),
        SavedPost.find({ post: { $in: postIds }, user: currentUserId }).lean()
      ]);
      
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      const savedPostIds = new Set(saves.map(s => s.post.toString()));
      
      posts = posts.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: savedPostIds.has(p._id.toString())
      }));
    }

    return {
      posts,
      page,
      limit,
      totalCount,
      hasMore: (skip + posts.length) < totalCount
    };
  },

  /**
   * Get single post by ID  */
  async getPostById(postId: string, userId: string) {
    const post = await Post.findById(postId).populate('author', 'name username profileImage').lean();
    if (!post) throw new Error('Post not found');

    const user = await User.findById(userId);

    // Check visibility logic
    if (post.visibility === LocationPrivacy.PRIVATE && post.author._id.toString() !== userId) {
      // Check if ADMIN
      if (!user || user.role !== UserRole.ADMIN) {
         throw new Error('Forbidden: Post is private');
      }
    }

    // if NEARBY, strictly we should check distance, but for now we allow viewing if they have the link
    // or we can enforce distance here as well. Allowing viewing single post is usually fine if they saw it in feed.

    const isLiked = await PostLike.exists({ post: postId, user: userId });
    const isSaved = await SavedPost.exists({ post: postId, user: userId });

    return {
      ...post,
      isLiked: !!isLiked,
      isSaved: !!isSaved
    };
  },

  /**
   * Delete post
   */
  async deletePost(postId: string, userId: string) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (post.author.toString() !== userId && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden: Cannot delete another user\'s post');
    }

    // Delete post, associated likes, saves, and comments
    await Promise.all([
      Post.findByIdAndDelete(postId),
      PostLike.deleteMany({ post: postId }),
      SavedPost.deleteMany({ post: postId }),
      Comment.deleteMany({ post: postId })
    ]);

    return true;
  },

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string) {
    try {
      const like = new PostLike({ post: postId, user: userId });
      await like.save();
      // Increment like count on post
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

      // Trigger notification
      const post = await Post.findById(postId).select('author');
      if (post) {
        await NotificationService.createNotification({
          recipient: post.author.toString(),
          sender: userId,
          type: NotificationType.LIKE,
          post: postId
        });
      }

      return true;
    } catch (error: any) {
      // Ignore duplicate key error (already liked)
      if (error.code === 11000) return false; 
      throw error;
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string) {
    const deleted = await PostLike.findOneAndDelete({ post: postId, user: userId });
    if (deleted) {
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
      return true;
    }
    return false;
  },

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name username profileImage')
      .lean();

    const totalCount = await Comment.countDocuments({ post: postId });

    return {
      comments,
      page,
      limit,
      totalCount,
      hasMore: (skip + comments.length) < totalCount
    };
  },

  /**
   * Add a comment
   */
  async addComment(postId: string, userId: string, content: string) {
    const comment = new Comment({
      post: postId,
      author: userId,
      content
    });
    await comment.save();

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // Trigger notification
    const post = await Post.findById(postId).select('author');
    if (post) {
      await NotificationService.createNotification({
        recipient: post.author.toString(),
        sender: userId,
        type: NotificationType.COMMENT,
        post: postId,
        comment: comment._id.toString()
      });
    }

    return await Comment.findById(comment._id).populate('author', 'name username profileImage').lean();
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Only author or admin can delete
    if (comment.author.toString() !== userId && user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden: Cannot delete another user\'s comment');
    }

    await Comment.findByIdAndDelete(commentId);
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

  },

  /**
   * Edit a comment
   */
  async editComment(commentId: string, userId: string, content: string) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Comment not found');

    if (comment.author.toString() !== userId) {
      throw new Error('Forbidden: Cannot edit another user\'s comment');
    }

    comment.content = content;
    await comment.save();

    return await Comment.findById(commentId).populate('author', 'name username profileImage').lean();
  },

  /**
   * Save a post
   */
  async savePost(postId: string, userId: string) {
    try {
      const save = new SavedPost({ post: postId, user: userId });
      await save.save();
      return true;
    } catch (error: any) {
      if (error.code === 11000) return false;
      throw error;
    }
  },

  /**
   * Unsave a post
   */
  async unsavePost(postId: string, userId: string) {
    const deleted = await SavedPost.findOneAndDelete({ post: postId, user: userId });
    return !!deleted;
  },

  /**
   * Get saved posts for a user
   */
  async getSavedPosts(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const savedPostsQuery = await SavedPost.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'name username profileImage role isVerified'
        }
      })
      .lean();

    const totalCount = await SavedPost.countDocuments({ user: userId });

    // Format like getFeed
    let posts = savedPostsQuery.map(sp => sp.post) as any[];

    if (posts.length > 0) {
      const postIds = posts.map(p => p._id);
      
      const likes = await PostLike.find({
        post: { $in: postIds },
        user: new mongoose.Types.ObjectId(userId)
      }).lean();
      
      const likedPostIds = new Set(likes.map(l => l.post.toString()));
      
      posts = posts.map(p => ({
        ...p,
        isLiked: likedPostIds.has(p._id.toString()),
        isSaved: true
      }));
    }

    return {
      posts,
      page,
      limit,
      totalCount,
      hasMore: (skip + posts.length) < totalCount
    };
  }
};
