import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ImageOff, Loader2, PackageOpen, RotateCw } from 'lucide-react';

import { shopApi } from './shop.api';
import { StoryCatalogue } from './StoryCatalogue';
import { EcommerceDesktop } from './EcommerceDesktop';
import { useShopSocket } from '@/hooks/useShopSocket';
import { useIsDesktop } from '@/lib/useIsDesktop';

export function CatalogPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const [jumpToProductId, setJumpToProductId] = useState<number | null>(null);
  const isDesktop = useIsDesktop();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['shop', saleSlug],
    queryFn: () => shopApi.bySaleSlug(saleSlug!),
    enabled: !!saleSlug,
  });

  // Le live n'est plus une condition d'accès (décision D2) : il enrichit
  // seulement l'affichage (badge Live, rattachement de la commande au live).
  const livesQuery = useQuery({
    queryKey: ['active-lives'],
    queryFn: shopApi.activeLives,
    refetchInterval: 30_000,
  });

  useShopSocket(
    saleSlug,
    () => { void livesQuery.refetch(); void refetch(); },
    () => { void livesQuery.refetch(); void refetch(); },
    (featuredProductId) => { setJumpToProductId(featuredProductId); },
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-forest flex items-center justify-center">
          <span className="font-display text-cream text-lg font-bold">D</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center">
          <ImageOff className="h-6 w-6 text-white/30" />
        </div>
        <div className="text-white text-base font-semibold">Boutique introuvable</div>
        <div className="text-white/45 text-sm max-w-xs">
          Vérifie le lien avec la vendeuse, ou réessaie si ta connexion est instable.
        </div>
        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="mt-3 h-11 px-6 rounded-full bg-white/12 text-white text-sm font-semibold flex items-center gap-2 hover:bg-white/20 disabled:opacity-40 transition-colors"
        >
          <RotateCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Réessayer
        </button>
      </div>
    );
  }

  const { seller, products, featuredProductId } = data;

  if (products.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
          <PackageOpen className="h-7 w-7 text-white/30" />
        </div>
        <div>
          <div className="font-display text-2xl font-medium text-white mb-1.5 tracking-tight">
            {seller.shopName ?? seller.name}
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            Cette boutique n'a pas encore de produit.
          </p>
        </div>
      </div>
    );
  }

  const activeLive = (livesQuery.data ?? []).find(
    (l) => l.sellerId === seller.id && l.status === 'LIVE',
  );

  if (isDesktop && seller.shopMode === 'ECOMMERCE') {
    return (
      <EcommerceDesktop
        seller={seller}
        products={products}
        saleSlug={saleSlug!}
        liveActive={!!activeLive}
        activeLiveId={activeLive?.id ?? null}
      />
    );
  }

  return (
    <StoryCatalogue
      seller={seller}
      products={products}
      saleSlug={saleSlug!}
      liveActive={!!activeLive}
      activeLiveId={activeLive?.id ?? null}
      initialProductId={featuredProductId}
      jumpToProductId={jumpToProductId}
    />
  );
}
