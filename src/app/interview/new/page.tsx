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
    </div>
  );
};

export default NewInterviewPage;
