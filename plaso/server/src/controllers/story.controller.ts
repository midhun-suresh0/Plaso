import { Request, Response, NextFunction } from 'express';
import { StoryService } from '../services/story.service';
import { HttpStatus } from '../types';
import { StoryMediaType } from '../models/story.model';
import { RecommendationService } from '../services/recommendation.service';
import { InteractionType } from '../models/userInteraction.model';

export class StoryController {
  static async createStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      
      let mediaUrl;
      if (req.file) {
        mediaUrl = `/uploads/stories/${req.file.filename}`;
      }

      const {
        authorType,
        businessId,
        mediaType,
        text,
        backgroundColor,
      } = req.body;

      const story = await StoryService.createStory({
        author: userId,
        authorType: authorType || 'USER',
        business: businessId,
        mediaType: mediaType as StoryMediaType,
        mediaUrl,
        text,
        backgroundColor,
      });

      res.status(HttpStatus.CREATED).json({ success: true, data: story });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveStories(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const groupedStories = await StoryService.getActiveStories(userId);
      res.status(HttpStatus.OK).json({ success: true, data: groupedStories });
    } catch (error) {
      next(error);
    }
  }

  static async viewStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const storyId = req.params.id as string;
      
      const viewed = await StoryService.viewStory(storyId, userId);
      
      if (viewed) {
        RecommendationService.trackInteraction(userId, InteractionType.STORY_VIEW, storyId, 'Story');
      }

      res.status(HttpStatus.OK).json({ success: true, data: { viewed } });
    } catch (error) {
      next(error);
    }
  }

  static async reactToStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const storyId = req.params.id as string;
      const { type } = req.body;
      
      const reacted = await StoryService.reactToStory(storyId, userId, type);
      
      if (reacted) {
        RecommendationService.trackInteraction(userId, InteractionType.STORY_REACTION, storyId, 'Story');
      }

      res.status(HttpStatus.OK).json({ success: true, data: { reacted } });
    } catch (error) {
      next(error);
    }
  }

  static async getStoryViewers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const storyId = req.params.id as string;
      
      const viewers = await StoryService.getStoryViewers(storyId, userId);
      res.status(HttpStatus.OK).json({ success: true, data: viewers });
    } catch (error) {
      next(error);
    }
  }

  static async deleteStory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const storyId = req.params.id as string;
      
      await StoryService.deleteStory(storyId, userId, req.user!.role === 'ADMIN');
      res.status(HttpStatus.OK).json({ success: true, message: 'Story deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
