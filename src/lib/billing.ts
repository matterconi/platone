import sql from "@/lib/db";

export async function applyTransaction(
  userId: string,
  customerId: string,
  plan: string,
  credits: number,
  subscriptionId: string
) {
  await sql`
    UPDATE users
    SET paddle_customer_id = ${customerId}, credits = credits + ${credits}
    WHERE id = ${userId}
  `;
  await sql`
    INSERT INTO subscriptions (user_id, plan, status, paddle_subscription_id, last_paid_at)
    VALUES (${userId}, ${plan}, ${"active"}, ${subscriptionId}, NOW())
    ON CONFLICT (paddle_subscription_id)
    DO UPDATE SET plan = ${plan}, status = ${"active"}, last_paid_at = NOW(), next_plan = NULL
  `;
}

export async function scheduleCancel(subscriptionId: string) {
  await sql`
    UPDATE subscriptions
    SET next_plan = ${"cancelled"}
    WHERE paddle_subscription_id = ${subscriptionId}
  `;
}

export async function scheduleDowngrade(subscriptionId: string, nextPlan: string) {
  await sql`
    UPDATE subscriptions
    SET next_plan = ${nextPlan}
    WHERE paddle_subscription_id = ${subscriptionId}
    AND plan != ${nextPlan}
  `;
}

export async function cancelSubscription(subscriptionId: string) {
  await sql`
    UPDATE subscriptions
    SET status = ${"cancelled"}
    WHERE paddle_subscription_id = ${subscriptionId}
  `;
  await sql`
    UPDATE users SET credits = 0
    WHERE id = (SELECT user_id FROM subscriptions WHERE paddle_subscription_id = ${subscriptionId})
  `;
}
