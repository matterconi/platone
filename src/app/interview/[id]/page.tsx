import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import sql from "@/lib/db";
import InterviewDetail from "./InterviewDetail";
import Navbar from "@/components/Navbar";

function mapInterview(row: Record<string, unknown>): Interview {
  const data = row.data as Record<string, unknown> | null;
  return {
    id: row.id as string,
    userId: row.user_id as string,
    role: row.role as string,
    type: row.type as string,
    level: row.level as string,
    techstack: row.techstack as string[],
    questions: row.questions as string[],
    specialization: row.specialization as string | undefined,
    finalized: row.finalized as boolean,
    createdAt: row.created_at as string,
    evaluation: data?.evaluation as Evaluation | undefined,
  };
}

const InterviewPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const rows = await sql`SELECT * FROM interviews WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) notFound();

  const interview = mapInterview(rows[0] as Record<string, unknown>);

  const userName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress ??
    "Candidato";

  return (
    <>
      <Navbar />
      <div className="flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto">
        <InterviewDetail
          interview={interview}
          userName={userName}
          userId={user.id}
        />
      </div>
    </>
  );
};

export default InterviewPage;
