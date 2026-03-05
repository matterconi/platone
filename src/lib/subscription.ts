import sql from "@/lib/db";

// Minutes per plan per billing period
export const PLAN_LIMITS_MINUTES: Record<string, number> = {
  casual:  45,
  regular: 90,
  pro:     180,
};

/**
 * Returns the start of the current billing period given the subscription start date.
 * Rolling: advances by calendar months from starts_at until the next advance would exceed now.
 */
export function getCurrentPeriodStart(startsAt: Date): Date {
  const now = new Date();
  const result = new Date(startsAt);
  while (true) {
    const next = new Date(result);
    next.setMonth(next.getMonth() + 1);
    if (next > now) break;
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}

export async function getUserAccess(userId: string): Promise<UserAccess> {
  const rows = await sql`
    SELECT
      u.trial_used,
      s.plan,
      s.status,
      s.starts_at,
      s.ends_at
    FROM users u
    LEFT JOIN subscriptions s
      ON s.user_id = u.id
      AND s.status = 'active'
      AND (s.ends_at IS NULL OR s.ends_at > NOW())
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return { hasActiveSubscription: false, plan: null, trialUsed: false };

  return {
    hasActiveSubscription: !!row.plan,
    plan: row.plan ?? null,
    trialUsed: row.trial_used ?? false,
    periodStart: row.starts_at ? getCurrentPeriodStart(new Date(row.starts_at)) : null,
  };
}

/**
 * Returns seconds remaining in the current billing period for the user.
 * Returns Infinity for unknown plans (fail-open).
 */
export async function getRemainingSeconds(
  userId: string,
  plan: string,
  periodStart: Date,
): Promise<number> {
  const limitMinutes = PLAN_LIMITS_MINUTES[plan];
  if (limitMinutes === undefined) return Infinity;

  const [row] = await sql`
    SELECT COALESCE(SUM(duration_seconds), 0)::int AS used_seconds
    FROM usage_logs
    WHERE user_id = ${userId}
      AND recorded_at >= ${periodStart}
  `;

  const usedSeconds: number = row?.used_seconds ?? 0;
  const limitSeconds = limitMinutes * 60;
  return Math.max(0, limitSeconds - usedSeconds);
}
