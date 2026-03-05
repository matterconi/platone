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
      SELECT user_id, title FROM interview_sessions
      WHERE call_id = ${callId}
        AND created_at > NOW() - INTERVAL '4 hours'
    `;
    if (!session) throw new Error(`No session found for call_id: ${callId}`);
    const userId: string = session.user_id;
    const sessionTitle: string | null = session.title ?? null;

    const toolCall = body.message.toolCallList[0];
    toolCallId = toolCall.id;

    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    console.log("VAPI save_interview args:", JSON.stringify(args, null, 2));

    const normalize = (s: unknown) =>
      typeof s === "string" ? s.trim().toLowerCase() : null;

    // Canonical key aliases: maps any LLM variant → canonical name
    const KEY_ALIASES: Record<string, string> = {
      tech_stack: "techstack", technologies: "techstack", stack: "techstack",
      framework: "frameworks",
      procedure: "procedures",
      instrument: "instruments",
      channel: "channels",
      tool: "tools",
    };

    const rawExtras = args.extras && typeof args.extras === "object" ? args.extras : null;
    const extras = rawExtras
      ? Object.fromEntries(
          Object.entries(rawExtras).map(([k, v]) => {
            const canonical = KEY_ALIASES[k.toLowerCase()] ?? k.toLowerCase();
            return [canonical, v];
          })
        )
      : null;

    const data = {
      title:          sessionTitle,
      role:           typeof args.role === "string" ? args.role.trim() : null,
      level:          normalize(args.level),
      domain:         typeof args.domain === "string" ? args.domain.trim() : null,
      specialization: typeof args.specialization === "string" ? args.specialization.trim() : null,
      type:           normalize(args.type),
      objective:      typeof args.objective === "string" ? args.objective.trim() : null,
      questions:      args.questions   ?? [],
      evaluation:     args.evaluation  ?? null,
      extras,
    };

    await sql`
      INSERT INTO interviews (user_id, title, role, type, level, specialization, questions, data, finalized)
      VALUES (
        ${userId},
        ${data.title},
        ${data.role},
        ${data.type},
        ${data.level},
        ${data.specialization},
        ${data.questions as string[]},
        ${JSON.stringify(data)},
        TRUE
      )
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
