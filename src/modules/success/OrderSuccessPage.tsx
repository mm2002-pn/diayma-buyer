import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Check, ArrowRight, Download, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useOrderSocket } from '@/hooks/useOrderSocket';
import { useCart } from '@/stores/cart.store';
import { recallShop } from '@/lib/lastShop';
import { env } from '@/lib/env';

function useInvoiceActions(orderId: string | undefined) {
  const [sharing, setSharing] = useState(false);
  const invoiceUrl = orderId ? `${env.API_URL}/orders/${orderId}/invoice` : null;

  async function download() {
    if (!invoiceUrl) return;
    try {
      const res = await fetch(invoiceUrl);
      if (!res.ok) {
        toast.error('Facture non encore disponible — réessaie après confirmation du paiement');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Impossible de télécharger la facture');
    }
  }

  async function share() {
    if (!invoiceUrl) return;
    setSharing(true);
    try {
      const res = await fetch(invoiceUrl);
      if (!res.ok) {
        toast.error('Facture non encore disponible — réessaie après confirmation du paiement');
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], `facture-${orderId}.pdf`, { type: 'application/pdf' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Facture commande #${orderId}`,
          files: [file],
        });
      } else {
        // Fallback: ouvre le PDF dans un nouvel onglet
        window.open(invoiceUrl, '_blank');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Partage annulé');
      }
    } finally {
      setSharing(false);
    }
  }

  return { download, share, sharing };
}

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : null;
  useOrderSocket(orderId);
  const location = useLocation();
  const navigate = useNavigate();
  const clear = useCart((s) => s.clear);
  const clearFor = useCart((s) => s.clearFor);

  const state = (location.state as { saleSlug?: string; buyerFirstName?: string } | null) ?? {};
  const saleSlug = state.saleSlug ?? recallShop() ?? undefined;
  const buyerFirstName = state.buyerFirstName;

  const { download, share, sharing } = useInvoiceActions(id);

  useEffect(() => {
    if (saleSlug) clearFor(saleSlug);
    else clear();
  }, [saleSlug, clearFor, clear]);

  return (
    <div className="flex-1 flex flex-col bg-white p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="relative mb-8"
        >
          <div className="h-24 w-24 rounded-full bg-[#C9A84C] flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: 'spring', stiffness: 300 }}
            className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-gold flex items-center justify-center shadow-sm"
          >
            <span className="text-sm">🎉</span>
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-1.5 mb-8"
        >
          <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.15em]">
            Commande #{id}
          </div>
          <h1 className="font-display text-3xl font-medium text-slate-900 tracking-tight">
            {buyerFirstName ? `Merci ${buyerFirstName} !` : 'Commande confirmée !'}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
            {buyerFirstName
              ? 'On te contacte très vite pour organiser la livraison.'
              : 'Le vendeur-se te contactera pour organiser ta livraison.'}
          </p>
        </motion.div>

        {/* Invoice buttons */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-3"
        >
          <button
            onClick={download}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            Facture
          </button>
          <button
            onClick={share}
            disabled={sharing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="pt-6"
      >
        {saleSlug && (
          <button className="btn-primary" onClick={() => navigate(`/s/${saleSlug}`)}>
            <span>Continuer mes achats</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    </div>
  );
}
