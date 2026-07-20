import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createShopSocket } from '@/lib/socket';

/**
 * Connects anonymously to the socket for a shop catalog.
 * Listens for live session events and calls the provided callbacks.
 *
 * - `live:started` → calls onLiveStarted()
 * - `live:ended`   → calls onLiveEnded()
 *
 * Cleans up on unmount or when saleSlug changes.
 */
export function useShopSocket(
  saleSlug: string | undefined,
  onLiveStarted: () => void,
  onLiveEnded: () => void,
): void {
  const socketRef = useRef<Socket | null>(null);

  // Keep stable references to the callbacks so the effect doesn't re-run on every render.
  const onLiveStartedRef = useRef(onLiveStarted);
  const onLiveEndedRef = useRef(onLiveEnded);
  onLiveStartedRef.current = onLiveStarted;
  onLiveEndedRef.current = onLiveEnded;

  useEffect(() => {
    if (!saleSlug) return;

    const socket = createShopSocket(saleSlug);
    socketRef.current = socket;

    socket.on('live:started', () => {
      onLiveStartedRef.current();
    });

    socket.on('live:ended', () => {
      onLiveEndedRef.current();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [saleSlug]);
}
