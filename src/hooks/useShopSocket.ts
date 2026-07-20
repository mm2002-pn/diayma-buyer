import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { createShopSocket } from '@/lib/socket';

export function useShopSocket(
  saleSlug: string | undefined,
  onLiveStarted: () => void,
  onLiveEnded: () => void,
  onFeaturedChanged?: (featuredProductId: number | null) => void,
): void {
  const socketRef = useRef<Socket | null>(null);

  const onLiveStartedRef = useRef(onLiveStarted);
  const onLiveEndedRef = useRef(onLiveEnded);
  const onFeaturedChangedRef = useRef(onFeaturedChanged);
  onLiveStartedRef.current = onLiveStarted;
  onLiveEndedRef.current = onLiveEnded;
  onFeaturedChangedRef.current = onFeaturedChanged;

  useEffect(() => {
    if (!saleSlug) return;

    const socket = createShopSocket(saleSlug);
    socketRef.current = socket;

    socket.on('live:started', () => { onLiveStartedRef.current(); });
    socket.on('live:ended', () => { onLiveEndedRef.current(); });
    socket.on('live:featured', ({ featuredProductId }: { featuredProductId: number | null }) => {
      onFeaturedChangedRef.current?.(featuredProductId);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [saleSlug]);
}
