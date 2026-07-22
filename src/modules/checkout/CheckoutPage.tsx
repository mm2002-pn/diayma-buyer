import { useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Loader2, Trash2, Truck } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { checkoutApi, type CreateOrderResponse } from './checkout.api';
import { extractError } from '@/lib/api';
import { formatCfa } from '@/lib/utils';
import type { PaymentMethod } from '@/types/api';

const PHONE_RE = /^[0-9]{9}$/;

export function CheckoutPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const liveId: number | null = (state as { liveId?: number | null })?.liveId ?? null;

  const allItems = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const removeItem = useCart((s) => s.remove);

  const items = useMemo(
    () => (saleSlug ? allItems.filter((i) => i.saleSlug === saleSlug) : []),
    [allItems, saleSlug],
  );
  const totalCfa = items.reduce((acc, i) => acc + i.priceCfa * i.quantity, 0);

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingMethod, setPendingMethod] = useState<PaymentMethod | null>(null);

  const mutation = useMutation({
    mutationFn: checkoutApi.createOrder,
    onSuccess: (data: CreateOrderResponse) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        clear();
        navigate(`/order/success/${data.order.id}`, {
          state: { order: data.order, saleSlug },
        });
      }
    },
    onError: (e) => { setPendingMethod(null); setError(extractError(e, 'Commande impossible')); },
  });

  function onPay(method: PaymentMethod) {
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
    <div className="flex-1 flex flex-col bg-white overflow-y-auto md:max-w-lg md:mx-auto md:w-full">
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
            Diayma<span className="text-[#0066FF]">.</span>
          </span>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Items */}
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={`${i.productId}-${i.variantId}`}
              className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3"
            >
              {i.photoUrl ? (
                <img src={i.photoUrl} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-slate-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate leading-tight">{i.productName}</div>
                {i.variantLabel && (
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">{i.variantLabel}</div>
                )}
                <div className="text-sm font-bold text-slate-900 mt-1">
                  {formatCfa(i.priceCfa)} × {i.quantity}
                </div>
              </div>
              <button
                onClick={() => removeItem(i.productId, i.variantId)}
                className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Retirer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5">
          <span className="text-slate-600 font-semibold text-sm">Total à payer</span>
          <span className="text-2xl font-extrabold text-slate-900 font-display">{formatCfa(totalCfa)}</span>
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
            Ton numéro de téléphone
          </label>
          <div className="flex items-center h-14 rounded-2xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-[#0066FF]/25 focus-within:border-[#0066FF]/40 transition-all overflow-hidden">
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

          {/* Online */}
          <button
            disabled={mutation.isPending}
            onClick={() => onPay('WAVE')}
            className={`w-full h-14 rounded-2xl text-base font-semibold flex items-center gap-3.5 px-5 bg-[#0066FF] text-white shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all ${mutation.isPending && pendingMethod !== 'WAVE' ? 'opacity-40' : ''}`}
          >
            {/* Logos Wave + Orange Money */}
            <span className="flex items-center gap-1.5 flex-shrink-0">
              {/* Wave */}
              <span className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                  <rect width="32" height="32" rx="8" fill="#1F56DE"/>
                  <path d="M7 20.5 C9.5 20.5 10.5 13 13 13 C15.5 13 15.5 20.5 18 20.5 C20.5 20.5 21.5 13 24 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </span>
              {/* Orange Money */}
              <span className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
                  <rect width="32" height="32" rx="8" fill="#FF6600"/>
                  <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif" fill="white">OM</text>
                </svg>
              </span>
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
            disabled={mutation.isPending}
            onClick={() => onPay('COD')}
            className={`w-full h-14 rounded-2xl text-base font-semibold flex items-center gap-3.5 px-5 bg-white text-slate-800 border-2 border-slate-200 shadow-soft active:scale-[0.98] transition-all ${mutation.isPending && pendingMethod !== 'COD' ? 'opacity-40' : ''}`}
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

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Security */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300 pb-2 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-[#0066FF]/40" />
          Paiement sécurisé · Données chiffrées
        </div>
      </div>
    </div>
  );
}
