import mongoose, { Document, Schema } from 'mongoose';

export interface ISavedPost extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
}

const SavedPostSchema: Schema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index so a user can only save a post once
SavedPostSchema.index({ post: 1, user: 1 }, { unique: true });

export default mongoose.model<ISavedPost>('SavedPost', SavedPostSchema);
