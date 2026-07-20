import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { ShoppingCart, Loader2, ImageOff, Radio } from 'lucide-react';

import { ShopHeader } from '@/components/ShopHeader';
import { shopApi } from './shop.api';
import { useCart } from '@/stores/cart.store';
import { formatCfa } from '@/lib/utils';
import { useIsDesktop } from '@/lib/useIsDesktop';
import { CatalogDesktop } from './CatalogDesktop';
import type { Product, ProductVariant, VariantType } from '@/types/api';
import { useShopSocket } from '@/hooks/useShopSocket';

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
};

function ProductSlide({ p, saleSlug }: { p: Product; saleSlug: string }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);

  // Grouper variantes par type
  const variantsByType = useMemo(() => {
    const map = new Map<VariantType, ProductVariant[]>();
    for (const v of p.variants) {
      if (!map.has(v.type)) map.set(v.type, []);
      map.get(v.type)!.push(v);
    }
    return map;
  }, [p.variants]);

  const types = Array.from(variantsByType.keys());
  const hasVariants = types.length > 0;

  // Une sélection par type — initialisée sur le premier en stock
  const [selectedByType, setSelectedByType] = useState<Map<VariantType, ProductVariant>>(() => {
    const init = new Map<VariantType, ProductVariant>();
    for (const [type, variants] of variantsByType) {
      const first = variants.find((v) => v.stock > 0) ?? variants[0];
      if (first) init.set(type, first);
    }
    return init;
  });

  // Toutes les sélections sont faites ?
  const allSelected = types.every((t) => selectedByType.has(t));

  // Stock disponible = tous les types sélectionnés ont du stock
  const isOutOfStock = hasVariants
    ? types.some((t) => (selectedByType.get(t)?.stock ?? 0) === 0)
    : p.stock === 0;

  // Pour l'API on envoie un seul variantId.
  // Si un seul type → celui sélectionné. Si plusieurs → le premier type sélectionné.
  const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ?? null : null;
  const variantLabel = types.map((t) => selectedByType.get(t)?.value).filter(Boolean).join(' · ');

  function handleAdd() {
    if (isOutOfStock || !allSelected || added) return;
    add({
      productId: p.id,
      variantId: primaryVariant?.id ?? null,
      variantLabel: variantLabel || null,
      productName: p.name,
      photoUrl: p.photoUrl,
      priceCfa: p.priceCfa,
      sellerId: p.sellerId,
      saleSlug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="flex-[0_0_100%] min-w-0 px-4">
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="relative aspect-[4/5] w-full bg-cream-100">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt={p.name ?? ''} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-forest/30">
              <ImageOff className="h-16 w-16" />
            </div>
          )}
          <div className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-4 py-2 shadow-soft">
            <div className="text-[10px] uppercase tracking-wider text-forest/60">Prix</div>
            <div className="text-2xl font-bold text-forest leading-none">
              {p.priceCfa.toLocaleString('fr-FR')} <span className="text-xs font-medium">F CFA</span>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {p.name && <div className="text-xl font-semibold text-forest">{p.name}</div>}

          {/* Variantes groupées par type */}
          {hasVariants && (
            <div className="space-y-3">
              {types.map((type) => {
                const variants = variantsByType.get(type)!;
                const selected = selectedByType.get(type);
                return (
                  <div key={type}>
                    <div className="text-xs font-medium text-forest/60 uppercase tracking-wider mb-1.5">
                      {VARIANT_LABELS[type]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {variants.map((v) => {
                        const active = selected?.id === v.id;
                        const disabled = v.stock === 0;
                        return (
                          <button
                            key={v.id}
                            disabled={disabled}
                            onClick={() => {
                              const next = new Map(selectedByType);
                              next.set(type, v);
                              setSelectedByType(next);
                            }}
                            className={`min-w-[52px] h-10 px-3 rounded-lg text-sm font-medium border transition ${
                              active
                                ? 'bg-forest text-white border-forest'
                                : disabled
                                ? 'text-forest/30 border-forest/10 line-through'
                                : 'bg-white text-forest border-forest/20'
                            }`}
                          >
                            {v.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {isOutOfStock ? (
            <button disabled className="btn-primary bg-forest/30">
              Rupture de stock
            </button>
          ) : added ? (
            <button disabled className="btn-primary bg-green-600">
              ✓ Ajouté au panier
            </button>
          ) : (
            <button className="btn-primary" onClick={handleAdd}>
              <ShoppingCart className="h-5 w-5" />
              Ajouter au panier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CatalogPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' });
  const [selectedIdx, setSelectedIdx] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['shop', saleSlug],
    queryFn: () => shopApi.bySaleSlug(saleSlug!),
    enabled: !!saleSlug,
  });

  // useQuery : évite `= []` en destructuring (référence différente à chaque render).
  const livesQuery = useQuery({
    queryKey: ['active-lives'],
    queryFn: shopApi.activeLives,
    refetchInterval: 30_000,
  });
  const lives = livesQuery.data;

  // Socket temps réel : invalide le cache live dès qu'un événement arrive
  // (évite d'attendre les 30s de polling).
  useShopSocket(
    saleSlug,
    () => { void livesQuery.refetch(); },
    () => { void livesQuery.refetch(); },
  );

  // Cart : sélection stable de la référence brute, dérivation via useMemo.
  const allCartItems = useCart((s) => s.items);
  const { cartTotalQty, cartTotalCfa } = useMemo(() => {
    const items = saleSlug ? allCartItems.filter((i) => i.saleSlug === saleSlug) : [];
    return {
      cartTotalQty: items.reduce((a, i) => a + i.quantity, 0),
      cartTotalCfa: items.reduce((a, i) => a + i.priceCfa * i.quantity, 0),
    };
  }, [allCartItems, saleSlug]);

  // Handler stable pour éviter un ré-abonnement embla à chaque render.
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIdx(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (isLoading || livesQuery.isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-forest text-lg font-semibold">Boutique introuvable</div>
        <div className="text-forest/60 text-sm mt-2">Vérifie le lien avec la vendeuse.</div>
      </div>
    );
  }

  const { seller, products } = data;
  const liveActive = (lives ?? []).some((l) => l.sellerId === seller.id && l.status === 'LIVE');

  // Pas de live en cours → écran d'attente
  if (!liveActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center bg-cream">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-forest/10 flex items-center justify-center">
            <Radio className="h-10 w-10 text-forest/30" />
          </div>
        </div>
        <div>
          <div className="font-display text-2xl font-semibold text-forest mb-2">
            {seller.shopName ?? seller.name}
          </div>
          <p className="text-forest/60 text-base">
            Pas de live en cours pour l'instant.
          </p>
          <p className="text-forest/40 text-sm mt-1">
            La boutique s'ouvrira dès que la vendeuse démarre son live.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-forest/40">
          <Loader2 className="h-3 w-3 animate-spin" />
          Vérification automatique toutes les 30s…
        </div>
      </div>
    );
  }

  // Desktop → site e-commerce classique (grid de cards)
  if (isDesktop) {
    return (
      <CatalogDesktop
        seller={seller}
        products={products}
        saleSlug={saleSlug!}
        liveActive={liveActive}
        cartTotalQty={cartTotalQty}
        cartTotalCfa={cartTotalCfa}
      />
    );
  }

  // Mobile → parcours swipe TikTok-like
  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <ShopHeader seller={seller} liveActive={liveActive} />

      <div className="flex-1 flex flex-col">
        {products.length === 1 ? (
          <ProductSlide p={products[0]} saleSlug={saleSlug!} />
        ) : (
          <>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex touch-pan-y">
                {products.map((p) => (
                  <ProductSlide key={p.id} p={p} saleSlug={saleSlug!} />
                ))}
              </div>
            </div>

            {/* Dots indicateur */}
            <div className="flex justify-center gap-1.5 py-3">
              {products.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === selectedIdx ? 'w-6 bg-forest' : 'w-1.5 bg-forest/30'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <div className="text-center text-xs text-forest/50 pb-4">
          {products.length > 1 ? `Swipe pour découvrir · ${products.length} produits` : '1 produit'}
        </div>
      </div>

      {cartTotalQty > 0 && (
        <div className="sticky bottom-0 inset-x-0 p-4 bg-cream/95 backdrop-blur border-t border-forest/10">
          <button className="btn-primary" onClick={() => navigate(`/s/${saleSlug}/checkout`)}>
            <ShoppingCart className="h-5 w-5" />
            Voir mon panier ({cartTotalQty}) · {formatCfa(cartTotalCfa)}
          </button>
        </div>
      )}
    </div>
  );
}
