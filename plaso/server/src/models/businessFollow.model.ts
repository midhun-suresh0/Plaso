import mongoose, { Document, Schema } from 'mongoose';

export interface IBusinessFollow extends Document {
  follower: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BusinessFollowSchema: Schema = new Schema(
  {
    follower: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index so a user can only follow a business once
BusinessFollowSchema.index({ follower: 1, business: 1 }, { unique: true });
BusinessFollowSchema.index({ business: 1 });

export default mongoose.model<IBusinessFollow>('BusinessFollow', BusinessFollowSchema);
