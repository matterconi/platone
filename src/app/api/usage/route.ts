import { auth } from "@clerk/nextjs/server";
import { getUserAccess } from "@/lib/subscription";
import { DEFAULT_CREDITS_PER_MINUTE } from "@/lib/credits";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const access = await getUserAccess(userId);

  if (!access.hasActiveSubscription || !access.plan) {
    return Response.json({ plan: null, credits: 0, remainingMinutes: 0 });
  }

  return Response.json({
    plan: access.plan,
    credits: access.credits,
    remainingMinutes: Math.floor(access.credits / DEFAULT_CREDITS_PER_MINUTE),
  });
}
