import Link from "next/link";
import Navbar from "@/components/Navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getUserAccess } from "@/lib/subscription";
import SubscriptionManager from "@/components/SubscriptionManager";
import Interviews from "@/components/Interviews";
import CvSection from "@/components/CvSection";
import AnimatedSection from "@/components/AnimatedSection";
import sql from "@/lib/db";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [access, user, cvRows] = await Promise.all([
    getUserAccess(userId),
    currentUser(),
    sql`SELECT cv_filename FROM users WHERE id = ${userId}`,
  ]);
  const cvFilename: string | null = cvRows[0]?.cv_filename ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const firstName = user?.firstName ?? null;

  // Fetch transactions from Paddle if customer exists
  type Transaction = { id: string; createdAt: string; amount: string; currency: string; status: string };
  const transactions: Transaction[] = [];
  if (access.paddleCustomerId) {
    try {
      for await (const tx of paddle.transactions.list({ customerId: [access.paddleCustomerId], status: ["completed"] })) {
        transactions.push({
          id: tx.id,
          createdAt: tx.createdAt ?? "",
          amount: (parseInt(tx.details?.totals?.total ?? "0") / 100).toFixed(2),
          currency: tx.currencyCode ?? "",
          status: tx.status ?? "",
        });
      }
    } catch (err) {
      console.error("[dashboard] Failed to fetch Paddle transactions:", err);
    }
  }

  // Fetch renewal info from Paddle subscription
  type RenewalInfo = {
    nextBilledAt: string | null;
    scheduledChange: { action: string; effectiveAt: string } | null;
    price: string | null;
  };
  let renewalInfo: RenewalInfo | null = null;
  if (access.paddleSubscriptionId) {
    try {
      const sub = await paddle.subscriptions.get(access.paddleSubscriptionId);
      const unitPrice = sub.items[0]?.price?.unitPrice;
      const price = unitPrice
        ? `${unitPrice.currencyCode} ${(parseInt(unitPrice.amount) / 100).toFixed(2)}`
        : null;
      // nextBilledAt can be null in sandbox — fall back to currentBillingPeriod.endsAt
      const nextBilledAt = sub.nextBilledAt ?? sub.currentBillingPeriod?.endsAt ?? null;
      renewalInfo = {
        nextBilledAt,
        scheduledChange: sub.scheduledChange
          ? { action: sub.scheduledChange.action, effectiveAt: sub.scheduledChange.effectiveAt }
          : null,
        price,
      };
    } catch (err) {
      console.error("[dashboard] Failed to fetch Paddle subscription:", err);
    }
  }

  return (
    <>
      <Navbar />

      {/* Page header */}
      <div className="border-b border-[rgba(240,237,230,0.07)]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-accent mb-2">
            Dashboard
          </p>
          <h1 className="font-display text-3xl font-bold text-fg">
            {firstName ? `Ciao, ${firstName}` : "La tua area personale"}
          </h1>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12 flex flex-col gap-16">

        {/* Interviste */}
        <AnimatedSection className="flex flex-col gap-6" delay={0}>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-accent">
              Storico
            </p>
            <h2 className="font-display text-2xl font-bold text-fg">
              Le tue interviste
            </h2>
          </div>
          <Interviews />
        </AnimatedSection>

        <div className="h-px bg-[rgba(240,237,230,0.07)]" />

        {/* Profilo CV */}
        <AnimatedSection className="flex flex-col gap-6" delay={0.05}>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-accent">
              Profilo
            </p>
            <h2 className="font-display text-2xl font-bold text-fg">
              Il tuo curriculum
            </h2>
          </div>
          <CvSection initialFilename={cvFilename} />
        </AnimatedSection>

        <div className="h-px bg-[rgba(240,237,230,0.07)]" />

        {/* Piano */}
        <AnimatedSection className="flex flex-col gap-6" delay={0.1}>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-accent">
              Abbonamento
            </p>
            <h2 className="font-display text-2xl font-bold text-fg">
              Il tuo piano
            </h2>
          </div>

          {access.hasActiveSubscription && access.plan ? (
            <SubscriptionManager
              plan={access.plan}
              credits={access.credits ?? 0}
              nextPlan={access.nextPlan}
              paddleSubscriptionId={access.paddleSubscriptionId}
              userEmail={userEmail}
              userId={userId}
              transactions={transactions}
              renewalInfo={renewalInfo}
            />
          ) : (
            <div className="group relative w-full max-w-lg">
              {/* Gradient border wrapper */}
              <div className="absolute inset-0 rounded-2xl bg-linear-to-b from-[rgba(240,237,230,0.14)] to-[rgba(240,237,230,0.04)] opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-[#0f0f13] rounded-2xl m-px p-8 flex flex-col gap-4">
                <p className="font-display text-lg font-semibold text-fg">
                  Nessun piano attivo
                </p>
                <p className="text-sm text-[rgba(240,237,230,0.45)] leading-relaxed">
                  Scegli un piano per accedere alle interviste con il tuo AI voice coach.
                </p>
                <div>
                  <Link href="/#pricing" className="cta-primary">
                    Scegli un piano
                  </Link>
                </div>
              </div>
            </div>
          )}
        </AnimatedSection>

      </main>
    </>
  );
}
