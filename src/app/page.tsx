import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import PricingSection from "@/components/PricingSection";
import FaqAccordion from "@/components/FaqAccordion";
import AgentsSlider from "@/components/AgentsSlider";
import EqualizerDivider from "@/components/EqualizerDivider";
import HeroSection from "@/components/HeroSection";
import FadeInView from "@/components/FadeInView";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";

// Grid cell positions (multiples of 36px) — tutti entro il container 1152px (max left 1116px)
const GRID_CELLS = [
  { top:  "108px", left:   "72px", delay: "0s"   },
  { top:   "72px", left:  "504px", delay: "2.4s" },
  { top:  "216px", left:  "864px", delay: "0.6s" },
  { top:  "288px", left:  "252px", delay: "3.1s" },
  { top:  "360px", left:  "648px", delay: "1.8s" },
  { top:  "432px", left: "1008px", delay: "0.3s" },
  { top:  "576px", left:  "144px", delay: "2.1s" },
  { top:  "612px", left:  "720px", delay: "0.7s" },
  { top:  "720px", left:  "432px", delay: "3.3s" },
  { top:  "756px", left: "1080px", delay: "1.1s" },
  { top:  "864px", left:  "288px", delay: "2.6s" },
  { top:  "900px", left:  "792px", delay: "4.2s" },
];

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="relative text-fg overflow-x-hidden">
      {/* ── Hero ── */}
      <HeroSection isLoggedIn={!!user} />

      {/* ── Come funziona + Agenti (bg grid, sezione unificata) ── */}
      <div className="bg-grid">
        {/* Sparkles */}
        <div className="grid-sparkles hidden md:block" aria-hidden="true">
          {GRID_CELLS.map((c, i) => (
            <div
              key={i}
              className="grid-cell"
              style={{ top: c.top, left: c.left, animationDelay: c.delay }}
            />
          ))}
        </div>

        <section className="relative z-[1] px-6 py-10 md:py-20 max-w-5xl mx-auto">
          <AgentsSlider />
        </section>
      </div>

      {/* ── Stats / grafici ── */}
      <StatsSection />

      {/* ── Testimonianze ── */}
      <TestimonialsSection />

      {/* ── Pricing ── */}
      <div id="pricing" className="px-4 py-10 md:py-20">
        <FadeInView>
          <div className="pricing-pill">
            <div className="max-w-5xl mx-auto">
              <PricingSection />
            </div>
          </div>
        </FadeInView>
      </div>

      {/* ── FAQ ── */}
      <section className="px-6 py-10 md:py-20 max-w-5xl mx-auto">
        <FadeInView className="flex items-end justify-between mb-10 gap-6 flex-wrap">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-[1.1] text-center w-full">
            Domande
            frequenti.
          </h2>
        </FadeInView>
        <FaqAccordion />
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5">
        {/* Wordmark */}
        <div className="px-6 pt-14 pb-0 max-w-5xl mx-auto">
          <p className="font-display text-[clamp(4rem,12vw,9rem)] font-extrabold leading-none tracking-tight select-none text-white/[0.07]">
            Inter<span style={{ color: "rgba(184,255,0,0.12)" }}>voice</span>
          </p>
        </div>

        {/* Link columns */}
        <div className="px-6 pt-10 pb-0 max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Prodotto</span>
              <Link href="/interview/new" className="text-sm text-white/45 hover:text-white/80 transition-colors">Nuova interview</Link>
              <Link href="/dashboard" className="text-sm text-white/45 hover:text-white/80 transition-colors">Dashboard</Link>
              <Link href="/#pricing" className="text-sm text-white/45 hover:text-white/80 transition-colors">Prezzi</Link>
              <Link href="/interview/demo" className="text-sm text-white/45 hover:text-white/80 transition-colors">Demo gratuita</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Risorse</span>
              <Link href="/interview/guide" className="text-sm text-white/45 hover:text-white/80 transition-colors">Guida all&apos;interview</Link>
              <Link href="/#agenti" className="text-sm text-white/45 hover:text-white/80 transition-colors">I nostri agenti</Link>
              <Link href="/#community" className="text-sm text-white/45 hover:text-white/80 transition-colors">Community</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Legale</span>
              <Link href="/terms" className="text-sm text-white/45 hover:text-white/80 transition-colors">Termini di servizio</Link>
              <Link href="/refund" className="text-sm text-white/45 hover:text-white/80 transition-colors">Politica rimborsi</Link>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/25">Account</span>
              <Link href="/sign-in" className="text-sm text-white/45 hover:text-white/80 transition-colors">Accedi</Link>
              <Link href="/sign-up" className="text-sm text-white/45 hover:text-white/80 transition-colors">Registrati</Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <EqualizerDivider />

        {/* Bottom bar */}
        <div className="px-6 py-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display text-xs font-bold text-white/20 tracking-tight">Intervoice</span>
          <span className="text-xs text-white/15">© {new Date().getFullYear()} Intervoice. Tutti i diritti riservati.</span>
        </div>
      </footer>

    </main>
  );
}
