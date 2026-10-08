import mongoose, { Document, Schema } from 'mongoose';

export enum InteractionType {
  POST_VIEW = 'POST_VIEW',
  POST_LIKE = 'POST_LIKE',
  POST_SAVE = 'POST_SAVE',
  POST_COMMENT = 'POST_COMMENT',
  POST_SHARE = 'POST_SHARE',
  USER_FOLLOW = 'USER_FOLLOW',
  BUSINESS_FOLLOW = 'BUSINESS_FOLLOW',
  BUSINESS_VIEW = 'BUSINESS_VIEW',
  LISTING_VIEW = 'LISTING_VIEW',
  LISTING_SAVE = 'LISTING_SAVE',
  LISTING_PURCHASE = 'LISTING_PURCHASE',
  SEARCH = 'SEARCH',
  STORY_VIEW = 'STORY_VIEW',
  STORY_REACTION = 'STORY_REACTION',
  REVIEW = 'REVIEW',
  MESSAGE_BUSINESS = 'MESSAGE_BUSINESS',
  NOT_INTERESTED = 'NOT_INTERESTED'
}

export interface IUserInteraction extends Document {
  user: mongoose.Types.ObjectId;
  type: InteractionType;
  targetId: mongoose.Types.ObjectId; // ID of post, user, business, or listing
  targetModel: 'Post' | 'User' | 'Business' | 'MarketplaceListing' | 'Story';
  weight: number; // Importance of the interaction
  metadata?: any; // Additional context (e.g., search query, categories)
  createdAt: Date;
}

const UserInteractionSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(InteractionType),
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetModel: {
      type: String,
      enum: ['Post', 'User', 'Business', 'MarketplaceListing', 'Story'],
      required: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 1,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 90, // Automatically delete after 90 days to respect privacy/performance
    },
  }
);

// Indexes for performance
UserInteractionSchema.index({ user: 1, createdAt: -1 });
UserInteractionSchema.index({ user: 1, type: 1 });
UserInteractionSchema.index({ targetId: 1, type: 1 });
UserInteractionSchema.index({ createdAt: -1 });

export default mongoose.model<IUserInteraction>('UserInteraction', UserInteractionSchema);
