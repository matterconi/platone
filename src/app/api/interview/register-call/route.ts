import { auth } from "@clerk/nextjs/server";
import sql from "@/lib/db";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { callId, title } = await req.json().catch(() => ({}));
  if (!callId) return Response.json({ error: "Missing callId" }, { status: 400 });

  await sql`
    INSERT INTO interview_sessions (call_id, user_id, title)
    VALUES (${callId}, ${userId}, ${title ?? null})
    ON CONFLICT (call_id) DO NOTHING
  `;

  return Response.json({ success: true });
}
