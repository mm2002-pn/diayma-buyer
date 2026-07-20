import { io, type Socket } from 'socket.io-client';
import { env } from './env';

/** Strip /api/v1 suffix to get the Socket.io server URL */
const SOCKET_URL = env.API_URL.replace('/api/v1', '');

/**
 * Creates an authenticated socket for a specific order.
 * The server will join the socket to room `order:{orderId}`.
 */
export function createOrderSocket(orderId: number): Socket {
  return io(SOCKET_URL, {
    auth: { orderId },
    transports: ['websocket'],
    autoConnect: true,
  });
}

/**
 * Creates an anonymous socket for a shop (catalog / live tracking).
 * The server will join the socket to room `shop:{saleSlug}`.
 */
export function createShopSocket(saleSlug: string): Socket {
  return io(SOCKET_URL, {
    query: { saleSlug },
    transports: ['websocket'],
    autoConnect: true,
  });
}
