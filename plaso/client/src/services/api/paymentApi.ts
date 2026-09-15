import api from '../api';
import { ApiResponse } from '../../types';

export interface PaymentOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentRequest {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
}

export const paymentApi = {
  createOrder: async (orderId: string) => {
    const response = await api.post<PaymentOrderResponse>('/payments/create-order', { orderId });
    // Our API returns { success, data: { ...fields } }
    return response;
  },

  verifyPayment: async (verificationData: VerifyPaymentRequest) => {
    const response = await api.post<any>('/payments/verify', verificationData);
    return response;
  },

  getPaymentStatus: async (orderId: string) => {
    const response = await api.get<{ data: any }>(`/payments/${orderId}/status`);
    return response;
  },
  
  refundOrder: async (orderId: string) => {
    const response = await api.post<any>(`/payments/${orderId}/refund`, {});
    return response;
  }
};
