import mongoose, { Document, Schema } from 'mongoose';

export interface IUserPreference extends Document {
  user: mongoose.Types.ObjectId;
  preferredCategories: string[];
  preferredBusinessCategories: string[];
  preferredMarketplaceCategories: string[];
  preferredContentTypes: string[]; // e.g., 'IMAGE', 'VIDEO', 'TEXT'
  preferredDistanceRange: number; // in kilometers
  interactionWeights: Map<string, number>;
  lastUpdatedAt: Date;
}

const UserPreferenceSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferredCategories: [{ type: String }],
    preferredBusinessCategories: [{ type: String }],
    preferredMarketplaceCategories: [{ type: String }],
    preferredContentTypes: [{ type: String }],
    preferredDistanceRange: { type: Number, default: 50 }, // default 50km
    interactionWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

UserPreferenceSchema.index({ user: 1 });

export default mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);
