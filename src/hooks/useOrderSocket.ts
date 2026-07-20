import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { Socket } from 'socket.io-client';
import { createOrderSocket } from '@/lib/socket';

type OrderStatus = 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'Paiement confirmé',
  PREPARING: 'En préparation',
  SHIPPED: 'En cours de livraison',
  DELIVERED: 'Livré !',
};

/**
 * Connects to the socket and listens for real-time updates for a given order.
 *
 * - `order:status` → toast with the new status label in French
 * - `payment:success` → toast.success('Paiement confirmé !')
 *
 * Cleans up on unmount.
 */
export function useOrderSocket(orderId: number | null): void {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (orderId === null) return;

    const socket = createOrderSocket(orderId);
    socketRef.current = socket;

    socket.on('order:status', (data: { status: OrderStatus }) => {
      const label = STATUS_LABELS[data.status] ?? data.status;
      toast(label);
    });

    socket.on('payment:success', () => {
      toast.success('Paiement confirmé !');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [orderId]);
}
