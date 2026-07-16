import { Radio } from 'lucide-react';
import type { SellerBrief } from '@/types/api';

interface Props {
  seller: SellerBrief;
  liveActive?: boolean;
  title?: string;
}

export function ShopHeader({ seller, liveActive, title = 'Catalogue' }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-3 pb-2">
      <div className="flex items-center gap-2">
        {liveActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
            <Radio className="h-2.5 w-2.5" />
            Live
          </span>
        )}
        <span className="text-lg font-semibold text-forest">{title}</span>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-gold/25 px-3 py-1.5">
        <div className="h-6 w-6 rounded-full bg-gold flex items-center justify-center text-white text-xs font-bold">
          {seller.name[0]?.toUpperCase()}
        </div>
        <span className="text-sm font-semibold text-forest">{seller.shopName ?? seller.name}</span>
      </div>
    </div>
  );
}
