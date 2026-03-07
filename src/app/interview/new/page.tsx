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
  let recentInterviews: RecentInterview[] = [];
  let recentInterviewsLabel = "Le tue ultime interviste";

  try {
    // User's own recent finalized interviews
    const userRows = await sql`
      SELECT id, role, type, level, techstack
      FROM interviews
      WHERE user_id = ${user.id} AND finalized = TRUE
      ORDER BY created_at DESC
      LIMIT 4
    `;
    recentInterviews = userRows.map((r) => ({
      id: r.id,
      role: r.role ?? "",
      type: r.type ?? "",
      level: r.level ?? "",
      techstack: r.techstack ?? [],
    }));

    // If user has no interviews, show community
    if (recentInterviews.length === 0) {
      const communityRows = await sql`
        SELECT id, role, type, level, techstack
        FROM interviews
        WHERE finalized = TRUE
        ORDER BY created_at DESC
        LIMIT 4
      `;
      recentInterviews = communityRows.map((r) => ({
        id: r.id,
        role: r.role ?? "",
        type: r.type ?? "",
        level: r.level ?? "",
        techstack: r.techstack ?? [],
      }));
      recentInterviewsLabel = "Dalla community";
    }

    // Suggestion chips (deduplicated)
    const chipRows = await sql`
      SELECT role, type, level, techstack
      FROM interviews
      WHERE finalized = TRUE
      ORDER BY created_at DESC
      LIMIT 8
    `;
    const seen = new Set<string>();
    for (const r of chipRows) {
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
    <div className="flex flex-col gap-12 px-6 py-14 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3">
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
        recentInterviews={recentInterviews}
        recentInterviewsLabel={recentInterviewsLabel}
      />
    </div>
  );
};

export default NewInterviewPage;
