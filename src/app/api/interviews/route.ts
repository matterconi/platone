import sql from "@/lib/db";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ success: false, error: "Missing userId" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const role = searchParams.get("role") ?? "";
  const type = searchParams.get("type") ?? "";
  const specialization = searchParams.get("specialization") ?? "";
  const tech = searchParams.get("techstack") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);
  const offset = Math.max(parseInt(searchParams.get("offset") ?? "0"), 0);

  try {
    const rows = await sql`
      WITH filtered AS (
        SELECT * FROM interviews
        WHERE user_id = ${userId}
          AND (${role} = '' OR role ILIKE ${"%" + role + "%"})
          AND (${type} = '' OR type = ${type})
          AND (${specialization} = '' OR specialization = ${specialization})
          AND (${tech} = '' OR ${tech} = ANY(techstack))
      )
      SELECT *, (COUNT(*) OVER())::int AS total_count
      FROM filtered
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return Response.json({
      success: true,
      data: rows,
      total: rows[0]?.total_count ?? 0,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error: "Failed to fetch interviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let toolCallId: string | undefined;

  try {
    const secret = request.headers.get("x-vapi-secret");
    if (secret !== process.env.VAPI_WEBHOOK_SECRET) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("VAPI webhook raw body:", JSON.stringify(body, null, 2));

    const callId: string = body.message.call?.id;
    if (!callId) throw new Error("Missing call.id");

    const [session] = await sql`
      SELECT user_id FROM interview_sessions
      WHERE call_id = ${callId}
        AND created_at > NOW() - INTERVAL '4 hours'
    `;
    if (!session) throw new Error(`No session found for call_id: ${callId}`);
    const userId: string = session.user_id;

    const toolCall = body.message.toolCallList[0];
    toolCallId = toolCall.id;

    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    console.log("VAPI save_interview args:", JSON.stringify(args, null, 2));

    const data = {
      role:           args.role           ?? null,
      level:          args.level          ?? null,
      domain:         args.domain         ?? null,
      specialization: args.specialization ?? null,
      type:           args.type           ?? null,
      objective:      args.objective      ?? null,
      questions:      args.questions      ?? [],
      evaluation:     args.evaluation     ?? null,
    };

    await sql`
      INSERT INTO interviews (user_id, data, finalized)
      VALUES (${userId}, ${JSON.stringify(data)}, TRUE)
    `;

    return Response.json({
      results: [{ toolCallId, result: "Interview saved successfully" }],
    });
  } catch (error) {
    console.error("Failed to save interview:", error);
    return Response.json({
      results: [{ toolCallId, result: "Failed to save interview" }],
    }, { status: 500 });
  }
}
