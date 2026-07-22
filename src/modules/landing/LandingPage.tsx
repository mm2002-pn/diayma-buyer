import { MessageCircle, ShoppingBag, Truck, ArrowRight, Shield } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Logo size="md" variant="light" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Boutique locale · Dakar
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50/30 to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-tr from-blue-200/20 via-indigo-100/25 to-blue-50/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-14 pb-16 sm:pt-20 sm:pb-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-blue-200 shadow-sm px-3.5 py-1.5 text-xs font-semibold text-slate-700 mb-7">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                Social commerce · Sénégal 🇸🇳
              </div>

              <h1
                className="font-extrabold text-slate-900 tracking-tight leading-[1.12] mb-5"
                style={{ fontSize: 'clamp(2.2rem, 5.5vw, 4rem)' }}
              >
                Le marché sénégalais,{' '}
                <span className="text-[#0066FF]">à portée de main.</span>
              </h1>

              <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                Achète chez tes vendeuses préférées pendant leurs lives.
                Paye avec Wave, Orange Money ou à la livraison — aucun compte requis.
              </p>

              <div className="flex items-center gap-2 text-sm font-bold text-[#0066FF] mb-10">
                <ArrowRight className="h-4 w-4 shrink-0" />
                Reçois le lien de ta vendeuse pour commencer
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-8 border-t border-slate-100">
                {[
                  { emoji: '🌊', label: 'Wave Money' },
                  { emoji: '🟠', label: 'Orange Money' },
                  { icon: Truck,  label: 'Livraison 24h' },
                  { icon: Shield, label: 'Aucun compte' },
                ].map(({ emoji, icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                    {emoji ? <span>{emoji}</span> : Icon && <Icon className="h-3.5 w-3.5" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 étapes ── */}
        <section className="bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-16">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8 text-center sm:text-left">
              Commander en 3 étapes
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  num: '01', icon: MessageCircle, color: 'bg-blue-50 text-[#0066FF]',
                  title: 'Reçois le lien',
                  desc: 'Ta vendeuse partage son lien Diayma sur WhatsApp ou en live.',
                },
                {
                  num: '02', icon: ShoppingBag, color: 'bg-amber-50 text-amber-600',
                  title: 'Choisis & paie',
                  desc: 'Parcours la boutique, sélectionne et paie avec Wave, Orange Money ou à la livraison.',
                },
                {
                  num: '03', icon: Truck, color: 'bg-emerald-50 text-emerald-600',
                  title: 'Reçois en 24h',
                  desc: 'La vendeuse organise la livraison chez toi partout à Dakar.',
                },
              ].map((s) => (
                <div key={s.num} className="bg-white rounded-2xl border border-slate-100 p-6 relative overflow-hidden">
                  <div className="absolute top-4 right-5 font-display text-6xl font-bold text-slate-900/[0.04] leading-none select-none">
                    {s.num}
                  </div>
                  <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center mb-4`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-xl font-medium text-slate-900 mb-1.5 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" variant="light" />
          <span className="text-xs text-slate-400 font-medium text-center">
            Pas de lien ?{' '}
            <span className="text-[#0066FF] font-semibold">Demande à ta vendeuse sur WhatsApp.</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
