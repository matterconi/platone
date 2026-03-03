import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Agent from "@/components/Agent";

const InterviewPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  const userName = user.firstName ?? user.emailAddresses[0]?.emailAddress ?? "Candidato";

  return (
    <div className="flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-light-100 text-2xl font-bold">Mock Interview</h1>
        <p className="text-light-400 text-sm">
          L&apos;AI interviewer ti farà domande tecniche e comportamentali. Rispondi naturalmente come in una vera interview.
        </p>
      </div>

      <Agent
        userName={userName}
        userId={user.id}
        interviewId={id}
        type="interview"
      />
    </div>
  );
};

export default InterviewPage;
