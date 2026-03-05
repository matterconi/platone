import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserAccess, getRemainingSeconds, PLAN_LIMITS_MINUTES } from "@/lib/subscription";
import { Button } from "@/components/ui/button";

const PLAN_LABELS: Record<string, string> = {
  casual: "Casual",
  regular: "Regular",
  pro: "Pro",
};

const PLAN_COLORS: Record<string, string> = {
  casual: "bg-light-600/30 text-light-100",
  regular: "bg-primary-200/20 text-primary-200",
  pro: "bg-success-100/20 text-success-100",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const access = await getUserAccess(userId);

  let usedMinutes = 0;
  let remainingMinutes = 0;
  let limitMinutes = 0;
  let periodEnd: Date | null = null;

  if (access.hasActiveSubscription && access.plan && access.periodStart) {
    limitMinutes = PLAN_LIMITS_MINUTES[access.plan] ?? 0;
    const remainingSeconds = await getRemainingSeconds(userId, access.plan, access.periodStart);
    remainingMinutes = Math.floor(remainingSeconds / 60);
    usedMinutes = limitMinutes - remainingMinutes;
    periodEnd = new Date(access.periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  const usagePercent =
    limitMinutes > 0 ? Math.min(100, Math.round((usedMinutes / limitMinutes) * 100)) : 0;

  const isLow = usagePercent >= 80;

  return (
    <main className="flex flex-col gap-10 px-6 py-12 max-w-5xl mx-auto">
      <h1 className="text-light-100 text-3xl font-bold">Il tuo piano</h1>

      {access.hasActiveSubscription && access.plan ? (
        <div className="flex flex-col gap-6 max-w-lg">
          <div className="card-border w-full">
            <div className="card flex flex-col gap-8 p-8">

              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-light-400 text-sm">Piano attuale</span>
                  <span className="text-light-100 text-2xl font-bold">
                    {PLAN_LABELS[access.plan] ?? access.plan}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_COLORS[access.plan] ?? "bg-dark-300 text-light-400"}`}
                >
                  Attivo
                </span>
              </div>

              {/* Usage */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-light-400 text-sm">Minuti questo periodo</span>
                  <span className="text-light-100 font-semibold tabular-nums">
                    {usedMinutes}{" "}
                    <span className="text-light-400 font-normal text-sm">/ {limitMinutes} min</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isLow ? "bg-destructive-100" : "bg-primary-200"}`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-light-400">
                  <span
                    className={isLow ? "text-destructive-100 font-medium" : ""}
                  >
                    {remainingMinutes} min rimanenti
                  </span>
                  {periodEnd && (
                    <span>
                      Reset il{" "}
                      {periodEnd.toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Upgrade CTA */}
              {access.plan !== "pro" && (
                <Button asChild className="btn-primary w-full">
                  <Link href="/#pricing">Passa a un piano superiore</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-border w-full max-w-lg">
          <div className="card flex flex-col gap-4 p-8">
            <p className="text-light-100 font-semibold text-lg">Nessun piano attivo</p>
            <p className="text-light-400 text-sm">
              Scegli un piano per accedere alle interview con il tuo AI voice coach.
            </p>
            <Button asChild className="btn-primary">
              <Link href="/#pricing">Scegli un piano</Link>
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
