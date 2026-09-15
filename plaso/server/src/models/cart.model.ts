import mongoose, { Document, Schema } from 'mongoose';

export interface ICartItem {
  listing: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  quantity: number;
  addedAt: Date;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema: Schema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true,
  },
  business: {
    type: Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity cannot be less than 1'],
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const CartSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

CartSchema.index({ user: 1 });

export default mongoose.model<ICart>('Cart', CartSchema);
