import { auth } from "@clerk/nextjs/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { getActiveSubscriptionId } from "@/lib/subscription";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptionId = await getActiveSubscriptionId(userId);

  if (!subscriptionId) {
    return Response.json({ error: "Nessun abbonamento attivo" }, { status: 404 });
  }

  await paddle.subscriptions.cancel(subscriptionId, {
    effectiveFrom: "next_billing_period",
  });

  return Response.json({ success: true });
}
