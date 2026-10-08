import mongoose, { Document, Schema } from 'mongoose';

export enum AuditAction {
  BUSINESS_APPROVED = 'BUSINESS_APPROVED',
  BUSINESS_REJECTED = 'BUSINESS_REJECTED',
  BUSINESS_SUSPENDED = 'BUSINESS_SUSPENDED',
  BUSINESS_RESTORED = 'BUSINESS_RESTORED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_RESTORED = 'USER_RESTORED',
  LISTING_MODERATED = 'LISTING_MODERATED',
  POST_MODERATED = 'POST_MODERATED',
  STORY_MODERATED = 'STORY_MODERATED',
  REVIEW_MODERATED = 'REVIEW_MODERATED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  REPORT_DISMISSED = 'REPORT_DISMISSED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
}

export interface IAdminAuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType: string;
  targetId: mongoose.Types.ObjectId;
  reason?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema: Schema = new Schema(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    targetType: {
      type: String,
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

AdminAuditLogSchema.index({ admin: 1 });
AdminAuditLogSchema.index({ action: 1 });
AdminAuditLogSchema.index({ targetType: 1, targetId: 1 });
AdminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
