import mongoose, { Document, Schema } from 'mongoose';

export enum ReviewStatus {
  PUBLISHED = 'PUBLISHED',
  HIDDEN = 'HIDDEN',
  REPORTED = 'REPORTED',
  REMOVED = 'REMOVED',
}

export interface IBusinessResponse {
  comment: string;
  respondedAt: Date;
}

export interface IReview extends Document {
  author: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  listing?: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  status: ReviewStatus;
  businessResponse?: IBusinessResponse;
  helpfulVotes: mongoose.Types.ObjectId[];
  helpfulCount: number;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessResponseSchema = new Schema({
  comment: { type: String, required: true, maxlength: 1000 },
  respondedAt: { type: Date, default: Date.now },
}, { _id: false });

const ReviewSchema: Schema = new Schema(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'MarketplaceListing',
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PUBLISHED,
    },
    businessResponse: {
      type: BusinessResponseSchema,
    },
    helpfulVotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ business: 1 });
ReviewSchema.index({ listing: 1 });
ReviewSchema.index({ author: 1 });
ReviewSchema.index({ order: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Prevent multiple reviews from the same user for the same order/listing combination
ReviewSchema.index({ author: 1, order: 1, listing: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
