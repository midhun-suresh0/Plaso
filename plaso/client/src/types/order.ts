import { MarketplaceListing, ListingType } from './marketplace';
import { User } from '../services/authApi'; // wait, does authApi export User? I will use any for User and Business.

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

export interface OrderItem {
  listing: string | MarketplaceListing;
  titleSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  unit?: string;
  itemTotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  buyer: any; // User
  business: any; // Business
  items: OrderItem[];
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
  scheduledDate?: string;
  scheduledTime?: string;
  cancellationReason?: string;
  disputeReason?: string;
  disputeStatus: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  listing: MarketplaceListing;
  business: any; // Business
  quantity: number;
  addedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

