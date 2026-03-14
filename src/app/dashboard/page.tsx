import Link from "next/link";
import Navbar from "@/components/Navbar";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getUserAccess } from "@/lib/subscription";
import { PLAN_CREDITS } from "@/lib/credits";
import SubscriptionManager from "@/components/SubscriptionManager";
import Interviews from "@/components/Interviews";
import CvSection from "@/components/CvSection";
import AnimatedSection from "@/components/AnimatedSection";
import DashboardStats from "@/components/DashboardStats";
import sql from "@/lib/db";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [access, user, cvRows, evalRows, usageRow, countRow] = await Promise.all([
    getUserAccess(userId),
    currentUser(),
    sql`SELECT cv_filename FROM users WHERE id = ${userId}`,
    sql`
      SELECT
        created_at,
        (data->'evaluation'->>'domainKnowledge')::int AS domain_knowledge,
        (data->'evaluation'->>'problemSolving')::int   AS problem_solving,
        (data->'evaluation'->>'communication')::int    AS communication,
        data->'evaluation'->'strengths'                AS strengths
      FROM interviews
      WHERE user_id = ${userId}
        AND data->'evaluation' IS NOT NULL
        AND data->>'evaluation' != 'null'
      ORDER BY created_at ASC
    `,
    sql`SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds FROM usage_logs WHERE user_id = ${userId}`,
    sql`SELECT COUNT(*) AS total FROM interviews WHERE user_id = ${userId} AND finalized = true`,
  ]);
  const cvFilename: string | null = cvRows[0]?.cv_filename ?? null;
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const firstName = user?.firstName ?? null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

  // Process performance data for DashboardStats
  type EvalRow = {
    created_at: string;
    domain_knowledge: number | null;
    problem_solving: number | null;
    communication: number | null;
    strengths: string[] | null;
  };

  const performancePoints = (evalRows as EvalRow[])
    .filter((r) => r.domain_knowledge !== null && r.problem_solving !== null && r.communication !== null)
    .map((r) => {
      const dk = r.domain_knowledge ?? 0;
      const ps = r.problem_solving ?? 0;
      const comm = r.communication ?? 0;
      return {
        date: new Date(r.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
        rawDate: r.created_at,
        avgScore: Math.round(((dk + ps + comm) / 3) * 10) / 10,
        domainKnowledge: dk,
        problemSolving: ps,
        communication: comm,
      };
    });

  const avgOf = (key: "domainKnowledge" | "problemSolving" | "communication") =>
    performancePoints.length
      ? Math.round((performancePoints.reduce((s, p) => s + p[key], 0) / performancePoints.length) * 10) / 10
      : 0;

  const latestEval = (evalRows as EvalRow[]).findLast((r) => r.strengths);
  const latestStrengths: string[] = Array.isArray(latestEval?.strengths)
    ? (latestEval!.strengths as string[])
    : [];

  const totalMinutes = Math.floor(Number((usageRow[0] as { total_seconds: number })?.total_seconds ?? 0) / 60);
  const totalInterviews = Number((countRow[0] as { total: number })?.total ?? 0);
  const planCredits = access.plan ? (PLAN_CREDITS[access.plan] ?? 0) : 0;

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
        <div className="max-w-5xl mx-auto px-6 py-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[rgba(240,237,230,0.3)] mb-2">
              Area personale
            </p>
            <h1 className="font-display text-4xl font-bold text-fg leading-none">
              {firstName ? `Ciao, ${firstName}` : "La tua area"}
            </h1>
          </div>
          <Link
            href="/interview/new"
            className="shrink-0 hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-accent/10 border border-accent/25 hover:border-accent/50 hover:bg-accent/15 text-accent text-sm font-semibold transition-all duration-200"
          >
            + Nuova intervista
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Section 1: Performance bento — header inside DashboardStats ── */}
        <AnimatedSection delay={0}>
          <DashboardStats
            performancePoints={performancePoints}
            totalInterviews={totalInterviews}
            totalMinutes={totalMinutes}
            credits={access.credits ?? 0}
            planCredits={planCredits}
            latestStrengths={latestStrengths}
            latestWeaknesses={[]}
            avgDomainKnowledge={avgOf("domainKnowledge")}
            avgProblemSolving={avgOf("problemSolving")}
            avgCommunication={avgOf("communication")}
            plan={access.plan}
          />
        </AnimatedSection>

        {/* ── Section 2: Interviews — subtle integrated label ── */}
        <AnimatedSection className="flex flex-col gap-5" delay={0}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-accent/50">02</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
                Le tue interviste
              </span>
            </div>
            <Link
              href="/interview/new"
              className="shrink-0 sm:hidden inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-accent/10 border border-accent/25 hover:border-accent/50 text-accent text-xs font-semibold transition-all duration-200"
            >
              + Nuova
            </Link>
          </div>
          <Interviews />
        </AnimatedSection>

        {/* ── Section 3+4: Profilo + Piano bento row ── */}
        <AnimatedSection
          className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-4 items-stretch"
          delay={0.05}
        >
          {/* Profilo card */}
          <div className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col gap-5">
            {/* Section label */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-accent/50">03</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
                Profilo
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm shrink-0">
                {firstName?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-fg text-sm font-semibold truncate">
                  {fullName ?? "Utente"}
                </span>
                <span className="text-[rgba(240,237,230,0.4)] text-xs truncate">
                  {userEmail}
                </span>
              </div>
            </div>

            <div className="h-px bg-[rgba(240,237,230,0.06)]" />

            {/* CV section embedded */}
            <CvSection initialFilename={cvFilename} />
          </div>

          {/* Piano card */}
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
            <div className="bg-[#0f0f13] rounded-2xl ring-1 ring-[rgba(240,237,230,0.07)] p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase text-accent/50">04</span>
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[rgba(240,237,230,0.4)]">
                  Il tuo piano
                </span>
              </div>
              <div className="flex flex-col gap-4 flex-1 justify-center">
                <p className="font-display text-lg font-semibold text-fg">
                  Nessun piano attivo
                </p>
                <p className="text-sm text-[rgba(240,237,230,0.4)] leading-relaxed">
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
