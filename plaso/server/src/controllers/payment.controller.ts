import { Request, Response } from 'express';
import PaymentService from '../services/payment.service';

class PaymentController {
  
  createOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const { orderId } = req.body;

      if (!orderId) {
        res.status(400).json({ success: false, message: 'Order ID is required' });
        return;
      }

      const data = await PaymentService.createPaymentOrder(orderId, userId);
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Create Payment Order Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
  };

  verifyPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, razorpayOrderId, razorpayPaymentId, signature } = req.body;

      if (!orderId || !razorpayOrderId || !razorpayPaymentId || !signature) {
        res.status(400).json({ success: false, message: 'Missing required parameters' });
        return;
      }

      const transaction = await PaymentService.verifyPayment(orderId, razorpayOrderId, razorpayPaymentId, signature);
      res.status(200).json({ success: true, data: { transaction } });
    } catch (error: any) {
      console.error('Verify Payment Error:', error);
      res.status(400).json({ success: false, message: error.message || 'Payment verification failed' });
    }
  };

  webhook = async (req: Request, res: Response): Promise<void> => {
    try {
      // The raw body is required for signature verification
      const rawBody = (req as any).rawBody; 
      const signatureHeader = req.headers['x-razorpay-signature'];
      const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;

      if (!rawBody || !signature) {
        res.status(400).send('Missing signature or body');
        return;
      }

      await PaymentService.handleWebhook(rawBody, signature);
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Webhook Error:', error);
      // Always return 200 to Razorpay so it stops retrying, unless it's a transient server error.
      // Since it's a signature mismatch, returning 400 is fine.
      res.status(400).send(error.message);
    }
  };

  refund = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      
      const transaction = await PaymentService.processRefund(orderId as string);
      res.status(200).json({ success: true, data: { transaction } });
    } catch (error: any) {
      console.error('Refund Error:', error);
      res.status(500).json({ success: false, message: error.message || 'Refund processing failed' });
    }
  };

  getStatus = async (req: Request, res: Response): Promise<void> => {
      try {
          const userId = (req as any).user.userId;
          const { orderId } = req.params;
          
          const data = await PaymentService.getPaymentStatus(orderId as string, userId);
          res.status(200).json({ success: true, data });
      } catch (error: any) {
          console.error('Get Payment Status Error:', error);
          res.status(400).json({ success: false, message: error.message || 'Failed to get payment status' });
      }
  };
}

export default new PaymentController();
