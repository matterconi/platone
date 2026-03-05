import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";
import { getUserAccess, getRemainingSeconds, PLAN_LIMITS_MINUTES } from "@/lib/subscription";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getUserAccess(userId);

  if (!access.hasActiveSubscription || !access.plan || !access.periodStart) {
    return Response.json({
      plan: null,
      limitMinutes: 0,
      usedMinutes: 0,
      remainingMinutes: 0,
      periodStart: null,
      periodEnd: null,
    });
  }

  const remainingSeconds = await getRemainingSeconds(userId, access.plan, access.periodStart);
  const limitMinutes = PLAN_LIMITS_MINUTES[access.plan] ?? 0;
  const usedSeconds = limitMinutes * 60 - remainingSeconds;

  const periodEnd = new Date(access.periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return Response.json({
    plan: access.plan,
    limitMinutes,
    usedMinutes: Math.ceil(usedSeconds / 60),
    remainingMinutes: Math.floor(remainingSeconds / 60),
    periodStart: access.periodStart,
    periodEnd,
  });
}
