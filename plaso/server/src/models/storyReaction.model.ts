import mongoose, { Document, Schema } from 'mongoose';

export interface IStoryReaction extends Document {
  story: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  type: string;
  createdAt: Date;
}

const StoryReactionSchema: Schema = new Schema(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      default: 'LIKE',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reactions from the same user for the same story
StoryReactionSchema.index({ story: 1, user: 1 }, { unique: true });

export default mongoose.model<IStoryReaction>('StoryReaction', StoryReactionSchema);
