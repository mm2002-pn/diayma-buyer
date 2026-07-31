import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Loader2, Trash2, Truck, Minus, Plus } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { checkoutApi, type CreateOrderResponse } from './checkout.api';
import { shopApi } from '@/modules/shop/shop.api';
import { extractError } from '@/lib/api';
import { formatCfa } from '@/lib/utils';
import { rememberShop } from '@/lib/lastShop';
import type { PaymentMethod } from '@/types/api';

const PHONE_RE = /^[0-9]{9}$/;

export function CheckoutPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const liveId: number | null = (state as { liveId?: number | null })?.liveId ?? null;

  const allItems = useCart((s) => s.items);
  const clearFor = useCart((s) => s.clearFor);
  const removeItem = useCart((s) => s.remove);
  const updateQty = useCart((s) => s.updateQty);

  // Mémorisée dès l'arrivée en caisse : le retour de Pay2Up recharge la page
  // et perd l'état de navigation qui portait la boutique.
  useEffect(() => {
    if (saleSlug) rememberShop(saleSlug);
  }, [saleSlug]);

  const items = useMemo(
    () => (saleSlug ? allItems.filter((i) => i.saleSlug === saleSlug) : []),
    [allItems, saleSlug],
  );
  const totalCfa = items.reduce((acc, i) => acc + i.priceCfa * i.quantity, 0);

  // Stock courant — re-fetch à l'ouverture du checkout pour revalidation
  const { data: shopData } = useQuery({
    queryKey: ['shop', saleSlug],
    queryFn: () => shopApi.bySaleSlug(saleSlug!),
    enabled: !!saleSlug,
    staleTime: 0, // toujours frais au checkout
  });

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of shopData?.products ?? []) {
      if (p.variants.length > 0) {
        for (const v of p.variants) map.set(`${p.id}-${v.id}`, v.stock);
      } else {
        map.set(`${p.id}-null`, p.stock);
      }
    }
    return map;
  }, [shopData]);

  const getStock = (productId: number, variantId: number | null): number =>
    stockMap.get(`${productId}-${variantId ?? 'null'}`) ?? Infinity;

  // True si au moins un article dépasse le stock disponible (données chargées)
  const hasStockIssue = shopData != null &&
    items.some((i) => i.quantity > getStock(i.productId, i.variantId));

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error') === 'payment_failed') {
      setError('Le paiement a échoué ou a été annulé. Veuillez réessayer.');
    }
  }, [searchParams]);
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

  const mutation = useMutation({
    mutationFn: checkoutApi.createOrder,
    onSuccess: (data: CreateOrderResponse) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        // Seule cette boutique est vidée : le panier est partagé, l'acheteuse
        // peut avoir mis des articles de côté chez une autre vendeuse.
        if (saleSlug) clearFor(saleSlug);
        navigate(`/order/success/${data.order.id}`, {
          state: { order: data.order, saleSlug },
        });
      }
    },
    onError: (e) => { setPendingMethod(null); setError(extractError(e, 'Commande impossible')); },
  });

  function onPay(method: PaymentMethod) {
    if (hasStockIssue) return;
    if (!PHONE_RE.test(phone)) {
      setPhoneError('Numéro invalide · ex : 77 123 45 67');
      return;
    }
    setPhoneError('');
    setError(null);
    setPendingMethod(method);
    mutation.mutate({
      liveId,
      buyerPhone: `+221${phone}`,
      paymentMethod: method,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
    });
  }

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white gap-4">
        <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl">
          🛍️
        </div>
        <div>
          <div className="text-slate-800 text-base font-semibold mb-1">Aucun article</div>
          <div className="text-slate-400 text-sm">Ton panier est vide.</div>
        </div>
        <button className="btn-primary max-w-xs mt-2" onClick={() => navigate(`/s/${saleSlug}`)}>
          Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto w-full">
      {/* Header */}
      <div className="flex items-center bg-white/95 border-b border-slate-100 px-4 pt-3 pb-3 flex-shrink-0 sticky top-0 z-10 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-400 hover:text-slate-700 transition-colors rounded-xl hover:bg-slate-50"
          disabled={mutation.isPending}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex justify-center">
          <span className="font-extrabold text-base text-slate-900 tracking-tight">
            Diayema<span className="text-[#C9A84C]">.</span>
          </span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 py-6 md:py-8 space-y-5 w-full max-w-6xl mx-auto md:px-6 lg:px-8">
        {/* Items */}
        <div className="space-y-2">
          {items.map((i) => {
            const stock = getStock(i.productId, i.variantId);
            const isOverStock = stock !== Infinity && i.quantity > stock;
            const isOutOfStock = stock === 0;
            return (
              <div
                key={`${i.productId}-${i.variantId}`}
                className={`flex items-center gap-3 rounded-2xl p-3 border ${isOverStock ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}
              >
                {i.photoUrl ? (
                  <img src={i.photoUrl} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0" />
                )}

                {/* Name + variant + unit price */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate leading-tight">{i.productName}</div>
                  {i.variantLabel && (
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">{i.variantLabel}</div>
                  )}
                  <div className="text-xs text-slate-400 mt-1">{formatCfa(i.priceCfa)} / unité</div>
                  {isOutOfStock && (
                    <div className="text-xs text-red-500 font-semibold mt-0.5">
                      Plus disponible — appuie sur − pour retirer
                    </div>
                  )}
                  {isOverStock && !isOutOfStock && (
                    <div className="text-xs text-red-500 font-semibold mt-0.5">
                      Seulement {stock} en stock — réduis la quantité
                    </div>
                  )}
                </div>

                {/* Subtotal + stepper */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-sm font-extrabold text-slate-900 tabular-nums">
                    {formatCfa(i.priceCfa * i.quantity)}
                  </div>
                  <div className="flex items-center gap-1 h-7 rounded-full bg-slate-100 border border-slate-200 px-1.5">
                    {/* Minus — devient poubelle à qty=1 */}
                    <button
                      onClick={() =>
                        i.quantity <= 1
                          ? removeItem(i.productId, i.variantId)
                          : updateQty(i.productId, i.variantId, i.quantity - 1)
                      }
                      disabled={mutation.isPending}
                      className="h-5 w-5 rounded-full bg-white flex items-center justify-center transition-all active:scale-90 hover:bg-slate-200 disabled:opacity-40"
                      aria-label="Réduire la quantité"
                    >
                      {i.quantity <= 1
                        ? <Trash2 className="h-3 w-3 text-red-400" />
                        : <Minus className="h-2.5 w-2.5 text-slate-500" />
                      }
                    </button>

                    <input
                      type="number"
                      value={i.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateQty(i.productId, i.variantId, Math.max(1, Math.min(stock, val)));
                      }}
                      min="1"
                      max={stock}
                      disabled={mutation.isPending}
                      className="w-8 h-full bg-transparent text-center text-xs font-bold text-slate-900 outline-none tabular-nums disabled:opacity-40"
                    />

                    {/* Plus — désactivé si stock atteint */}
                    <button
                      onClick={() => updateQty(i.productId, i.variantId, i.quantity + 1)}
                      disabled={i.quantity >= stock || mutation.isPending}
                      className="h-5 w-5 rounded-full bg-white flex items-center justify-center transition-all active:scale-90 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="h-3 w-3 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
          <span className="text-slate-600 font-semibold text-sm">Total à payer</span>
          <span className="text-2xl font-extrabold text-slate-900">{formatCfa(totalCfa)}</span>
        </div>

        {/* Bannière stock insuffisant */}
        {hasStockIssue && (() => {
          const outItems = items.filter((i) => getStock(i.productId, i.variantId) === 0);
          const overItems = items.filter((i) => {
            const s = getStock(i.productId, i.variantId);
            return s !== Infinity && s > 0 && i.quantity > s;
          });
          const total = outItems.length + overItems.length;
          const parts: string[] = [];
          if (outItems.length > 0)
            parts.push(`${outItems.length} en rupture à retirer`);
          if (overItems.length > 0)
            parts.push(`${overItems.length} à réduire`);
          return (
            <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 font-medium flex gap-2 items-start">
              <span className="mt-0.5 flex-shrink-0">⚠</span>
              <span>
                {total} article{total > 1 ? 's' : ''} en rouge ({parts.join(', ')}) — corrige-les pour continuer.
              </span>
            </div>
          );
        })()}

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
            Ton numéro de téléphone
          </label>
          <div className="flex items-center h-14 rounded-2xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-[#C9A84C]/25 focus-within:border-[#C9A84C]/40 transition-all overflow-hidden">
            <span className="flex-shrink-0 px-4 text-slate-400 text-base font-semibold border-r border-slate-200 h-full flex items-center select-none">
              +221
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="77 000 00 00"
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
              maxLength={9}
              className="flex-1 h-full bg-transparent px-4 text-slate-900 text-base placeholder:text-slate-300 outline-none"
            />
          </div>
          {phoneError && (
            <p className="text-xs text-red-500 mt-2 ml-1 font-medium">{phoneError}</p>
          )}
        </div>

        {/* Payment */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Choisir le paiement
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Online */}
            <button
              disabled={mutation.isPending || hasStockIssue}
              onClick={() => onPay('WAVE')}
              className={`h-14 rounded-2xl text-base font-semibold flex items-center gap-3.5 px-5 bg-[#C9A84C] text-white shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all ${mutation.isPending && pendingMethod !== 'WAVE' ? 'opacity-40' : ''}`}
            >
              {/* Logos Wave + Orange Money */}
              <span className="flex items-center gap-1.5 flex-shrink-0">
                {/* Wave */}
                <img src="/logo-wave.webp" alt="Wave" className="h-8 w-8 rounded-lg shadow-sm" />
                {/* Orange Money */}
                <img src="/logo-orange-money.png" alt="Orange Money" className="h-8 w-8 rounded-lg shadow-sm" />
              </span>
              <div className="text-left">
                <div className="text-sm font-bold">Payer en ligne</div>
                <div className="text-xs text-white/60 font-normal">Wave · Orange Money</div>
              </div>
              {pendingMethod === 'WAVE' && (
                <Loader2 className="ml-auto h-5 w-5 animate-spin opacity-70" />
              )}
            </button>

            {/* COD */}
            <button
              disabled={mutation.isPending || hasStockIssue}
              onClick={() => onPay('COD')}
              className={`h-14 rounded-2xl text-base font-semibold flex items-center gap-3.5 px-5 bg-white text-slate-800 border-2 border-slate-200 shadow-soft active:scale-[0.98] transition-all ${mutation.isPending && pendingMethod !== 'COD' ? 'opacity-40' : ''}`}
            >
              <span className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Truck className="h-5 w-5 text-slate-500" />
              </span>
              <div className="text-left">
                <div className="text-sm font-bold">À la livraison</div>
                <div className="text-xs text-slate-400 font-normal">Paye à réception</div>
              </div>
              {pendingMethod === 'COD' && (
                <Loader2 className="ml-auto h-5 w-5 animate-spin opacity-50 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Security */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pb-2 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-[#C9A84C]/40" />
          Paiement sécurisé · Données chiffrées
        </div>
      </div>
    </div>
  );
}
