"use client";

import Image from "next/image";
import FadeInView from "@/components/FadeInView";

const REVIEWS = [
  {
    avatar: "https://i.pravatar.cc/72?img=11",
    name: "Luca B.",
    role: "Software Engineer",
    stars: 5,
    text: "Dopo 8 sessioni con l'agente tecnico ho finalmente affrontato il behavioral round senza tremare. Il feedback su ogni risposta è stato chirurgico.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=5",
    name: "Sara F.",
    role: "Product Manager",
    stars: 5,
    text: "Non credevo che parlare con un'AI potesse essere così realistico. Mi ha smontato e rimontato le risposte STAR finché non le ho padroneggiato davvero.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=12",
    name: "Marco R.",
    role: "Data Scientist",
    stars: 5,
    text: "Il case study mi terrorizzava. Interspeak mi ha fatto ripetere la struttura decine di volte, sessione dopo sessione. Ho preso l'offerta.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=9",
    name: "Chiara L.",
    role: "UX Designer",
    stars: 5,
    text: "La parte che mi ha cambiato di più? I report strutturati. Leggere esattamente dove perdi punti — e vedere quei punti salire — è motivante come poche cose.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=15",
    name: "Andrea P.",
    role: "Finance Analyst",
    stars: 5,
    text: "Con Interspeak ho simulato colloqui alle 11 di sera prima della sessione vera. Nessun coach umano avrebbe retto quei ritmi. L'AI sì.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=20",
    name: "Valentina T.",
    role: "ML Engineer",
    stars: 5,
    text: "I punteggi non mentono: sono passata da 48 a 81 in 7 sessioni. Il grafico di progressione è diventato la mia motivazione principale.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=13",
    name: "Fabio M.",
    role: "Consultant",
    stars: 5,
    text: "Rispetto ai mock interview umani, qui non c'è imbarazzo, non ci sono sguardi giudicanti. Si può sbagliare, ripetere, imparare senza pressione sociale.",
  },
  {
    avatar: "https://i.pravatar.cc/72?img=25",
    name: "Giulia N.",
    role: "Backend Developer",
    stars: 5,
    text: "L'agente conosce davvero i pattern di colloquio. Ogni sessione è sembrata un dry-run del colloquio reale.",
  },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 1L7.35 4.37H11L8.15 6.5L9.18 10L6 7.9L2.82 10L3.85 6.5L1 4.37H4.65L6 1Z"
            fill="#b8ff00"
          />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: (typeof REVIEWS)[number] }) {
  return (
    <div
      className="shrink-0 w-72 step-card flex flex-col gap-3 select-none"
      style={{ padding: "22px 22px 24px" }}
    >
      <div className="step-card-line" aria-hidden="true" />

      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* Avatar photo */}
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
          <Image
            src={review.avatar}
            alt={review.name}
            width={36}
            height={36}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name + role */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg leading-tight truncate">{review.name}</p>
          <p className="text-[11px] leading-tight truncate" style={{ color: "rgba(240,237,230,0.35)" }}>
            {review.role}
          </p>
        </div>
      </div>

      {/* Stars */}
      <StarRow count={review.stars} />

      {/* Quote */}
      <p className="text-sm leading-relaxed" style={{ color: "rgba(240,237,230,0.55)" }}>
        &ldquo;{review.text}&rdquo;
      </p>
    </div>
  );
}

export default function TestimonialsSection() {
  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section className="relative py-10 md:py-20 overflow-hidden">

      {/* Subtle ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(184,255,0,0.025) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <div className="relative max-w-5xl mx-auto px-6 mb-14">
        <FadeInView>
          <div className="flex flex-col gap-2 items-end text-right">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-[1.1]">
              Cosa dicono gli utenti.
            </h2>
            <p className="text-sm leading-relaxed max-w-sm mt-2" style={{ color: "rgba(240,237,230,0.38)" }}>
              Storie reali di chi ha usato Interspeak per prepararsi e ottenere l&apos;offerta.
            </p>
          </div>
        </FadeInView>
      </div>

      {/* ── Marquee ── */}
      <div className="max-w-5xl mx-auto px-6">
        <div
          className="overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, black 80px, black calc(100% - 80px), transparent)",
          }}
        >
          <div
            className="flex gap-4 w-max"
            style={{ animation: "marquee 40s linear infinite" }}
          >
            {doubled.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
