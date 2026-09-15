import mongoose, { Document, Schema } from 'mongoose';
import { ListingType } from './marketplaceListing.model';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  SERVICE_APPOINTMENT = 'SERVICE_APPOINTMENT',
}

export enum DisputeStatus {
  NONE = 'NONE',
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface IOrderItem {
  listing: mongoose.Types.ObjectId;
  titleSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  unit?: string;
  itemTotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  buyer: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  items: IOrderItem[];
  orderType: ListingType;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  deliveryAddress?: string;
  customerNote?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  cancellationReason?: string;
  disputeReason?: string;
  disputeStatus: DisputeStatus;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'MarketplaceListing',
    required: true,
  },
  titleSnapshot: {
    type: String,
    required: true,
  },
  priceSnapshot: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit: {
    type: String,
  },
  itemTotal: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const OrderSchema: Schema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    buyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    business: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    items: [OrderItemSchema],
    orderType: {
      type: String,
      enum: Object.values(ListingType),
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    fulfillmentType: {
      type: String,
      enum: Object.values(FulfillmentType),
      required: true,
    },
    deliveryAddress: {
      type: String,
    },
    customerNote: {
      type: String,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    disputeReason: {
      type: String,
    },
    disputeStatus: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.NONE,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrderSchema.index({ buyer: 1 });
OrderSchema.index({ business: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>('Order', OrderSchema);
