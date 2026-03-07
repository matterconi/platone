import sql from "@/lib/db";
import InterviewCard from "@/components/InterviewCard";

export default async function CommunityInterviews() {
  let interviews: Interview[] = [];

  try {
    const rows = await sql`
      SELECT id, user_id, role, type, level, techstack, created_at
      FROM interviews
      WHERE finalized = TRUE
      ORDER BY created_at DESC
      LIMIT 6
    `;

    interviews = rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      role: r.role,
      type: r.type,
      level: r.level,
      techstack: r.techstack,
      questions: [],
      finalized: true,
      createdAt: r.created_at,
    }));
  } catch {
    return (
      <p className="text-indigo-400 text-sm">
        Impossibile caricare le interview.
      </p>
    );
  }

  if (interviews.length === 0) {
    return (
      <p className="text-indigo-400 text-sm">
        Nessuna interview ancora. Sii il primo a crearne una!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {interviews.map((interview) => (
        <InterviewCard
          key={interview.id}
          interviewId={interview.id}
          userId={interview.userId}
          role={interview.role}
          type={interview.type}
          techstack={interview.techstack}
          createdAt={interview.createdAt}
        />
      ))}
    </div>
  );
}
