import { Radio } from 'lucide-react';
import { DiaymaIcon } from '@/components/Logo';
import type { SellerBrief } from '@/types/api';

interface Props {
  seller: SellerBrief;
  liveActive?: boolean;
  title?: string;
}

export function ShopHeader({ seller, liveActive, title = 'Catalogue' }: Props) {
  return (
    <div className="flex items-center justify-between px-4 pt-3.5 pb-3.5 bg-white/95 border-b border-slate-100 sticky top-0 z-20 backdrop-blur-sm">
      <div className="flex items-center gap-2.5">
        {/* Logo SVG — identique au seller */}
        <div className="h-8 w-8 rounded-lg bg-[#0066FF] flex items-center justify-center shrink-0 shadow-sm">
          <DiaymaIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          {liveActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Live
            </span>
          )}
          <span className="text-sm font-semibold text-slate-800">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-slate-50 px-2.5 py-1.5 border border-slate-200">
        <div className="h-5 w-5 rounded-full bg-[#0066FF] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {seller.name[0]?.toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-slate-700 max-w-[120px] truncate">
          {seller.shopName ?? seller.name}
        </span>
      </div>
    </div>
  );
}
