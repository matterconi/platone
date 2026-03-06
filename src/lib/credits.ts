// Credits awarded per plan (monthly subscription)
export const PLAN_CREDITS: Record<string, number> = {
  casual: 100,
  regular: 200,
  pro: 350,
};

// Credits consumed per minute of interview, keyed by VAPI assistant ID.
// Add new entries here when you introduce models with different costs.
export const ASSISTANT_CREDITS_PER_MINUTE: Record<string, number> = {
  [process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID ?? ""]: 2,
};

// Default rate used when assistant ID is not found in the map above.
export const DEFAULT_CREDITS_PER_MINUTE = 2;

export function getCreditsPerMinute(assistantId?: string): number {
  if (!assistantId) return DEFAULT_CREDITS_PER_MINUTE;
  return ASSISTANT_CREDITS_PER_MINUTE[assistantId] ?? DEFAULT_CREDITS_PER_MINUTE;
}
