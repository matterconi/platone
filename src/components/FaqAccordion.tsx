"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const FAQS = [
  {
    q: "È adatto anche a chi non è nel settore tech?",
    a: "Sì. Puoi configurare il tipo di interview (behavioural, case study, competenze trasversali) indipendentemente dal settore. L'AI adatta le domande al ruolo e all'azienda che scegli.",
  },
  {
    q: "Come funziona il feedback?",
    a: "Al termine di ogni sessione ricevi un report strutturato: valutazione delle risposte, punti di forza, aree di miglioramento e suggerimenti concreti. Tutto in italiano.",
  },
  {
    q: "Quanto dura una sessione?",
    a: "Dipende da te. Le sessioni tipiche durano tra 10 e 30 minuti. Puoi interrompere in qualsiasi momento e il consumo di crediti si ferma.",
  },
  {
    q: "Posso disdire il piano quando voglio?",
    a: "Sì, senza vincoli. Puoi disdire direttamente dalla dashboard in qualsiasi momento. Il piano rimane attivo fino alla fine del periodo già pagato.",
  },
  {
    q: "Che differenza c'è tra i piani?",
    a: "La differenza principale è il numero di crediti mensili (= minuti di sessione). Tutti i piani includono feedback AI, storico delle sessioni e tutte le tipologie di interview.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
    <div className="flex flex-col divide-y divide-white/[0.07]">
      {FAQS.map((faq, i) => (
        <div key={i}>
          <button
            className="w-full flex items-center justify-between gap-6 py-5 text-left group cursor-pointer"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
              {faq.q}
            </span>

            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="shrink-0 size-5 rounded-full border border-white/15 flex items-center justify-center"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M5 2v6M2 5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: "hidden" }}
              >
                <p className="text-sm text-white/40 leading-relaxed pb-5 max-w-xl">
                  {faq.a}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>

    <div className="mt-8 pt-6 border-t border-white/[0.07] flex max-md:flex-col max-md:space-y-4 items-center justify-center gap-4">
      <p className="text-sm text-white/70">Non trovi la risposta?</p>
      <Link href="/contacts" className="cta-primary">
        Scrivici pure
        <ArrowRight />
      </Link>
    </div>
    </>
  );
}
