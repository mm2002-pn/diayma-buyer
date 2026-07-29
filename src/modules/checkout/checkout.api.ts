import { api } from '@/lib/api';
import type { OrderResponse, PaymentMethod } from '@/types/api';

export interface CreateOrderPayload {
  liveId?: number | null;
  buyerPhone: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; variantId?: number | null; quantity: number }[];
}

export interface Pay2UpProduct {
  id: string;
  price: string;
  name: string;
  qte: number;
}

export interface PaymentInfo {
  orderId: number;
  products: Pay2UpProduct[];
  successUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

export interface CreateOrderResponse extends OrderResponse {
  checkoutUrl?: string;
  paymentInfo?: PaymentInfo;
}

export async function callPay2Up(paymentInfo: PaymentInfo): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_PAY2UP_API_URL}/v1/payment/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      k_id: import.meta.env.VITE_PAY2UP_K_ID,
      k_secret: import.meta.env.VITE_PAY2UP_K_SECRET,
      products: paymentInfo.products,
      fields: { refference: paymentInfo.orderId },
      is_prod: import.meta.env.VITE_PAY2UP_IS_PROD === 'true',
      ipn: paymentInfo.ipnUrl,
      success: paymentInfo.successUrl,
      cancel: paymentInfo.cancelUrl,
    }),
  });

  const data = await res.json();
  const isSuccess = ['SUCCESS', 'SUCCES'].includes(String(data.status).toUpperCase());
  if (!isSuccess || !data.data?.redirect) {
    throw new Error(data.message || 'Pay2Up checkout échoué');
  }
  return data.data.redirect;
}

export const checkoutApi = {
  createOrder: (payload: CreateOrderPayload) =>
    api.post<CreateOrderResponse>('/orders', payload).then((r) => r.data),
};
