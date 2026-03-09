import { Paddle, Environment, EventName } from "@paddle/paddle-node-sdk";
import { NextRequest } from "next/server";
import { PLAN_CREDITS } from "@/lib/credits";
import {
  applyTransaction,
  scheduleCancel,
  scheduleDowngrade,
  cancelSubscription,
} from "@/lib/billing";

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === "sandbox"
    ? Environment.sandbox
    : Environment.production,
});

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_CASUAL!]: "casual",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_REGULAR!]: "regular",
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO!]: "pro",
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("paddle-signature") ?? "";
  const rawBody = await request.text();

  let event;
  try {
    event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  switch (event.eventType) {
    case EventName.TransactionCompleted: {
      const tx = event.data;
      if (!tx.subscriptionId) break;

      const clerkUserId = (tx.customData as Record<string, string> | null)?.clerkUserId;
      const priceId = tx.items?.[0]?.price?.id;
      const plan = priceId ? PRICE_TO_PLAN[priceId] : null;
      const credits = plan ? PLAN_CREDITS[plan] : null;

      if (!clerkUserId || !tx.customerId || !plan || credits == null) {
        console.warn("transaction.completed: dati mancanti", { clerkUserId, priceId, plan });
        break;
      }

      await applyTransaction(clerkUserId, tx.customerId, plan, credits, tx.subscriptionId);
      break;
    }

    case EventName.SubscriptionUpdated: {
      const sub = event.data;

      if (sub.scheduledChange?.action === "cancel") {
        await scheduleCancel(sub.id);
        break;
      }

      const priceId = sub.items?.[0]?.price?.id;
      const nextPlan = priceId ? PRICE_TO_PLAN[priceId] : null;
      if (!nextPlan) break;

      await scheduleDowngrade(sub.id, nextPlan);
      break;
    }

    case EventName.SubscriptionCanceled: {
      const sub = event.data;
      await cancelSubscription(sub.id);
      break;
    }
  }

  return Response.json({ received: true });
}
