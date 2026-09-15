import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export interface ITransaction extends Document {
  order: mongoose.Types.ObjectId;
  buyer: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: TransactionStatus;
  provider: string;
  providerTransactionId?: string;
  type: TransactionType;
  metadata?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
    },
    provider: {
      type: String,
      default: 'NONE',
    },
    providerTransactionId: {
      type: String,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      default: TransactionType.PAYMENT,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TransactionSchema.index({ order: 1 });
TransactionSchema.index({ buyer: 1 });
TransactionSchema.index({ business: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
