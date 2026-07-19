import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, User, Loader2, Trash2 } from 'lucide-react';

import { useCart } from '@/stores/cart.store';
import { checkoutApi } from './checkout.api';
import { extractError } from '@/lib/api';
import { formatCfa } from '@/lib/utils';
import type { PaymentMethod } from '@/types/api';

const stepSchemas = {
  1: z.object({
    firstName: z.string().trim().min(2, 'Prénom requis'),
    lastName: z.string().trim().min(2, 'Nom requis'),
    phone: z
      .string()
      .trim()
      .regex(/^(\+221)?[0-9]{9}$/, 'Ex : +221771234567'),
    address: z.string().trim().min(3, 'Adresse requise').max(300),
  }),
};

type CoordsForm = z.infer<typeof stepSchemas[1]>;

const PAYMENTS: { id: PaymentMethod; label: string; bg: string; icon: string }[] = [
  { id: 'ORANGE_MONEY', label: 'Orange Money', bg: 'bg-orange_money', icon: 'OM' },
  { id: 'WAVE', label: 'Wave', bg: 'bg-wave', icon: '⌬' },
  { id: 'COD', label: 'À la livraison', bg: 'bg-white text-forest border-2 border-forest/20', icon: '🚚' },
];

export function CheckoutPage() {
  const { saleSlug } = useParams<{ saleSlug: string }>();
  const navigate = useNavigate();
  // Sélecteurs stables — s.items est la référence brute du store ; on filtre via useMemo
  // pour éviter que le selector renvoie un nouveau tableau à chaque render (boucle infinie Zustand).
  const allItems = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const removeItem = useCart((s) => s.remove);
  const items = useMemo(
    () => (saleSlug ? allItems.filter((i) => i.saleSlug === saleSlug) : []),
    [allItems, saleSlug]
  );
  const totalCfa = items.reduce((acc, i) => acc + i.priceCfa * i.quantity, 0);

  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=Panier, 1=Coord, 2=Paiement
  const [coords, setCoords] = useState<CoordsForm | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CoordsForm>({
    resolver: zodResolver(stepSchemas[1]),
    defaultValues: { firstName: '', lastName: '', phone: '', address: '' },
  });

  const mutation = useMutation({
    mutationFn: checkoutApi.createOrder,
    onSuccess: (data) => {
      clear();
      navigate(`/order/success/${data.order.id}`, {
        state: { order: data.order, saleSlug, buyerFirstName: coords?.firstName },
      });
    },
    onError: (e) => setError(extractError(e, 'Commande impossible')),
  });

  if (items.length === 0 && step === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🛍️</div>
        <div className="text-forest text-lg font-semibold mb-2">Ton panier est vide</div>
        <div className="text-forest/60 text-sm mb-8">Ajoute des produits pour commander.</div>
        <button className="btn-primary max-w-xs" onClick={() => navigate(`/s/${saleSlug}`)}>
          Retour au catalogue
        </button>
      </div>
    );
  }

  function onPay(method: PaymentMethod) {
    if (!coords || !saleSlug) return;
    setError(null);
    mutation.mutate({
      buyerName: `${coords.firstName} ${coords.lastName}`.trim(),
      buyerPhone: coords.phone,
      buyerAddress: coords.address,
      paymentMethod: method,
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto md:max-w-2xl md:mx-auto md:w-full md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 md:px-0">
        <button
          onClick={() => (step === 0 ? navigate(-1) : setStep((step - 1) as 0 | 1 | 2))}
          className="p-2 -ml-2 text-forest"
          disabled={mutation.isPending}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-lg font-semibold text-forest">
          {step === 0 ? 'Mon panier' : step === 1 ? 'Coordonnées' : 'Paiement'}
        </div>
        <div className="w-9" />
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 mb-2 md:px-0">
        {[0, 1, 2].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-forest' : 'bg-forest/15'}`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col px-4 py-4 md:px-0">
        <AnimatePresence mode="wait">
          {/* Étape 0 : Panier */}
          {step === 0 && (
            <motion.div
              key="cart"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex-1 space-y-3">
                {items.map((i) => (
                  <div
                    key={`${i.productId}-${i.variantId}`}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft"
                  >
                    {i.photoUrl ? (
                      <img src={i.photoUrl} className="h-16 w-16 rounded-xl object-cover" alt="" />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-cream-100" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-forest truncate">{i.productName}</div>
                      {i.variantLabel && (
                        <div className="text-xs text-forest/60">Taille/couleur : {i.variantLabel}</div>
                      )}
                      <div className="text-sm font-medium text-forest mt-0.5">
                        {formatCfa(i.priceCfa)} × {i.quantity}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(i.productId, i.variantId)}
                      className="p-2 text-forest/60"
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-forest/70">Total</span>
                  <span className="text-2xl font-bold text-forest">{formatCfa(totalCfa)}</span>
                </div>
              </div>
              <button className="btn-primary mt-4" onClick={() => setStep(1)}>
                Continuer <ArrowRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* Étape 1 : Coordonnées */}
          {step === 1 && (
            <motion.form
              key="coords"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              onSubmit={form.handleSubmit((v) => {
                setCoords(v);
                setStep(2);
              })}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-2 mb-4 text-forest">
                <User className="h-5 w-5" />
                <span className="font-medium">Qui commande ?</span>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    placeholder="Prénom"
                    autoComplete="given-name"
                    {...form.register('firstName')}
                    className="w-full h-14 rounded-xl bg-white px-4 text-forest placeholder:text-forest/40 shadow-soft outline-none focus:ring-2 focus:ring-forest/40"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-red-600 mt-1 ml-1">{form.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <input
                    placeholder="Nom"
                    autoComplete="family-name"
                    {...form.register('lastName')}
                    className="w-full h-14 rounded-xl bg-white px-4 text-forest placeholder:text-forest/40 shadow-soft outline-none focus:ring-2 focus:ring-forest/40"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-red-600 mt-1 ml-1">{form.formState.errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <input
                    placeholder="Téléphone (+221771234567)"
                    inputMode="tel"
                    autoComplete="tel"
                    {...form.register('phone')}
                    className="w-full h-14 rounded-xl bg-white px-4 text-forest placeholder:text-forest/40 shadow-soft outline-none focus:ring-2 focus:ring-forest/40"
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-600 mt-1 ml-1">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <input
                    placeholder="Adresse de livraison"
                    autoComplete="street-address"
                    {...form.register('address')}
                    className="w-full h-14 rounded-xl bg-white px-4 text-forest placeholder:text-forest/40 shadow-soft outline-none focus:ring-2 focus:ring-forest/40"
                  />
                  {form.formState.errors.address && (
                    <p className="text-xs text-red-600 mt-1 ml-1">{form.formState.errors.address.message}</p>
                  )}
                </div>
              </div>

              <div className="flex-1" />
              <button type="submit" className="btn-primary mt-6">
                Continuer <ArrowRight className="h-5 w-5" />
              </button>
            </motion.form>
          )}

          {/* Étape 2 : Paiement */}
          {step === 2 && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="flex-1 flex flex-col"
            >
              {/* Récap */}
              <div className="rounded-2xl bg-white p-3 shadow-soft mb-4 flex items-center gap-3">
                {items[0]?.photoUrl ? (
                  <img src={items[0].photoUrl} className="h-12 w-12 rounded-lg object-cover" alt="" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-cream-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-forest/60">
                    {items.reduce((a, i) => a + i.quantity, 0)} article{items.reduce((a, i) => a + i.quantity, 0) > 1 ? 's' : ''}
                  </div>
                  <div className="text-lg font-bold text-forest">{formatCfa(totalCfa)}</div>
                </div>
              </div>

              <div className="space-y-3">
                {PAYMENTS.map((p) => (
                  <button
                    key={p.id}
                    disabled={mutation.isPending}
                    onClick={() => onPay(p.id)}
                    className={`w-full h-14 rounded-2xl text-white text-lg font-semibold flex items-center gap-3 px-5 shadow-soft active:scale-[0.98] transition ${p.bg}`}
                  >
                    <span className="h-9 w-9 rounded-full bg-white/25 flex items-center justify-center text-lg">{p.icon}</span>
                    {p.label}
                    {mutation.isPending && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
                  </button>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex-1" />
              <div className="flex items-center justify-center gap-2 text-xs text-forest/50 pb-4">
                <ShieldCheck className="h-4 w-4" />
                Paiement sécurisé
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
