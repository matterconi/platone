import { auth } from "@clerk/nextjs/server";
import { Paddle } from "@paddle/paddle-node-sdk";
import sql from "@/lib/db";

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [row] = await sql`
    SELECT paddle_subscription_id
    FROM subscriptions
    WHERE user_id = ${userId} AND status = 'active'
    LIMIT 1
  `;

  if (!row?.paddle_subscription_id) {
    return Response.json({ error: "Nessun abbonamento attivo" }, { status: 404 });
  }

  await paddle.subscriptions.cancel(row.paddle_subscription_id, {
    effectiveFrom: "next_billing_period",
  });

  return Response.json({ success: true });
}
