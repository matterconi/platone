import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Agent from "@/components/Agent";
import sql from "@/lib/db";

const NewInterviewPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress ??
    "Candidato";

  let suggestions: InterviewSuggestion[] = [];
  try {
    const rows = await sql`
      SELECT role, type, level, techstack
      FROM interviews
      WHERE finalized = TRUE
      ORDER BY created_at DESC
      LIMIT 8
    `;
    const seen = new Set<string>();
    for (const r of rows) {
      const key = `${r.level}|${r.role}|${r.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push({
          role: r.role ?? "",
          type: r.type ?? "",
          level: r.level ?? "",
          techstack: r.techstack ?? [],
        });
      }
    }
    suggestions = suggestions.slice(0, 5);
  } catch {
    // silently ignore
  }

  return (
    <div className="flex flex-col gap-10 px-6 py-14 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-slate-50 text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          Di cosa vuoi essere<br className="hidden sm:block" /> intervistato?
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-lg">
          Scegli il tuo intervistatore e descrivi il ruolo — l&apos;AI genererà
          le domande giuste e ti condurrà l&apos;intervista via voce.
        </p>
      </div>

      <Agent
        userName={userName}
        userId={user.id}
        mode="new"
        redirectOnFinish="/"
        suggestions={suggestions}
      />

      {/* Legend */}
      <div className="flex flex-col gap-5 pt-4 border-t border-[#1A1B28]">
        <div className="flex flex-col gap-1">
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest">
            Parametri riconosciuti automaticamente
          </p>
          <p className="text-slate-600 text-xs leading-relaxed">
            Scrivi liberamente — il sistema estrae i parametri dal testo. Più dettagli fornisci, più precisa sarà l&apos;intervista.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          {[
            {
              label: "Ruolo",
              examples: ["frontend developer", "cardiologo", "M&A lawyer", "financial analyst"],
            },
            {
              label: "Livello",
              examples: ["junior", "mid", "senior", "lead", "specializzando"],
            },
            {
              label: "Tipo di colloquio",
              examples: ["tecnico", "comportamentale", "misto", "case study"],
            },
            {
              label: "Durata",
              examples: ["rapida — 3 domande", "regolare — 5 domande", "lunga — 7 domande"],
            },
            {
              label: "Focus / Stack",
              examples: ["React, TypeScript", "chirurgia cardiaca", "derivati OTC", "SEO, paid media"],
            },
            {
              label: "Obiettivo",
              examples: ["prep colloquio", "certificazione", "esame accademico"],
            },
          ].map(({ label, examples }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <span className="text-slate-400 text-[11px] font-semibold">{label}</span>
              <div className="flex flex-col gap-0.5">
                {examples.map((ex) => (
                  <span key={ex} className="text-slate-600 text-[11px] leading-snug">{ex}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewInterviewPage;
