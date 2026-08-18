import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { AppError, HttpStatus } from '../types';

export const postController = {
  createPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const data = req.body;
      const post = await postService.createPost(userId, data);
      res.status(HttpStatus.CREATED).json({ success: true, data: post });
    } catch (error: any) {
      if (error.message.includes('Post must have either content or media')) {
        return next(new AppError(error.message, HttpStatus.BAD_REQUEST));
      }
      next(error);
    }
  },

  getFeed: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = (req.query.type as string) === 'nearby' ? 'nearby' : 'home';
      
      const feed = await postService.getFeed(userId, page, limit, type);
      res.json({ success: true, data: feed });
    } catch (error: any) {
      next(error);
    }
  },

  getPost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const post = await postService.getPostById(postId, userId);
      res.json({ success: true, data: post });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return next(new AppError(error.message, HttpStatus.FORBIDDEN));
      }
      next(new AppError(error.message, HttpStatus.NOT_FOUND));
    }
  },

  getUserPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = (req as any).user.userId;
      const targetUserId = req.params.userId as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await postService.getUserPosts(targetUserId, currentUserId, page, limit);
      res.json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  },

  deletePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      await postService.deletePost(postId, userId);
      res.json({ success: true, message: 'Post deleted' });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return next(new AppError(error.message, HttpStatus.FORBIDDEN));
      }
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  likePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const liked = await postService.likePost(postId, userId);
      res.json({ success: true, data: { liked } });
    } catch (error: any) {
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  unlikePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const unliked = await postService.unlikePost(postId, userId);
      res.json({ success: true, data: { unliked } });
    } catch (error: any) {
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  getComments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const postId = req.params.id as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const comments = await postService.getComments(postId, page, limit);
      res.json({ success: true, data: comments });
    } catch (error: any) {
      next(error);
    }
  },

  addComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return next(new AppError('Comment cannot be empty', HttpStatus.BAD_REQUEST));
      }

      const comment = await postService.addComment(postId, userId, content);
      res.status(HttpStatus.CREATED).json({ success: true, data: comment });
    } catch (error: any) {
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  deleteComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const commentId = req.params.id as string;
      await postService.deleteComment(commentId, userId);
      res.json({ success: true, message: 'Comment deleted' });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return next(new AppError(error.message, HttpStatus.FORBIDDEN));
      }
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  editComment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const commentId = req.params.id as string;
      const { content } = req.body;
      
      if (!content || !content.trim()) {
        return next(new AppError('Comment cannot be empty', HttpStatus.BAD_REQUEST));
      }

      const comment = await postService.editComment(commentId, userId, content);
      res.json({ success: true, data: comment });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) {
        return next(new AppError(error.message, HttpStatus.FORBIDDEN));
      }
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  savePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const saved = await postService.savePost(postId, userId);
      res.json({ success: true, data: { saved } });
    } catch (error: any) {
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  unsavePost: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const postId = req.params.id as string;
      const unsaved = await postService.unsavePost(postId, userId);
      res.json({ success: true, data: { unsaved } });
    } catch (error: any) {
      next(new AppError(error.message, HttpStatus.BAD_REQUEST));
    }
  },

  getSavedPosts: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const savedPosts = await postService.getSavedPosts(userId, page, limit);
      res.json({ success: true, data: savedPosts });
    } catch (error: any) {
      next(error);
    }
  }
};
