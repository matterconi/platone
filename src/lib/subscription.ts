import sql from "@/lib/db";
import { DEFAULT_CREDITS_PER_MINUTE } from "@/lib/credits";

export async function getUserAccess(userId: string) {
  const rows = await sql`
    SELECT
      u.trial_used,
      u.credits,
      u.paddle_customer_id,
      s.plan,
      s.status,
      s.starts_at,
      s.paddle_subscription_id,
      s.next_plan
    FROM users u
    LEFT JOIN subscriptions s
      ON s.user_id = u.id
      AND s.status = 'active'
      AND (s.ends_at IS NULL OR s.ends_at > NOW())
    WHERE u.id = ${userId}
    ORDER BY s.last_paid_at DESC NULLS LAST
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return { hasActiveSubscription: false, plan: null, trialUsed: false, credits: 0, paddleSubscriptionId: null, nextPlan: null, paddleCustomerId: null };

  return {
    hasActiveSubscription: !!row.plan,
    plan: row.plan ?? null,
    trialUsed: row.trial_used ?? false,
    credits: row.credits ?? 0,
    paddleSubscriptionId: row.paddle_subscription_id ?? null,
    nextPlan: row.next_plan ?? null,
    paddleCustomerId: row.paddle_customer_id ?? null,
  };
}

export async function getActiveSubscriptionId(userId: string): Promise<string | null> {
  const [row] = await sql`
    SELECT paddle_subscription_id
    FROM subscriptions
    WHERE user_id = ${userId} AND status = 'active'
    ORDER BY last_paid_at DESC NULLS LAST
    LIMIT 1
  `;
  return row?.paddle_subscription_id ?? null;
}

/**
 * Returns remaining seconds based on user's credit balance.
 * Uses DEFAULT_CREDITS_PER_MINUTE as the conversion rate.
 */
export async function getRemainingSeconds(userId: string): Promise<number> {
  const [row] = await sql`SELECT credits FROM users WHERE id = ${userId}`;
  const credits: number = row?.credits ?? 0;
  return Math.floor(credits / DEFAULT_CREDITS_PER_MINUTE) * 60;
}
