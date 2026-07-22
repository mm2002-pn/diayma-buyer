import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ImageOff, MapPin, Radio, Sparkles, ShoppingCart, Package, Clock, CreditCard } from 'lucide-react';
import { Logo } from '@/components/Logo';

import { formatCfa } from '@/lib/utils';
import { useCart } from '@/stores/cart.store';
import type { Product, ProductVariant, SellerBrief, VariantType } from '@/types/api';

const VARIANT_LABELS: Record<VariantType, string> = {
  COULEUR: 'Couleur',
  TAILLE: 'Taille',
  POINTURE: 'Pointure',
};

interface Props {
  seller: SellerBrief;
  products: Product[];
  saleSlug: string;
  liveActive: boolean;
  activeLiveId?: number | null;
  cartTotalQty: number;
  cartTotalCfa: number;
}

function ProductCard({ p, saleSlug }: { p: Product; saleSlug: string }) {
  const add = useCart((s) => s.add);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [added, setAdded] = useState(false);

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

  const [selectedByType, setSelectedByType] = useState<Map<VariantType, ProductVariant>>(() => {
    const init = new Map<VariantType, ProductVariant>();
    for (const [type, variants] of variantsByType) {
      const first = variants.find((v) => v.stock > 0) ?? variants[0];
      if (first) init.set(type, first);
    }
    return init;
  });

  const isOutOfStock = hasVariants
    ? types.some((t) => (selectedByType.get(t)?.stock ?? 0) === 0)
    : p.stock === 0;

  const primaryVariant = types.length > 0 ? selectedByType.get(types[0]) ?? null : null;
  const variantLabel = types.map((t) => selectedByType.get(t)?.value).filter(Boolean).join(' · ');

  function handleAdd() {
    if (isOutOfStock || added) return;
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
    <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300">
      {/* Photo */}
      <div className="relative aspect-[4/5] w-full bg-slate-50 overflow-hidden">
        {p.photoUrl ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}
            <img
              src={p.photoUrl}
              alt={p.name ?? ''}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-200">
            <ImageOff className="h-12 w-12" />
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-3 left-3">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 shadow-sm border border-slate-100">
            <span className="text-sm font-extrabold text-slate-900 leading-none">
              {p.priceCfa.toLocaleString('fr-FR')}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-white rounded-full px-3 py-1 text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
              Rupture
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {p.name && (
          <div className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{p.name}</div>
        )}

        {hasVariants && (
          <div className="space-y-2">
            {types.map((type) => {
              const variants = variantsByType.get(type)!;
              const selected = selectedByType.get(type);
              return (
                <div key={type}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {VARIANT_LABELS[type]}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
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
                          className={`min-w-[36px] h-7 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
                            active
                              ? 'bg-[#0066FF] text-white border-[#0066FF]'
                              : disabled
                              ? 'text-slate-300 border-slate-100 line-through cursor-not-allowed'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#0066FF]/50 hover:text-[#0066FF]'
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

        <div className="flex-1" />

        {added ? (
          <button disabled className="w-full h-10 rounded-xl bg-emerald-500 text-white font-semibold text-sm">
            ✓ Ajouté
          </button>
        ) : isOutOfStock ? (
          <button disabled className="w-full h-10 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed">
            Épuisé
          </button>
        ) : (
          <button
            onClick={handleAdd}
            className="w-full h-10 rounded-xl bg-[#0066FF] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#0052CC] active:scale-[0.98] transition-all shadow-sm shadow-blue-500/20"
          >
            <ShoppingCart className="h-4 w-4" />
            Ajouter au panier
          </button>
        )}
      </div>
    </div>
  );
}

const FILTERS = ['Tous', 'Nouveautés', 'Rupture'] as const;

export function CatalogDesktop({ seller, products, saleSlug, liveActive, activeLiveId, cartTotalQty, cartTotalCfa }: Props) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('Tous');

  const filtered = products.filter((p) => {
    if (activeFilter === 'Tous') return true;
    if (activeFilter === 'Rupture') {
      const total = p.variants.length > 0 ? p.variants.reduce((a, v) => a + v.stock, 0) : p.stock;
      return total === 0;
    }
    if (activeFilter === 'Nouveautés') {
      return Date.now() - new Date(p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="hover:opacity-75 transition-opacity shrink-0">
            <Logo size="sm" variant="light" />
          </button>

          {/* Seller info — centre */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/20 flex items-center justify-center text-[#0066FF] text-xs font-bold shrink-0">
              {seller.name[0]?.toUpperCase()}
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-900 leading-none">
                {seller.shopName ?? seller.name}
              </div>
              {seller.city && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {seller.city}
                </div>
              )}
            </div>
            {liveActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide">
                <Radio className="h-2.5 w-2.5 animate-pulse" />
                Live
              </span>
            )}
          </div>

          {/* Cart */}
          <button
            disabled={cartTotalQty === 0}
            onClick={() => navigate(`/s/${saleSlug}/checkout`, { state: { liveId: activeLiveId ?? null } })}
            className="relative flex items-center gap-2 rounded-full bg-[#0066FF] text-white pl-4 pr-5 h-10 font-semibold text-sm hover:bg-[#0052CC] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-blue-500/20 shrink-0"
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">
              Commander
              {cartTotalQty > 0 && (
                <span className="ml-2 font-normal opacity-75">· {formatCfa(cartTotalCfa)}</span>
              )}
            </span>
            {cartTotalQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {cartTotalQty}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Seller banner — compact ── */}
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex items-center gap-8">
          {/* Avatar large */}
          <div className="h-16 w-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
            <span className="font-extrabold text-slate-700 text-2xl leading-none">
              {seller.name[0]?.toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-3xl font-medium text-slate-900 tracking-tight leading-none mb-1">
              {seller.shopName ?? seller.name}
            </h1>
            <p className="text-slate-500 text-sm">
              par <span className="font-semibold text-slate-700">{seller.name}</span>
              {seller.city && <> · <MapPin className="h-3.5 w-3.5 inline mr-0.5" />{seller.city}</>}
            </p>
          </div>

          {/* Quick stats */}
          <div className="hidden lg:flex items-center divide-x divide-slate-200">
            {[
              { icon: Package, value: products.length.toString(), label: `Produit${products.length > 1 ? 's' : ''}` },
              { icon: Clock, value: '24h', label: 'Livraison' },
              { icon: CreditCard, value: '3', label: 'Paiements' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="px-6 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <Icon className="h-3.5 w-3.5 text-[#0066FF]" />
                  <span className="font-display font-semibold text-2xl text-slate-900 leading-none">{value}</span>
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-[0.12em] font-bold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout : sidebar + grid ── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 py-8 flex gap-8 items-start">

        {/* Sidebar filtres */}
        <aside className="w-52 shrink-0 sticky top-20 hidden lg:block">
          <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtrer</span>
            </div>
            <div className="p-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    activeFilter === f
                      ? 'bg-[#0066FF] text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{f}</span>
                  {activeFilter === f && (
                    <span className="text-xs bg-white/20 rounded-full px-1.5 py-0.5">
                      {filtered.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Trust signals */}
            <div className="px-4 py-4 border-t border-slate-100 space-y-2.5">
              {[
                { emoji: '🌊', text: 'Wave Money' },
                { emoji: '🟠', text: 'Orange Money' },
                { emoji: '🚚', text: 'À la livraison' },
              ].map((p) => (
                <div key={p.text} className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>{p.emoji}</span>
                  <span>{p.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Produits */}
        <div className="flex-1 min-w-0">
          {/* Barre résultats + filtres mobile */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-medium text-slate-500">
              <span className="font-bold text-slate-900">{filtered.length}</span>
              {' '}produit{filtered.length > 1 ? 's' : ''}
            </div>
            {/* Filtres mobile / small desktop */}
            <div className="flex lg:hidden items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    activeFilter === f
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-24 text-center text-slate-400">
              <Sparkles className="h-10 w-10 mx-auto mb-4 opacity-25" />
              <div className="font-display text-xl text-slate-700 mb-1">Aucun produit</div>
              <div className="text-sm">Essaie un autre filtre</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} p={p} saleSlug={saleSlug} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 mt-8 py-6">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between text-xs text-slate-400 font-medium">
          <Logo size="sm" variant="light" />
          <div className="flex items-center gap-4">
            <span>Paiement sécurisé</span>
            <span className="text-slate-200">·</span>
            <span>Livraison 24h Dakar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
