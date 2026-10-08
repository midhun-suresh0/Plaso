import { Types } from 'mongoose';
import Story, { IStory, StoryMediaType, StoryVisibility } from '../models/story.model';
import StoryView from '../models/storyView.model';
import StoryReaction from '../models/storyReaction.model';
import Business from '../models/business.model';
import { AppError, HttpStatus } from '../types';

export class StoryService {
  /**
   * Create a new story
   */
  static async createStory(data: {
    author: string;
    authorType: 'USER' | 'BUSINESS';
    business?: string;
    mediaType: StoryMediaType;
    mediaUrl?: string;
    thumbnailUrl?: string;
    text?: string;
    backgroundColor?: string;
    location?: { coordinates: number[]; type: 'Point' };
    locationName?: string;
    visibility?: StoryVisibility;
  }): Promise<IStory> {
    if (data.authorType === 'BUSINESS' && !data.business) {
      throw new AppError('Business ID is required for business stories', HttpStatus.BAD_REQUEST);
    }

    if (data.authorType === 'BUSINESS') {
      const business = await Business.findById(data.business);
      if (!business) {
        throw new AppError('Business not found', HttpStatus.NOT_FOUND);
      }
      if (business.owner.toString() !== data.author) {
        throw new AppError('Unauthorized to post for this business', HttpStatus.FORBIDDEN);
      }
      if (!business.isActive) {
        throw new AppError('Business is not active or approved', HttpStatus.FORBIDDEN);
      }
    }

    // Default expiration is 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = new Story({
      ...data,
      expiresAt,
    });

    await story.save();
    return story.populate([
      { path: 'author', select: 'name username profileImage' },
      { path: 'business', select: 'name logo' },
    ]);
  }

  /**
   * Get active stories for the home feed
   */
  static async getActiveStories(userId: string): Promise<any> {
    const now = new Date();
    
    // We only get stories that haven't expired
    // We group them by author/business so the frontend gets them grouped
    
    // First, let's find all valid active stories
    const activeStories = await Story.find({
      expiresAt: { $gt: now },
      $or: [
        { visibility: StoryVisibility.PUBLIC },
        { visibility: StoryVisibility.BUSINESS_PUBLIC },
        // TODO: FOLLOWERS_ONLY logic
        { author: new Types.ObjectId(userId) }
      ]
    })
    .sort({ createdAt: 1 }) // Oldest first inside the group
    .populate('author', 'name username profileImage')
    .populate('business', 'name logo')
    .lean();

    // Find which stories this user has viewed
    const views = await StoryView.find({
      viewer: new Types.ObjectId(userId),
      story: { $in: activeStories.map(s => s._id) }
    }).lean();
    
    const viewedStoryIds = new Set(views.map(v => v.story.toString()));

    // Group stories by author (or business)
    const groupedStories = new Map<string, any>();

    // Add user's own stories first (if any) or placeholder
    const userStories = activeStories.filter(s => s.authorType === 'USER' && s.author._id.toString() === userId);
    if (userStories.length > 0) {
      groupedStories.set(`user_${userId}`, {
        type: 'USER',
        id: userId,
        author: userStories[0].author,
        stories: userStories.map(s => ({ ...s, viewed: viewedStoryIds.has(s._id.toString()) })),
        allViewed: userStories.every(s => viewedStoryIds.has(s._id.toString())),
        latestUpdate: userStories[userStories.length - 1].createdAt
      });
    }

    // Group others
    for (const story of activeStories) {
      // skip if it's the current user (handled above)
      if (story.authorType === 'USER' && story.author._id.toString() === userId) continue;

      const key = story.authorType === 'BUSINESS' && story.business
        ? `business_${story.business._id}` 
        : `user_${story.author._id}`;
      
      if (!groupedStories.has(key)) {
        groupedStories.set(key, {
          type: story.authorType,
          id: story.authorType === 'BUSINESS' && story.business ? story.business._id : story.author._id,
          author: story.author,
          business: story.business,
          stories: [],
          allViewed: true,
          latestUpdate: story.createdAt
        });
      }

      const group = groupedStories.get(key);
      const isViewed = viewedStoryIds.has(story._id.toString());
      
      group.stories.push({ ...story, viewed: isViewed });
      if (!isViewed) group.allViewed = false;
      group.latestUpdate = story.createdAt;
    }

    // Convert map to array and sort:
    // 1. Current user's stories (if they have any) always first
    // 2. Unviewed story groups before viewed ones
    // 3. Most recently updated groups first
    const groupsArray = Array.from(groupedStories.values());
    
    groupsArray.sort((a, b) => {
      if (a.id === userId && a.type === 'USER') return -1;
      if (b.id === userId && b.type === 'USER') return 1;
      
      if (a.allViewed !== b.allViewed) {
        return a.allViewed ? 1 : -1;
      }
      
      return new Date(b.latestUpdate).getTime() - new Date(a.latestUpdate).getTime();
    });

    return groupsArray;
  }

  /**
   * Get user's own active stories (for profile)
   */
  static async getUserStories(userId: string): Promise<IStory[]> {
    return Story.find({
      author: new Types.ObjectId(userId),
      authorType: 'USER',
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: -1 })
    .populate('author', 'name username profileImage');
  }

  /**
   * Get a business's active stories
   */
  static async getBusinessStories(businessId: string): Promise<IStory[]> {
    return Story.find({
      business: new Types.ObjectId(businessId),
      authorType: 'BUSINESS',
      expiresAt: { $gt: new Date() }
    })
    .sort({ createdAt: 1 })
    .populate('business', 'name logo');
  }

  /**
   * View a story
   */
  static async viewStory(storyId: string, userId: string): Promise<boolean> {
    const story = await Story.findById(storyId);
    if (!story) return false;
    
    // Don't count views from the author
    if (story.author.toString() === userId) return false;

    // Check if expired
    if (story.expiresAt < new Date()) return false;

    try {
      const view = new StoryView({
        story: new Types.ObjectId(storyId),
        viewer: new Types.ObjectId(userId)
      });
      await view.save();
      
      // Increment view count
      await Story.findByIdAndUpdate(storyId, { $inc: { viewCount: 1 } });
      return true;
    } catch (error: any) {
      // Ignore duplicate key errors (already viewed)
      if (error.code === 11000) return false;
      throw error;
    }
  }

  /**
   * React to a story
   */
  static async reactToStory(storyId: string, userId: string, type = 'LIKE'): Promise<boolean> {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', HttpStatus.NOT_FOUND);
    if (story.expiresAt < new Date()) throw new AppError('Story has expired', HttpStatus.BAD_REQUEST);

    try {
      const reaction = new StoryReaction({
        story: new Types.ObjectId(storyId),
        user: new Types.ObjectId(userId),
        type
      });
      await reaction.save();
      
      await Story.findByIdAndUpdate(storyId, { $inc: { likeCount: 1 } });
      
      // TODO: Create notification (skip if author reacts to own)
      
      return true;
    } catch (error: any) {
      if (error.code === 11000) {
        // Already reacted, let's toggle (unlike)
        await StoryReaction.findOneAndDelete({ story: storyId, user: userId });
        await Story.findByIdAndUpdate(storyId, { $inc: { likeCount: -1 } });
        return false;
      }
      throw error;
    }
  }

  /**
   * Get story viewers (only for author)
   */
  static async getStoryViewers(storyId: string, userId: string): Promise<any[]> {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', HttpStatus.NOT_FOUND);
    
    if (story.author.toString() !== userId) {
      throw new AppError('Unauthorized to see viewers', HttpStatus.FORBIDDEN);
    }

    const views = await StoryView.find({ story: new Types.ObjectId(storyId) })
      .sort({ viewedAt: -1 })
      .populate('viewer', 'name username profileImage');
      
    return views;
  }

  /**
   * Delete a story
   */
  static async deleteStory(storyId: string, userId: string, isAdmin = false): Promise<void> {
    const story = await Story.findById(storyId);
    if (!story) throw new AppError('Story not found', HttpStatus.NOT_FOUND);
    
    if (story.author.toString() !== userId && !isAdmin) {
      throw new AppError('Unauthorized to delete story', HttpStatus.FORBIDDEN);
    }

    await Story.findByIdAndDelete(storyId);
    // Cleanup views and reactions
    await StoryView.deleteMany({ story: storyId });
    await StoryReaction.deleteMany({ story: storyId });
  }
}
