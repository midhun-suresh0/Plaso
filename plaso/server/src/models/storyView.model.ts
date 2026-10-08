import mongoose, { Document, Schema } from 'mongoose';

export interface IStoryView extends Document {
  story: mongoose.Types.ObjectId;
  viewer: mongoose.Types.ObjectId;
  viewedAt: Date;
}

const StoryViewSchema: Schema = new Schema(
  {
    story: {
      type: Schema.Types.ObjectId,
      ref: 'Story',
      required: true,
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Only need viewedAt
  }
);

// Prevent duplicate views from the same user for the same story
StoryViewSchema.index({ story: 1, viewer: 1 }, { unique: true });

export default mongoose.model<IStoryView>('StoryView', StoryViewSchema);
