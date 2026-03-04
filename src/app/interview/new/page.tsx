import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Agent from "@/components/Agent";

const NewInterviewPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress ??
    "Candidato";

  return (
    <div className="flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-light-100 text-2xl font-bold">Nuova Interview</h1>
        <p className="text-light-400 text-sm">
          L&apos;AI interviewer raccoglierà i dettagli via voce e genererà le
          domande per te.
        </p>
      </div>

      <Agent
        userName={userName}
        userId={user.id}
        mode="new"
        redirectOnFinish="/"
      />
    </div>
  );
};

export default NewInterviewPage;
