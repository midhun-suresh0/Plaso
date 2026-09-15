import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../config/env';
import Order, { PaymentStatus } from '../models/order.model';
import Transaction, { TransactionStatus, TransactionType } from '../models/transaction.model';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.model';


class PaymentService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  /**
   * Create a Razorpay Order and corresponding pending Transaction
   */
  async createPaymentOrder(orderId: string, userId: string) {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.buyer.toString() !== userId) {
      throw new Error('Unauthorized: Order does not belong to user');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new Error('Order is already paid');
    }

    // Convert amount to smallest unit (Paise for INR)
    const amountInPaise = Math.round(order.totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: order.currency || 'INR',
      receipt: `receipt_${order._id}`,
    };

    const razorpayOrder = await this.razorpay.orders.create(options);

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error('Failed to create Razorpay order');
    }

    // Upsert a pending transaction for this payment attempt
    let transaction = await Transaction.findOne({
      order: order._id,
      status: TransactionStatus.PENDING,
      type: TransactionType.PAYMENT
    });

    if (!transaction) {
      transaction = new Transaction({
        order: order._id,
        buyer: order.buyer,
        business: order.business,
        amount: order.totalAmount,
        currency: order.currency || 'INR',
        status: TransactionStatus.PENDING,
        provider: 'RAZORPAY',
        providerTransactionId: razorpayOrder.id,
        type: TransactionType.PAYMENT,
      });
    } else {
      transaction.providerTransactionId = razorpayOrder.id;
      transaction.amount = order.totalAmount; // Update just in case
    }
    
    await transaction.save();

    return {
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: options.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verify the Razorpay payment signature
   */
  async verifyPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Verify signature
    const text = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (expectedSignature !== signature) {
      // Signature is invalid, update transaction to failed
      await Transaction.findOneAndUpdate(
        { providerTransactionId: razorpayOrderId },
        { status: TransactionStatus.FAILED }
      );
      throw new Error('Invalid payment signature');
    }

    // Valid signature, update Transaction
    const transaction = await Transaction.findOneAndUpdate(
      { providerTransactionId: razorpayOrderId },
      { 
        status: TransactionStatus.SUCCESS,
        metadata: {
          razorpayPaymentId,
          signature,
        }
      },
      { new: true }
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Update Order payment status
    if (order.paymentStatus !== PaymentStatus.PAID) {
      order.paymentStatus = PaymentStatus.PAID;
      await order.save();

      // Notifications
      await NotificationService.createNotification({
        recipient: order.buyer.toString(),
        sender: order.business.toString(), // using business as sender context
        type: NotificationType.ORDER_STATUS_UPDATED,
        order: order._id.toString()
      });

      await NotificationService.createNotification({
        recipient: order.business.toString(),
        sender: order.buyer.toString(),
        type: NotificationType.ORDER_STATUS_UPDATED,
        order: order._id.toString()
      });
    }

    return transaction;
  }

  /**
   * Handle Razorpay Webhooks
   */
  async handleWebhook(rawBody: string, signature: string) {
    let event: any;
    try {
      // Validate webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        throw new Error('Invalid webhook signature');
      }

      event = JSON.parse(rawBody);
    } catch (err) {
      throw new Error('Webhook error: ' + (err as Error).message);
    }

    switch (event.event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(event.payload.payment.entity);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(event.payload.payment.entity);
        break;
      case 'refund.processed':
        // Refund webhook logic can go here
        break;
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }
  }

  private async handlePaymentCaptured(paymentEntity: any) {
    const razorpayOrderId = paymentEntity.order_id;
    const razorpayPaymentId = paymentEntity.id;

    const transaction = await Transaction.findOne({ providerTransactionId: razorpayOrderId });
    if (!transaction) return;

    if (transaction.status !== TransactionStatus.SUCCESS) {
      transaction.status = TransactionStatus.SUCCESS;
      if (!transaction.metadata) {
          transaction.metadata = new Map();
      }
      transaction.metadata.set('razorpayPaymentId', razorpayPaymentId);
      await transaction.save();

      const order = await Order.findById(transaction.order);
      if (order && order.paymentStatus !== PaymentStatus.PAID) {
        order.paymentStatus = PaymentStatus.PAID;
        await order.save();
      }
    }
  }

  private async handlePaymentFailed(paymentEntity: any) {
    const razorpayOrderId = paymentEntity.order_id;
    
    const transaction = await Transaction.findOne({ providerTransactionId: razorpayOrderId });
    if (!transaction) return;

    if (transaction.status === TransactionStatus.PENDING) {
      transaction.status = TransactionStatus.FAILED;
      if (!transaction.metadata) {
          transaction.metadata = new Map();
      }
      transaction.metadata.set('failureReason', paymentEntity.error_description || 'Payment Failed');
      await transaction.save();

      const order = await Order.findById(transaction.order);
      if (order && order.paymentStatus === PaymentStatus.PENDING) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
      }
    }
  }

  /**
   * Admin Refund
   */
  async processRefund(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new Error('Can only refund paid orders');
    }

    const transaction = await Transaction.findOne({
      order: orderId,
      status: TransactionStatus.SUCCESS,
      type: TransactionType.PAYMENT
    });

    if (!transaction || !transaction.metadata || !transaction.metadata.get('razorpayPaymentId')) {
      throw new Error('Payment transaction not found for this order');
    }

    const paymentId = transaction.metadata.get('razorpayPaymentId')!;
    
    // Process refund via Razorpay API
    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: Math.round(order.totalAmount * 100), // full refund
    });

    if (!refund) {
      throw new Error('Refund failed at provider');
    }

    // Create refund transaction
    const refundTransaction = new Transaction({
      order: order._id,
      buyer: order.buyer,
      business: order.business,
      amount: order.totalAmount,
      currency: order.currency || 'INR',
      status: TransactionStatus.REFUNDED,
      provider: 'RAZORPAY',
      providerTransactionId: refund.id,
      type: TransactionType.REFUND,
    });
    
    await refundTransaction.save();

    order.paymentStatus = PaymentStatus.REFUNDED;
    await order.save();

    await NotificationService.createNotification({
      recipient: order.buyer.toString(),
      sender: order.business.toString(), // context
      type: NotificationType.ORDER_STATUS_UPDATED,
      order: order._id.toString()
    });

    return refundTransaction;
  }
  
  async getPaymentStatus(orderId: string, userId: string) {
      const order = await Order.findById(orderId);
      if (!order) throw new Error('Order not found');
      
      if (order.buyer.toString() !== userId) {
          throw new Error('Unauthorized');
      }
      
      const transaction = await Transaction.findOne({ order: orderId }).sort({ createdAt: -1 });
      
      return {
          orderPaymentStatus: order.paymentStatus,
          transactionStatus: transaction?.status || null,
          transactionId: transaction?._id || null,
      };
  }
}

export default new PaymentService();
