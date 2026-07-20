import { Radio } from 'lucide-react';
import type { SellerBrief } from '@/types/api';

interface Props {
  seller: SellerBrief;
  liveActive?: boolean;
  title?: string;
}

export function ShopHeader({ seller, liveActive, title = 'Catalogue' }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-3 bg-forest">
      <div className="flex items-center gap-2">
        {liveActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
            <Radio className="h-2.5 w-2.5 animate-pulse" />
            Live
          </span>
        )}
        <span className="text-lg font-semibold text-white">{title}</span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1.5">
        <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold shrink-0">
          {seller.name[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-medium text-white/90 max-w-[120px] truncate">
          {seller.shopName ?? seller.name}
        </span>
      </div>
    </div>
  );
}
