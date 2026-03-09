import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { PLAN_CREDITS } from "@/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await sql`
    SELECT s.plan, u.credits
    FROM subscriptions s
    JOIN users u ON u.id = s.user_id
    WHERE s.user_id = ${userId}
      AND s.status = 'active'
    ORDER BY s.last_paid_at DESC
    LIMIT 1
  `;

  if (!sub) {
    return Response.json({ eligible: false, reason: "No active subscription found" });
  }

  const planCredits = PLAN_CREDITS[sub.plan] ?? 0;

  const [activeSession] = await sql`
    SELECT call_id FROM interview_sessions
    WHERE user_id = ${userId} AND ended_at IS NULL AND created_at > NOW() - INTERVAL '2 hours'
    LIMIT 1
  `;

  if (activeSession) {
    return Response.json({ eligible: false, reason: "Active interview in progress", plan: sub.plan });
  }

  const eligible = sub.credits >= planCredits;

  return Response.json({
    eligible,
    reason: eligible ? "No credits used since last payment" : "Credits already used — not eligible",
    plan: sub.plan,
  });
}
