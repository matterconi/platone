import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getUserAccess } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import SubscriptionManager from "@/components/SubscriptionManager";
import Interviews from "@/components/Interviews";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [access, user] = await Promise.all([
    getUserAccess(userId),
    currentUser(),
  ]);

  const userEmail = user?.primaryEmailAddress?.emailAddress ?? "";

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
    <main className="flex flex-col gap-16 px-6 py-12 max-w-5xl mx-auto">
      {/* Interview list */}
      <section className="flex flex-col gap-6">
        <h1 className="text-indigo-100 text-3xl font-bold">Le tue interview</h1>
        <Interviews />
      </section>

      {/* Plan */}
      <section className="flex flex-col gap-6">
        <h2 className="text-indigo-100 text-2xl font-bold">Il tuo piano</h2>

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
      </section>
    </main>
  );
}
