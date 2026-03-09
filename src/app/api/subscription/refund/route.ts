import { auth } from "@clerk/nextjs/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import sql from "@/lib/db";
import { cancelSubscription } from "@/lib/billing";
import { PLAN_CREDITS } from "@/lib/credits";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

// Reverse map: credits amount → plan name
const CREDITS_TO_PLAN: Record<number, string> = Object.fromEntries(
  Object.entries(PLAN_CREDITS).map(([plan, credits]) => [credits, plan])
);

const PLAN_TO_PRICE: Record<string, string> = {
  casual: process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!,
  regular: process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!,
  pro: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!,
};

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch active subscription + user credits in one query
  const [sub] = await sql`
    SELECT s.paddle_subscription_id, s.plan, u.credits
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.user_id = ${userId} AND s.status = 'active'
    ORDER BY s.last_paid_at DESC LIMIT 1
  `;
  if (!sub) return Response.json({ error: "Nessun abbonamento attivo" }, { status: 404 });

  const planCredits = PLAN_CREDITS[sub.plan] ?? 0;

  // Eligibility: no active interview
  const [activeSession] = await sql`
    SELECT call_id FROM interview_sessions
    WHERE user_id = ${userId} AND ended_at IS NULL AND created_at > NOW() - INTERVAL '2 hours'
    LIMIT 1
  `;
  if (activeSession) {
    return Response.json(
      { error: "Hai un'intervista in corso. Concludila prima di richiedere il rimborso." },
      { status: 403 }
    );
  }

  // Eligibility: no credits used since last payment
  if (sub.credits < planCredits) {
    return Response.json(
      { error: "Hai già utilizzato dei crediti — rimborso non disponibile." },
      { status: 403 }
    );
  }

  const subscriptionId = sub.paddle_subscription_id;

  // Get latest completed transaction
  const txCollection = paddle.transactions.list({
    subscriptionId: [subscriptionId],
    status: ["completed"],
    orderBy: "createdAt[DESC]",
    perPage: 1,
  });
  const [transaction] = await txCollection.next();
  if (!transaction) {
    return Response.json({ error: "Transazione non trovata." }, { status: 404 });
  }

  // Issue full refund
  await paddle.adjustments.create({
    action: "refund",
    transactionId: transaction.id,
    reason: "other",
    type: "full",
  });

  // Calculate remaining credits (from a previous lower-tier plan, if any)
  const remainingCredits = sub.credits - planCredits;
  const previousPlan = CREDITS_TO_PLAN[remainingCredits] ?? null;

  if (previousPlan) {
    // User upgraded from a previous plan — downgrade back to it
    await paddle.subscriptions.update(subscriptionId, {
      items: [{ priceId: PLAN_TO_PRICE[previousPlan], quantity: 1 }],
      prorationBillingMode: "do_not_bill",
    });
    await sql`
      UPDATE subscriptions
      SET plan = ${previousPlan}, next_plan = NULL
      WHERE paddle_subscription_id = ${subscriptionId}
    `;
    await sql`UPDATE users SET credits = ${remainingCredits} WHERE id = ${userId}`;
  } else {
    // No previous plan — cancel immediately
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: "immediately" });
    await cancelSubscription(subscriptionId);
  }

  return Response.json({ success: true, previousPlan });
}
