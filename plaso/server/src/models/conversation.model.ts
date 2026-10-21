import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // Users participating
  business?: mongoose.Types.ObjectId; // Optional: If the conversation is with a business
  listing?: mongoose.Types.ObjectId; // Optional: Context of the conversation (e.g. Marketplace item)
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCounts: Map<string, number>; // Map of userId to unread count
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    business: { type: Schema.Types.ObjectId, ref: 'Business' },
    listing: { type: Schema.Types.ObjectId, ref: 'MarketplaceListing' },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Optimize queries for user's conversations
ConversationSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
