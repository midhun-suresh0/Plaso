import mongoose from 'mongoose';
import Order, { IOrder, OrderStatus, PaymentStatus, FulfillmentType, DisputeStatus } from '../models/order.model';
import Cart from '../models/cart.model';
import MarketplaceListing, { ListingType } from '../models/marketplaceListing.model';
import Transaction, { TransactionStatus, TransactionType } from '../models/transaction.model';
import Business from '../models/business.model';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';
import { AppError, HttpStatus } from '../types';

export class OrderService {
  /**
   * Create an order from cart
   */
  static async createOrder(
    userId: string,
    checkoutData: {
      deliveryAddress?: string;
      customerNote?: string;
      scheduledDate?: Date;
      scheduledTime?: string;
    }
  ): Promise<IOrder[]> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cart = await Cart.findOne({ user: userId }).populate('items.listing').session(session);

      if (!cart || cart.items.length === 0) {
        throw new AppError('Cart is empty', HttpStatus.BAD_REQUEST);
      }

      // Group cart items by business to create separate orders per business
      const businessMap = new Map<string, any[]>();

      for (const item of cart.items) {
        const listing = item.listing as any;
        
        if (!listing.isActive || listing.availabilityStatus !== 'AVAILABLE') {
          throw new AppError(`Listing ${listing.title} is no longer available`, HttpStatus.BAD_REQUEST);
        }

        if (listing.type === ListingType.PRODUCT && listing.stock !== undefined && listing.stock !== null) {
          if (item.quantity > listing.stock) {
            throw new AppError(`Not enough stock for ${listing.title}`, HttpStatus.BAD_REQUEST);
          }
        }

        const businessId = listing.business.toString();
        if (!businessMap.has(businessId)) {
          businessMap.set(businessId, []);
        }
        businessMap.get(businessId)!.push({ item, listing });
      }

      const createdOrders: IOrder[] = [];

      for (const [businessId, groupedItems] of businessMap.entries()) {
        const business = await Business.findById(businessId).session(session);
        if (!business || business.verificationStatus !== 'APPROVED') {
          throw new AppError('Business is not approved for transactions', HttpStatus.BAD_REQUEST);
        }

        let subtotal = 0;
        const orderItems = [];
        let isProductOrder = false;
        let isServiceOrder = false;

        for (const { item, listing } of groupedItems) {
          const itemTotal = listing.price * item.quantity;
          subtotal += itemTotal;

          if (listing.type === ListingType.PRODUCT) {
            isProductOrder = true;
            // Deduct stock safely
            if (listing.stock !== undefined && listing.stock !== null) {
              listing.stock -= item.quantity;
              if (listing.stock === 0) {
                listing.availabilityStatus = 'OUT_OF_STOCK';
              }
              await listing.save({ session });
            }
          } else {
            isServiceOrder = true;
          }

          orderItems.push({
            listing: listing._id,
            titleSnapshot: listing.title,
            priceSnapshot: listing.price,
            quantity: item.quantity,
            unit: listing.unit,
            itemTotal,
          });
        }

        if (isProductOrder && isServiceOrder) {
            throw new AppError('Cannot mix products and services in the same order yet. Please order them separately.', HttpStatus.BAD_REQUEST);
        }

        const orderType = isProductOrder ? ListingType.PRODUCT : ListingType.SERVICE;
        const fulfillmentType = isProductOrder ? FulfillmentType.DELIVERY : FulfillmentType.SERVICE_APPOINTMENT;

        // Generate unique order number (e.g. PLS-2026-XXXXX)
        const count = await Order.countDocuments().session(session);
        const orderNumber = `PLS-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

        const totalAmount = subtotal; // delivery fee & discount are 0 for now

        const order = new Order({
          orderNumber,
          buyer: userId,
          business: businessId,
          items: orderItems,
          orderType,
          subtotal,
          deliveryFee: 0,
          discount: 0,
          totalAmount,
          currency: 'INR',
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING,
          fulfillmentType,
          deliveryAddress: checkoutData.deliveryAddress,
          customerNote: checkoutData.customerNote,
          scheduledDate: checkoutData.scheduledDate,
          scheduledTime: checkoutData.scheduledTime,
        });

        await order.save({ session });

        // Escrow-style placeholder: Record a pending transaction
        const transaction = new Transaction({
          order: order._id,
          buyer: userId,
          business: businessId,
          amount: totalAmount,
          currency: order.currency,
          status: TransactionStatus.PENDING,
          type: TransactionType.PAYMENT,
          provider: 'NONE',
        });

        await transaction.save({ session });
        createdOrders.push(order);

        // Notify business owner
        await NotificationService.createNotification({
          recipient: business.owner.toString(),
          sender: userId,
          type: NotificationType.ORDER_CREATED,
          order: order._id as any,
        });
      }

      // Clear cart
      await Cart.findOneAndDelete({ user: userId }).session(session);

      await session.commitTransaction();
      return createdOrders;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getMyOrders(userId: string): Promise<IOrder[]> {
    return Order.find({ buyer: userId })
      .populate('business', 'name logoImage')
      .populate('items.listing', 'images category title')
      .sort({ createdAt: -1 });
  }

  static async getOrderById(orderId: string, userId: string, role: string): Promise<IOrder> {
    const order = await Order.findById(orderId)
      .populate('business', 'name owner logoImage email phone')
      .populate('buyer', 'name email profileImage phone')
      .populate('items.listing', 'images category slug');

    if (!order) {
      throw new AppError('Order not found', HttpStatus.NOT_FOUND);
    }

    // Role-based access control
    if (role === 'USER' && order.buyer._id.toString() !== userId) {
      throw new AppError('Unauthorized access to order', HttpStatus.FORBIDDEN);
    }

    if (role === 'BUSINESS_OWNER') {
      const business = order.business as any;
      if (business.owner.toString() !== userId) {
        throw new AppError('Unauthorized access to business order', HttpStatus.FORBIDDEN);
      }
    }

    return order;
  }

  static async cancelOrder(orderId: string, userId: string, reason: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('business');
    if (!order) throw new AppError('Order not found', HttpStatus.NOT_FOUND);

    if (order.buyer.toString() !== userId) {
      throw new AppError('Unauthorized', HttpStatus.FORBIDDEN);
    }

    if (order.orderStatus !== OrderStatus.PENDING && order.orderStatus !== OrderStatus.CONFIRMED) {
      throw new AppError('Order cannot be cancelled at this stage', HttpStatus.BAD_REQUEST);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      order.orderStatus = OrderStatus.CANCELLED;
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      await order.save({ session });

      // Restore stock if it was a product order
      if (order.orderType === ListingType.PRODUCT) {
        for (const item of order.items) {
          await MarketplaceListing.findByIdAndUpdate(
            item.listing,
            { $inc: { stock: item.quantity }, $set: { availabilityStatus: 'AVAILABLE' } },
            { session }
          );
        }
      }

      // Mark transaction as failed/cancelled
      await Transaction.findOneAndUpdate(
        { order: order._id, status: TransactionStatus.PENDING },
        { status: TransactionStatus.FAILED },
        { session }
      );

      const business = order.business as any;
      await NotificationService.createNotification({
        recipient: business.owner.toString(),
        sender: userId,
        type: NotificationType.ORDER_STATUS_UPDATED,
        order: order._id as any,
      });

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async confirmOrderCompletion(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('business');
    if (!order) throw new AppError('Order not found', HttpStatus.NOT_FOUND);

    if (order.buyer.toString() !== userId) {
      throw new AppError('Unauthorized', HttpStatus.FORBIDDEN);
    }

    if (order.orderStatus !== OrderStatus.READY) {
      throw new AppError('Order is not ready for completion', HttpStatus.BAD_REQUEST);
    }

    order.orderStatus = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    // Simulate escrow release
    order.paymentStatus = PaymentStatus.PAID; 
    await order.save();

    await Transaction.findOneAndUpdate(
      { order: order._id },
      { status: TransactionStatus.SUCCESS }
    );

    const business = order.business as any;
    await NotificationService.createNotification({
      recipient: business.owner.toString(),
      sender: userId,
      type: NotificationType.ORDER_STATUS_UPDATED,
      order: order._id as any,
    });

    return order;
  }

  static async getBusinessOrders(businessId: string, ownerId: string): Promise<IOrder[]> {
    const business = await Business.findById(businessId);
    if (!business || business.owner.toString() !== ownerId) {
      throw new AppError('Unauthorized access to business orders', HttpStatus.FORBIDDEN);
    }

    return Order.find({ business: businessId })
      .populate('buyer', 'name profileImage')
      .populate('items.listing', 'images title')
      .sort({ createdAt: -1 });
  }

  static async updateBusinessOrderStatus(orderId: string, ownerId: string, newStatus: OrderStatus): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('business');
    if (!order) throw new AppError('Order not found', HttpStatus.NOT_FOUND);

    const business = order.business as any;
    if (business.owner.toString() !== ownerId) {
      throw new AppError('Unauthorized access to business order', HttpStatus.FORBIDDEN);
    }

    // Status transition validation
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.COMPLETED], // Usually completed by user, but business can mark if needed
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.DISPUTED]: [],
    };

    if (!validTransitions[order.orderStatus].includes(newStatus)) {
      throw new AppError(`Invalid transition from ${order.orderStatus} to ${newStatus}`, HttpStatus.BAD_REQUEST);
    }

    order.orderStatus = newStatus;
    if (newStatus === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
      order.paymentStatus = PaymentStatus.PAID;
      await Transaction.findOneAndUpdate({ order: order._id }, { status: TransactionStatus.SUCCESS });
    }
    
    await order.save();

    await NotificationService.createNotification({
      recipient: order.buyer.toString(),
      sender: ownerId,
      type: NotificationType.ORDER_STATUS_UPDATED,
      order: order._id as any,
    });

    return order;
  }

  static async getAdminOrders(): Promise<IOrder[]> {
    return Order.find()
      .populate('business', 'name')
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });
  }

  static async disputeOrder(orderId: string, userId: string, reason: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('business');
    if (!order) throw new AppError('Order not found', HttpStatus.NOT_FOUND);

    if (order.buyer.toString() !== userId) {
      throw new AppError('Unauthorized', HttpStatus.FORBIDDEN);
    }

    if (order.orderStatus === OrderStatus.CANCELLED) {
      throw new AppError('Cannot dispute a cancelled order', HttpStatus.BAD_REQUEST);
    }

    order.orderStatus = OrderStatus.DISPUTED;
    order.disputeReason = reason;
    order.disputeStatus = DisputeStatus.OPEN;
    await order.save();

    const business = order.business as any;
    await NotificationService.createNotification({
      recipient: business.owner.toString(),
      sender: userId,
      type: NotificationType.ORDER_STATUS_UPDATED,
      order: order._id as any,
    });

    return order;
  }
}
