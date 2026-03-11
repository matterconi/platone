import Link from "next/link";
import Navbar from "@/components/Navbar";

const PARAMS = [
  {
    label: "Ruolo",
    description: "Il ruolo professionale per cui vuoi allenarti.",
    examples: [
      { text: "Frontend Developer", domain: "Tech" },
      { text: "Cardiologo", domain: "Medicina" },
      { text: "M&A Lawyer", domain: "Legale" },
      { text: "Financial Analyst", domain: "Finanza" },
      { text: "Marketing Manager", domain: "Marketing" },
    ],
  },
  {
    label: "Livello",
    description: "La seniority richiesta. Influenza la difficoltà e il tipo di domande.",
    examples: [
      { text: "junior" },
      { text: "mid" },
      { text: "senior" },
      { text: "lead" },
      { text: "specializzando" },
    ],
  },
  {
    label: "Tipo di colloquio",
    description: "Il formato delle domande. Può essere combinato (misto) per un allenamento completo.",
    examples: [
      { text: "tecnico", note: "algoritmi, coding, system design" },
      { text: "comportamentale", note: "situazioni, soft skills, cultura" },
      { text: "misto", note: "combinazione dei due" },
      { text: "case study", note: "analisi e problem solving strutturato" },
    ],
  },
  {
    label: "Durata",
    description: "Quante domande vuoi. Se non specificato, il sistema usa 5 domande (regolare).",
    examples: [
      { text: "rapida", note: "3 domande" },
      { text: "regolare", note: "5 domande — default" },
      { text: "lunga", note: "7 domande" },
    ],
  },
  {
    label: "Focus / Stack",
    description: "Tecnologie, specializzazioni o aree tematiche su cui concentrare le domande.",
    examples: [
      { text: "React, TypeScript", domain: "Tech" },
      { text: "chirurgia cardiaca", domain: "Medicina" },
      { text: "derivati OTC", domain: "Finanza" },
      { text: "SEO, paid media", domain: "Marketing" },
      { text: "diritto societario", domain: "Legale" },
    ],
  },
  {
    label: "Obiettivo",
    description: "Il contesto del colloquio. Aiuta l'AI a calibrare il tono e il livello di dettaglio.",
    examples: [
      { text: "prep colloquio" },
      { text: "certificazione professionale" },
      { text: "esame accademico" },
      { text: "promozione interna" },
    ],
  },
];

const EXAMPLES = [
  {
    label: "Sviluppatore — completo",
    prompt:
      "Senior frontend developer — intervista tecnica su React, TypeScript e system design. Focus su performance e architettura. Sessione lunga, obiettivo prep colloquio.",
  },
  {
    label: "Medicina",
    prompt:
      "Cardiologo specializzando. Colloquio comportamentale con focus su gestione delle urgenze e comunicazione con il paziente. Durata regolare.",
  },
  {
    label: "Finanza",
    prompt:
      "Analista M&A junior, intervista misto tecnico-comportamentale. Focus su valutazione d'azienda e LBO. Case study. Obiettivo: colloquio in banca d'investimento.",
  },
  {
    label: "Solo il ruolo",
    prompt: "Backend developer",
  },
];

export default function InterviewGuidePage() {
  return (
    <>
    <Navbar />
    <div className="flex flex-col gap-12 px-6 py-14 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/interview/new"
          className="self-start text-slate-500 text-xs hover:text-slate-300 transition-colors"
        >
          ← Nuova intervista
        </Link>
        <h1 className="text-slate-50 text-4xl font-bold leading-tight tracking-tight">
          Come scrivere il<br /> prompt perfetto
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-lg">
          Scrivi liberamente — il sistema estrae automaticamente i parametri dal testo.
          Più dettagli fornisci, più l&apos;intervista sarà calibrata sul tuo profilo.
        </p>
      </div>

      {/* Parameters */}
      <div className="flex flex-col gap-8">
        <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest">
          Parametri riconosciuti
        </p>
        <div className="flex flex-col gap-6">
          {PARAMS.map(({ label, description, examples }) => (
            <div
              key={label}
              className="flex flex-col gap-3 p-5 rounded-2xl border border-[#1A1B28] bg-[#0A0B10]"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-slate-100 text-sm font-semibold">{label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <span
                    key={ex.text}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-white/4 border border-white/6 text-slate-300"
                  >
                    {ex.text}
                    {("note" in ex && ex.note) && (
                      <span className="text-slate-600">— {ex.note}</span>
                    )}
                    {("domain" in ex && ex.domain) && (
                      <span className="text-slate-600 text-[10px]">{ex.domain}</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Examples */}
      <div className="flex flex-col gap-5">
        <p className="text-slate-200 text-xs font-semibold uppercase tracking-widest">
          Esempi di prompt
        </p>
        <div className="flex flex-col gap-3">
          {EXAMPLES.map(({ label, prompt }) => (
            <div
              key={label}
              className="flex flex-col gap-2 p-5 rounded-2xl border border-[#1A1B28] bg-[#0A0B10]"
            >
              <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                {label}
              </span>
              <p className="text-slate-300 text-sm leading-relaxed">
                &ldquo;{prompt}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tip */}
      <div className="p-5 rounded-2xl border border-[#1A1B28] bg-[#0A0B10]">
        <p className="text-slate-400 text-sm leading-relaxed">
          <span className="text-slate-200 font-semibold">Consiglio:</span> anche un prompt
          minimo (es. &ldquo;backend developer&rdquo;) funziona — il sistema chiederà i dettagli
          mancanti all&apos;inizio della chiamata vocale.
        </p>
      </div>

      <Link
        href="/interview/new"
        className="self-start text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        Inizia una nuova intervista →
      </Link>
    </div>
    </>
  );
}
