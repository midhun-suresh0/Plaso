import mongoose, { Document, Schema } from 'mongoose';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
}

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: NotificationType;
  post?: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment', // if we want to reference comments
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for chronological fetching and unread counts
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
