import mongoose, { Document, Schema } from 'mongoose';

export enum StoryMediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  TEXT = 'TEXT',
}

export enum StoryVisibility {
  PUBLIC = 'PUBLIC',
  FOLLOWERS_ONLY = 'FOLLOWERS_ONLY',
  BUSINESS_PUBLIC = 'BUSINESS_PUBLIC',
}

export interface IStory extends Document {
  author: mongoose.Types.ObjectId;
  authorType: 'USER' | 'BUSINESS';
  business?: mongoose.Types.ObjectId;
  mediaType: StoryMediaType;
  mediaUrl?: string;
  thumbnailUrl?: string; // For videos
  text?: string;
  backgroundColor?: string; // For text stories
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  locationName?: string;
  visibility: StoryVisibility;
  expiresAt: Date;
  viewCount: number;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema: Schema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorType: {
      type: String,
      enum: ['USER', 'BUSINESS'],
      required: true,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
    },
    mediaType: {
      type: String,
      enum: Object.values(StoryMediaType),
      required: true,
    },
    mediaUrl: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
    },
    text: {
      type: String,
      maxlength: 300,
    },
    backgroundColor: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    locationName: {
      type: String,
    },
    visibility: {
      type: String,
      enum: Object.values(StoryVisibility),
      default: StoryVisibility.PUBLIC,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to automatically delete expired stories
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StorySchema.index({ author: 1, expiresAt: 1 });
StorySchema.index({ business: 1, expiresAt: 1 });

// Ensure correct fields based on media type
StorySchema.pre('validate', function () {
  if (this.mediaType === StoryMediaType.TEXT && !this.text) {
    throw new Error('Text stories must have text content');
  }
  if ((this.mediaType === StoryMediaType.IMAGE || this.mediaType === StoryMediaType.VIDEO) && !this.mediaUrl) {
    throw new Error('Image and video stories must have a mediaUrl');
  }
});

export default mongoose.model<IStory>('Story', StorySchema);
