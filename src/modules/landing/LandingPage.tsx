import { MessageCircle, ShoppingBag, Truck, ArrowRight, Shield } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Boutique locale · Dakar
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-50/70 via-white/50 to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-80 bg-gradient-to-tr from-amber-100/15 via-yellow-100/20 to-amber-50/10 blur-3xl pointer-events-none rounded-full" />

          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32 md:pt-32 md:pb-40">
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
                <span className="text-[#C9A84C]">à portée de main.</span>
              </h1>

              <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
                Achète chez tes vendeuses préférées pendant leurs lives.
                Paye avec Wave, Orange Money ou à la livraison — aucun compte requis.
              </p>

              <div className="flex items-center gap-2 text-sm font-bold text-[#C9A84C] mb-10">
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
        <section className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-8 py-20 md:py-28">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-10 text-center sm:text-left">
              Commander en 3 étapes
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  num: '1', icon: MessageCircle, color: 'bg-amber-50 text-[#C9A84C]',
                  title: 'Reçois le lien',
                  desc: 'Ta vendeuse partage son lien diayema sur WhatsApp ou en live.',
                },
                {
                  num: '2', icon: ShoppingBag, color: 'bg-amber-50 text-amber-600',
                  title: 'Choisis & paie',
                  desc: 'Parcours la boutique, sélectionne et paie avec Wave, Orange Money ou à la livraison.',
                },
                {
                  num: '3', icon: Truck, color: 'bg-amber-50 text-emerald-600',
                  title: 'Reçois en 24h',
                  desc: 'La vendeuse organise la livraison chez toi partout à Dakar.',
                },
              ].map((s) => (
                <div key={s.num} className="relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-100 flex flex-col justify-between hover:shadow-xl hover:border-[#C9A84C]/40 transition-all duration-300 group">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-5xl font-extrabold text-[#C9A84C] group-hover:scale-110 transition-transform">
                        {s.num}
                      </span>
                      <div className={`h-10 w-10 rounded-xl ${s.color} flex items-center justify-center font-bold`}>
                        <s.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-snug">
                      {s.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <span className="text-xs text-slate-400 font-medium text-center">
            Pas de lien ?{' '}
            <span className="text-[#C9A84C] font-semibold">Demande à ta vendeuse sur WhatsApp.</span>
          </span>
        </div>
      </footer>

    </div>
  );
}
