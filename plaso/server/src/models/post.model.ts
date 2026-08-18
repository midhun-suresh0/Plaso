import mongoose, { Document, Schema } from 'mongoose';
import { LocationPrivacy } from './user.model';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  content?: string;
  media?: string[];
  visibility: LocationPrivacy;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  locationName?: string;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Post content cannot exceed 1000 characters'],
    },
    media: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: Object.values(LocationPrivacy),
      default: LocationPrivacy.NEARBY,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
    },
    locationName: {
      type: String,
      trim: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
PostSchema.index({ location: '2dsphere' });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ content: 'text' }); // Text index for post searches

// Ensure a post has either content or media
PostSchema.pre('validate', function () {
  const media = this.media as string[] | undefined;
  if (!this.content && (!media || media.length === 0)) {
    throw new Error('Post must have either content or media');
  }
});

export default mongoose.model<IPost>('Post', PostSchema);
