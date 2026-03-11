"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    num: "01",
    title: "Scegli il formato",
    desc: "Tecnico, behavioural, case study — scegli l'area su cui vuoi allenarti e configura la sessione.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 4h12M2 8h8M2 12h5" stroke="#b8ff00" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="8" r="1.5" fill="#b8ff00" />
        <circle cx="9" cy="12" r="1.5" fill="#b8ff00" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Parla con l'AI",
    desc: "Conversa naturalmente con il voice coach. Nessuno script, domande reali adattate al tuo profilo.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="5.5" y="1.5" width="5" height="7.5" rx="2.5" stroke="#b8ff00" strokeWidth="1.5" />
        <path d="M3 8.5a5 5 0 0 0 10 0" stroke="#b8ff00" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="13.5" x2="8" y2="15" stroke="#b8ff00" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Ricevi il report",
    desc: "Feedback strutturato su chiarezza, contenuto e struttura delle risposte. Misura i progressi nel tempo.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <polyline points="2,12 6,7.5 9.5,10 14,4" stroke="#b8ff00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="4" r="1.5" fill="#b8ff00" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex justify-end mb-12">
        <div className="flex flex-col gap-3 text-right">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-fg tracking-tight leading-none">
            Come funziona
          </h2>
          <p className="text-sm text-white/40 leading-relaxed max-w-sm">
            Tre passi per trasformare ogni sessione in progresso misurabile.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STEPS.map((step, idx) => (
          <motion.div
            key={step.num}
            className="step-card group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="step-card-line" aria-hidden="true" />

            <div className="flex items-start justify-between mb-7">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(184,255,0,0.07)", border: "1px solid rgba(184,255,0,0.18)" }}
              >
                {step.icon}
              </div>
              <span className="font-display text-6xl font-extrabold leading-none step-card-num">
                {step.num}
              </span>
            </div>

            <h3 className="font-display text-base font-bold mb-3 text-fg tracking-tight">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-white/40">{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
