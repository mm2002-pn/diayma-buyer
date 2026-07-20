import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, ShieldCheck, Loader2, Trash2 } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { checkoutApi } from './checkout.api';
import { extractError } from '@/lib/api';
import { formatCfa } from '@/lib/utils';
import type { PaymentMethod } from '@/types/api';

const PAYMENTS: { id: PaymentMethod; label: string; className: string; icon: string }[] = [
  { id: 'ORANGE_MONEY', label: 'Orange Money', className: 'bg-orange_money text-white', icon: 'OM' },
  { id: 'WAVE', label: 'Wave', className: 'bg-wave text-white', icon: '⌬' },
  { id: 'COD', label: 'À la livraison', className: 'bg-white text-ink border-2 border-ink/15', icon: '🚚' },
];

const PHONE_RE = /^(\+221)?[0-9]{9}$/;

export function CheckoutPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();

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

  const mutation = useMutation({
    mutationFn: checkoutApi.createOrder,
    onSuccess: (data) => {
      clear();
      navigate(`/order/success/${data.order.id}`, {
        state: { order: data.order, saleSlug },
      });
    },
    onError: (e) => setError(extractError(e, 'Commande impossible')),
  });

  function onPay(method: PaymentMethod) {
    if (!PHONE_RE.test(phone)) {
      setPhoneError('Numéro invalide · ex : +221771234567');
      return;
    }
    setPhoneError('');
    setError(null);
    mutation.mutate({
      buyerPhone: phone,
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
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="text-5xl mb-4">🛍️</div>
        <div className="text-ink text-lg font-semibold mb-2">Aucun article</div>
        <button className="btn-primary max-w-xs mt-4" onClick={() => navigate(`/s/${saleSlug}`)}>
          Retour au catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto md:max-w-lg md:mx-auto md:w-full">
      {/* Header dark */}
      <div className="flex items-center bg-forest px-4 pt-3 pb-3 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white"
          disabled={mutation.isPending}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center text-lg font-semibold text-white">Commander</div>
        <div className="w-9" />
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">
        {/* Articles */}
        <div className="space-y-2">
          {items.map((i) => (
            <div
              key={`${i.productId}-${i.variantId}`}
              className="flex items-center gap-3 bg-cream-50 rounded-2xl p-3"
            >
              {i.photoUrl ? (
                <img src={i.photoUrl} className="h-14 w-14 rounded-xl object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="h-14 w-14 rounded-xl bg-cream-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-ink text-sm truncate">{i.productName}</div>
                {i.variantLabel && (
                  <div className="text-xs text-ink/50">{i.variantLabel}</div>
                )}
                <div className="text-sm font-semibold text-ink mt-0.5">
                  {formatCfa(i.priceCfa)} × {i.quantity}
                </div>
              </div>
              <button
                onClick={() => removeItem(i.productId, i.variantId)}
                className="p-1.5 text-ink/30"
                aria-label="Retirer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-1">
          <span className="text-ink/60 font-medium">Total</span>
          <span className="text-2xl font-bold text-ink">{formatCfa(totalCfa)}</span>
        </div>

        {/* Téléphone */}
        <div>
          <label className="text-sm font-semibold text-ink/70 block mb-2">
            Ton numéro de téléphone
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+221 77 000 00 00"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
            className="w-full h-14 rounded-2xl bg-cream-100 px-4 text-ink text-base placeholder:text-ink/35 outline-none focus:ring-2 focus:ring-forest/30"
          />
          {phoneError && (
            <p className="text-xs text-red-600 mt-1.5 ml-1">{phoneError}</p>
          )}
        </div>

        {/* Moyens de paiement */}
        <div className="space-y-3">
          {PAYMENTS.map((p) => (
            <button
              key={p.id}
              disabled={mutation.isPending}
              onClick={() => onPay(p.id)}
              className={`w-full h-14 rounded-2xl text-base font-semibold flex items-center gap-3 px-5 shadow-soft active:scale-[0.98] transition ${p.className}`}
            >
              <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-base font-bold flex-shrink-0">
                {p.icon}
              </span>
              <span>{p.label}</span>
              {mutation.isPending && (
                <Loader2 className="ml-auto h-5 w-5 animate-spin opacity-70" />
              )}
            </button>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Sécurité */}
        <div className="flex items-center justify-center gap-2 text-xs text-ink/35 pb-2">
          <ShieldCheck className="h-4 w-4" />
          Paiement sécurisé
        </div>
      </div>
    </div>
  );
}
