import mongoose, { Document, Schema } from 'mongoose';

export enum TargetType {
  USER = 'USER',
  POST = 'POST',
  STORY = 'STORY',
  REVIEW = 'REVIEW',
  BUSINESS = 'BUSINESS',
  LISTING = 'LISTING',
  MESSAGE = 'MESSAGE',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  targetType: TargetType;
  reason: string;
  description?: string;
  status: ReportStatus;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: Object.values(TargetType),
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.OPEN,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
    resolutionNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ReportSchema.index({ targetId: 1, targetType: 1 });
ReportSchema.index({ reporter: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: -1 });

// Prevent duplicate open reports from the same user for the same target
ReportSchema.index({ reporter: 1, targetId: 1, targetType: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'OPEN' } });

export default mongoose.model<IReport>('Report', ReportSchema);
