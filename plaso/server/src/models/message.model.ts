import mongoose, { Document, Schema } from 'mongoose';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  LISTING = 'LISTING',
  POST = 'POST',
}

export interface IMessage extends Document {
  conversation: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string; // For IMAGE
  listingId?: mongoose.Types.ObjectId; // For LISTING
  postId?: mongoose.Types.ObjectId; // For POST
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: Object.values(MessageType), default: MessageType.TEXT },
    attachmentUrl: { type: String },
    listingId: { type: Schema.Types.ObjectId, ref: 'Listing' },
    postId: { type: Schema.Types.ObjectId, ref: 'Post' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Optimize fetching messages per conversation
MessageSchema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
