import sql from "@/lib/db";
import { NextRequest } from "next/server";
import { getCreditsPerMinute } from "@/lib/credits";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-vapi-secret");
  if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Only process end-of-call-report events
  if (body.message?.type !== "end-of-call-report") {
    return Response.json({ received: true });
  }

  const callId: string | undefined = body.message.call?.id;
  const assistantId: string | undefined = body.message.call?.assistantId;
  const durationSeconds: number = Math.round(body.message.durationSeconds ?? 0);

  if (!callId) return Response.json({ received: true });

  const [session] = await sql`
    SELECT user_id FROM interview_sessions
    WHERE call_id = ${callId}
  `;

  if (!session) {
    console.warn(`call-end: no session for call_id ${callId} — usage not recorded`);
    return Response.json({ received: true });
  }

  // Update session with actual duration
  await sql`
    UPDATE interview_sessions
    SET duration_seconds = ${durationSeconds}, ended_at = NOW()
    WHERE call_id = ${callId}
  `;

  // Insert usage log — ON CONFLICT prevents double-counting if VAPI retries
  const [inserted] = await sql`
    INSERT INTO usage_logs (user_id, call_id, duration_seconds)
    VALUES (${session.user_id}, ${callId}, ${durationSeconds})
    ON CONFLICT (call_id) DO NOTHING
    RETURNING id
  `;

  // Deduct credits only if this is a new log entry (not a VAPI retry)
  if (inserted) {
    const creditsPerMinute = getCreditsPerMinute(assistantId);
    const creditsToDeduct = Math.ceil(durationSeconds / 60) * creditsPerMinute;
    await sql`
      UPDATE users
      SET credits = GREATEST(0, credits - ${creditsToDeduct})
      WHERE id = ${session.user_id}
    `;
  }

  return Response.json({ received: true });
}
