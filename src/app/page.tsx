import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import Interviews from "@/components/Interviews";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="flex flex-col gap-16 px-6 py-12 max-w-5xl mx-auto">
      {/* CTA */}
      <section className="card-cta">
        <div className="flex flex-col gap-3">
          <h1 className="text-light-100 text-3xl font-bold">
            Crea una nuova interview
          </h1>
          <p className="text-light-400 max-w-lg">
            Allenati con il tuo AI voice assistant, ricevi feedback in tempo
            reale e migliora le tue performance.
          </p>
        </div>
        <Button asChild className="btn-primary shrink-0">
          <Link href="/interview/new">Inizia ora</Link>
        </Button>
      </section>

      {/* Le tue interview */}
      {user && (
        <section className="flex flex-col gap-6">
          <h2 className="text-light-100">Le tue interview</h2>
          <Interviews />
        </section>
      )}
    </main>
  );
}
