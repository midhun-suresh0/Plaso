import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Comment cannot be empty'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CommentSchema.index({ post: 1, createdAt: -1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
