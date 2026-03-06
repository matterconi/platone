import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserAccess } from "@/lib/subscription";
import { PLAN_CREDITS, DEFAULT_CREDITS_PER_MINUTE } from "@/lib/credits";
import { Button } from "@/components/ui/button";

const PLAN_LABELS: Record<string, string> = {
  casual: "Casual",
  regular: "Regular",
  pro: "Pro",
};

const PLAN_COLORS: Record<string, string> = {
  casual: "bg-indigo-600/30 text-indigo-100",
  regular: "bg-violet-300/20 text-violet-300",
  pro: "bg-green-400/20 text-green-400",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const access = await getUserAccess(userId);

  const credits = access.credits ?? 0;
  const planCredits = access.plan ? (PLAN_CREDITS[access.plan] ?? 0) : 0;
  const remainingMinutes = Math.floor(credits / DEFAULT_CREDITS_PER_MINUTE);
  const usagePercent = planCredits > 0 ? Math.min(100, Math.round(((planCredits - credits) / planCredits) * 100)) : 0;
  const isLow = usagePercent >= 80;

  return (
    <main className="flex flex-col gap-10 px-6 py-12 max-w-5xl mx-auto">
      <h1 className="text-indigo-100 text-3xl font-bold">Il tuo piano</h1>

      {access.hasActiveSubscription && access.plan ? (
        <div className="flex flex-col gap-6 max-w-lg">
          <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33] w-full">
            <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col gap-8 p-8">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-indigo-400 text-sm">Piano attuale</span>
                  <span className="text-indigo-100 text-2xl font-bold">
                    {PLAN_LABELS[access.plan] ?? access.plan}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_COLORS[access.plan] ?? "bg-slate-900 text-indigo-400"}`}
                >
                  Attivo
                </span>
              </div>

              {/* Credits */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-indigo-400 text-sm">Credits rimanenti</span>
                  <span className="text-indigo-100 font-semibold tabular-nums">
                    {credits}{" "}
                    <span className="text-indigo-400 font-normal text-sm">/ {planCredits}</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? "bg-red-400" : "bg-violet-300"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-indigo-400">
                  <span className={isLow ? "text-red-400 font-medium" : ""}>
                    ~{remainingMinutes} min rimanenti
                  </span>
                  <span>{credits} credits</span>
                </div>
              </div>

              {/* Upgrade CTA */}
              {access.plan !== "pro" && (
                <Button asChild className="bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10 w-full">
                  <Link href="/#pricing">Passa a un piano superiore</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33] w-full max-w-lg">
          <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col gap-4 p-8">
            <p className="text-indigo-100 font-semibold text-lg">Nessun piano attivo</p>
            <p className="text-indigo-400 text-sm">
              Scegli un piano per accedere alle interview con il tuo AI voice coach.
            </p>
            <Button asChild className="bg-violet-300! text-zinc-950! hover:bg-violet-300/80! rounded-full! font-bold! px-5 cursor-pointer min-h-10">
              <Link href="/#pricing">Scegli un piano</Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
