import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

import { Button } from "@/components/ui/button";
import Interviews from "@/components/Interviews";
import PricingSection from "@/components/PricingSection";

export default async function Home() {
  const user = await currentUser();

  return (
    <main className="flex flex-col gap-16 px-6 py-12 max-w-5xl mx-auto">
      {/* CTA */}
      <section className="flex flex-row bg-linear-to-b from-[#171532] to-[#08090D] rounded-3xl px-16 py-6 items-center justify-between max-sm:px-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-indigo-100 text-3xl font-bold">
            Crea una nuova interview
          </h1>
          <p className="text-indigo-400 max-w-lg">
            Allenati con il tuo AI voice assistant, ricevi feedback in tempo
            reale e migliora le tue performance.
          </p>
        </div>
        <Button asChild className="bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10 shrink-0">
          <Link href="/interview/new">Inizia ora</Link>
        </Button>
      </section>

      {/* Le tue interview */}
      {user && (
        <section className="flex flex-col gap-6">
          <h2 className="text-indigo-100">Le tue interview</h2>
          <Interviews />
        </section>
      )}

      {/* Pricing — visibile a tutti (nessuna subscription attiva) */}
      <PricingSection />
    </main>
  );
}
