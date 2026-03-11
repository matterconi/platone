import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Agent from "@/components/Agent";
import Navbar from "@/components/Navbar";
import { getUserAccess } from "@/lib/subscription";

const DemoInterviewPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const access = await getUserAccess(user.id);
  if (access.trialUsed) redirect("/");

  const userName =
    user.firstName ??
    user.emailAddresses[0]?.emailAddress ??
    "Candidato";

  return (
    <>
    <Navbar />
    <div className="flex flex-col gap-8 px-6 py-12 max-w-3xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-indigo-100 text-2xl font-bold">Interview di prova</h1>
        <p className="text-indigo-400 text-sm">
          3 minuti per scoprire come funziona. L&apos;AI raccoglierà il tuo profilo professionale.
        </p>
      </div>

      <Agent
        userName={userName}
        userId={user.id}
        mode="demo"
      />
    </div>
    </>
  );
};

export default DemoInterviewPage;
