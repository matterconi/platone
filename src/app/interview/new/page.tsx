import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Agent from "@/components/Agent";
import Navbar from "@/components/Navbar";
import sql from "@/lib/db";

const NewInterviewPage = async ({ searchParams }: RouteParams) => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const sp = await searchParams;
  const prefillRole = sp.role ?? "";
  const prefillType = sp.type ?? "";
  const prefillCompany = sp.desired_company ?? "";
  const initialMessage = prefillRole
    ? [
        `Voglio un'intervista ${prefillType || "tecnica"} per il ruolo di ${prefillRole}`,
        prefillCompany ? `presso ${prefillCompany}` : "",
      ]
        .filter(Boolean)
        .join(" ") + "."
    : undefined;

  const userName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress ??
    "Candidato";

  let recentInterviews: RecentInterview[] = [];
  let recentInterviewsLabel = "Le tue ultime interviste";
  let cvFilename: string | null = null;

  try {
    const parseEvaluation = (row: Record<string, unknown>): Evaluation | null => {
      try {
        const raw = row.data;
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        return (parsed as { evaluation?: Evaluation })?.evaluation ?? null;
      } catch {
        return null;
      }
    };

    const mapRow = (r: Record<string, unknown>): RecentInterview => ({
      id: r.id as string,
      title: (r.title as string | null) ?? null,
      role: (r.role as string) ?? "",
      type: (r.type as string) ?? "",
      level: (r.level as string) ?? "",
      techstack: (r.techstack as string[]) ?? [],
      specialization: (r.specialization as string | null) ?? null,
      questions: (r.questions as string[]) ?? [],
      evaluation: parseEvaluation(r),
      createdAt: (r.created_at as Date | null)?.toISOString() ?? null,
    });

    const [userRow, userRows] = await Promise.all([
      sql`SELECT cv_filename FROM users WHERE id = ${user.id}`,
      sql`
        SELECT id, title, role, type, level, techstack, specialization,
               questions, data, created_at
        FROM interviews
        WHERE user_id = ${user.id} AND finalized = TRUE
        ORDER BY created_at DESC
        LIMIT 4
      `,
    ]);

    cvFilename = userRow[0]?.cv_filename ?? null;
    recentInterviews = userRows.map(mapRow);
    console.log("[new/page] userRows count:", userRows.length, "| mapped:", recentInterviews.length);
    if (userRows[0]) console.log("[new/page] first raw row keys:", Object.keys(userRows[0]), "| data type:", typeof userRows[0].data, "| data sample:", JSON.stringify(userRows[0].data)?.slice(0, 120));

    // If user has no interviews, show community
    if (recentInterviews.length === 0) {
      const communityRows = await sql`
        SELECT id, title, role, type, level, techstack, specialization,
               questions, data, created_at
        FROM interviews
        WHERE finalized = TRUE
        ORDER BY created_at DESC
        LIMIT 4
      `;
      recentInterviews = communityRows.map(mapRow);
      recentInterviewsLabel = "Dalla community";
      console.log("[new/page] community fallback count:", communityRows.length);
    }
  } catch (err) {
    console.error("[new/page] recentInterviews fetch failed:", err);
  }

  return (
    <>
    <Navbar />
    <div className="relative min-h-screen">
      <div className="relative flex flex-col gap-12 px-6 py-14 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-[0.95] tracking-tight text-(--fg)">
            Di cosa vuoi essere<br className="hidden sm:block" />{" "}
            <span className="text-accent">intervistato?</span>
          </h1>
          <p className="text-base leading-[1.8] max-w-lg" style={{ color: "rgba(240,237,230,0.45)" }}>
            Scegli il tuo intervistatore e descrivi il ruolo — l&apos;AI genererà
            le domande giuste e ti condurrà l&apos;intervista via voce.
          </p>
        </div>

        <Agent
          userName={userName}
          userId={user.id}
          mode="new"
          redirectOnFinish="/"
          cvFilename={cvFilename}
          recentInterviews={recentInterviews}
          recentInterviewsLabel={recentInterviewsLabel}
          initialMessage={initialMessage}
        />
      </div>
    </div>
    </>
  );
};

export default NewInterviewPage;
