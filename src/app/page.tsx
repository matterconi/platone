import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";
import { dummyInterviews } from "@constants";

export default async function Home() {
  const user = await currentUser();

  // Interviste dell'utente loggato — per ora usiamo dummy data filtrata per userId
  const userInterviews = user
    ? dummyInterviews.filter((i) => i.userId === "user1")
    : [];

  return (
    <main className="flex flex-col gap-16 px-6 py-12 max-w-5xl mx-auto">
      {/* Hero */}
      <section className="card-border w-full">
        <div className="card flex flex-col items-center gap-6 py-16 px-8 text-center">
          <h1 className="text-light-100 text-4xl font-bold">
            Preparati per la tua prossima interview
          </h1>
          <p className="text-light-400 max-w-xl">
            Allenati con il tuo AI voice assistant, ricevi feedback in tempo
            reale e migliora le tue performance.
          </p>
          <Button asChild className="btn">
            <Link href="/interview/new">Inizia un&apos;interview</Link>
          </Button>
        </div>
      </section>

      {/* Interview disponibili */}
      <section className="flex flex-col gap-6">
        <h2 className="text-light-100 text-2xl font-semibold">
          Interview disponibili
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dummyInterviews.map((interview) => (
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
      </section>

      {/* Le tue interview (solo se loggato) */}
      {user && (
        <section className="flex flex-col gap-6">
          <h2 className="text-light-100 text-2xl font-semibold">
            Le tue interview
          </h2>
          {userInterviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {userInterviews.map((interview) => (
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
          ) : (
            <p className="text-light-400">
              Non hai ancora completato nessuna interview.
            </p>
          )}
        </section>
      )}
    </main>
  );
}
