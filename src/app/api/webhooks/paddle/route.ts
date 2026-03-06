import { Paddle, EventName } from "@paddle/paddle-node-sdk";
import { NextRequest } from "next/server";
import sql from "@/lib/db";
import { PLAN_CREDITS } from "@/lib/credits";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const PRICE_TO_PLAN: Record<string, string> = {
  pri_01kk1pndq89nmbytffssa8sejw: "casual",
  pri_01kk1pqm2pz7sq1z47ed04gqc2: "regular",
  pri_01kk1ptvd4ky1wtrn44awc72cv: "pro",
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

      if (!clerkUserId || !plan || credits == null) {
        console.warn("transaction.completed: dati mancanti", { clerkUserId, priceId, plan });
        break;
      }

      await sql`
        UPDATE users
        SET paddle_customer_id = ${tx.customerId}, credits = credits + ${credits}
        WHERE id = ${clerkUserId}
      `;

      await sql`
        INSERT INTO subscriptions (user_id, plan, status, paddle_subscription_id, last_paid_at)
        VALUES (${clerkUserId}, ${plan}, ${'active'}, ${tx.subscriptionId}, NOW())
        ON CONFLICT (paddle_subscription_id)
        DO UPDATE SET plan = ${plan}, status = ${'active'}, last_paid_at = NOW(), next_plan = NULL
      `;
      break;
    }

    case EventName.SubscriptionUpdated: {
      const sub = event.data;

      if (sub.scheduledChange?.action === 'cancel') {
        await sql`
          UPDATE subscriptions
          SET next_plan = ${'cancelled'}
          WHERE paddle_subscription_id = ${sub.id}
        `;
        break;
      }

      const priceId = sub.items?.[0]?.price?.id;
      const nextPlan = priceId ? PRICE_TO_PLAN[priceId] : null;
      if (!nextPlan) break;

      await sql`
        UPDATE subscriptions
        SET next_plan = ${nextPlan}
        WHERE paddle_subscription_id = ${sub.id}
        AND plan != ${nextPlan}
      `;
      break;
    }

    case EventName.SubscriptionCanceled: {
      const sub = event.data;
      await sql`
        UPDATE subscriptions
        SET status = ${'cancelled'}
        WHERE paddle_subscription_id = ${sub.id}
      `;
      break;
    }
  }

  return Response.json({ received: true });
}
