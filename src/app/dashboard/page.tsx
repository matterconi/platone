import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Paddle } from "@paddle/paddle-node-sdk";
import { getUserAccess } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import SubscriptionManager from "@/components/SubscriptionManager";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

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
      for await (const tx of paddle.transactions.list({ customerId: [access.paddleCustomerId] })) {
        transactions.push({
          id: tx.id,
          createdAt: tx.createdAt ?? "",
          amount: tx.details?.totals?.total ?? "0",
          currency: tx.currencyCode ?? "",
          status: tx.status ?? "",
        });
      }
    } catch {
      // Non-blocking: storico non disponibile
    }
  }

  return (
    <main className="flex flex-col gap-10 px-6 py-12 max-w-5xl mx-auto">
      <h1 className="text-indigo-100 text-3xl font-bold">Il tuo piano</h1>

      {access.hasActiveSubscription && access.plan ? (
        <SubscriptionManager
          plan={access.plan}
          credits={access.credits ?? 0}
          nextPlan={access.nextPlan}
          paddleSubscriptionId={access.paddleSubscriptionId}
          userEmail={userEmail}
          userId={userId}
          transactions={transactions}
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
    </main>
  );
}
