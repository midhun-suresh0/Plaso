import mongoose, { Document, Schema } from 'mongoose';

export enum ReportStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum ReportReason {
  SPAM = 'Spam',
  OFFENSIVE = 'Offensive content',
  FAKE_REVIEW = 'Fake review',
  HARASSMENT = 'Harassment',
  IRRELEVANT = 'Irrelevant content',
  OTHER = 'Other',
}

export interface IReviewReport extends Document {
  review: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  status: ReportStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewReportSchema: Schema = new Schema(
  {
    review: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewReportSchema.index({ review: 1 });
ReviewReportSchema.index({ reporter: 1 });
ReviewReportSchema.index({ status: 1 });
ReviewReportSchema.index({ createdAt: -1 });

// Prevent duplicate reports from the same user for the same review
ReviewReportSchema.index({ review: 1, reporter: 1 }, { unique: true });

export default mongoose.model<IReviewReport>('ReviewReport', ReviewReportSchema);
