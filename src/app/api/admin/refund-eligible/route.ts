import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";

const ADMIN_USER_IDS = (process.env.ADMIN_USER_IDS ?? "").split(",").filter(Boolean);

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get("userId");
  if (!targetUserId) {
    return Response.json({ error: "Missing userId" }, { status: 400 });
  }

  const [sub] = await sql`
    SELECT paddle_subscription_id, plan, last_paid_at
    FROM subscriptions
    WHERE user_id = ${targetUserId}
      AND status = 'active'
    ORDER BY last_paid_at DESC
    LIMIT 1
  `;

  if (!sub?.last_paid_at) {
    return Response.json({ eligible: false, reason: "No active subscription found" });
  }

  const [session] = await sql`
    SELECT id FROM interview_sessions
    WHERE user_id = ${targetUserId}
      AND created_at > ${sub.last_paid_at}
    LIMIT 1
  `;

  const eligible = !session;

  return Response.json({
    eligible,
    reason: eligible
      ? "No interview started since last payment"
      : "Interview started after last payment — not eligible",
    plan: sub.plan,
    last_paid_at: sub.last_paid_at,
    paddle_subscription_id: sub.paddle_subscription_id,
  });
}
