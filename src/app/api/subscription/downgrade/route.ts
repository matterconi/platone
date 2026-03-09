import { auth } from "@clerk/nextjs/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getUserAccess } from "@/lib/subscription";

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!]: "casual",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!]: "regular",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!]: "pro",
};

const PLAN_RANK: Record<string, number> = {
  casual: 1,
  regular: 2,
  pro: 3,
};

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await request.json();
  if (!priceId || !PRICE_TO_PLAN[priceId]) return Response.json({ error: "priceId non valido" }, { status: 400 });

  const { plan: currentPlan, paddleSubscriptionId: subscriptionId } = await getUserAccess(userId);

  if (!subscriptionId) {
    return Response.json({ error: "Nessun abbonamento attivo" }, { status: 404 });
  }

  const targetPlan = PRICE_TO_PLAN[priceId];
  if (!currentPlan || (PLAN_RANK[targetPlan] ?? 0) >= (PLAN_RANK[currentPlan] ?? 0)) {
	return Response.json({ error: "Non è un downgrade valido" }, { status: 400 })
  }

  await paddle.subscriptions.update(subscriptionId, {
    items: [{ priceId, quantity: 1 }],
    prorationBillingMode: "do_not_bill",
  });

  return Response.json({ success: true });
}
