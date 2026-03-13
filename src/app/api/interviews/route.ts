import sql from "@/lib/db";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY! });

// Deepseek only categorizes — VAPI handles questions and evaluation
const CATEGORIZATION_SCHEMA = z.object({
  role: z.string(),
  level: z.string(),
  type: z.string(),
  domain: z.string(),
  specialization: z.string(),
  tags: z.array(z.string()),
});

const DOMAIN_VALUES = "tech · finance · medicine · law · marketing · consulting · design · data · hr · humanities · social-sciences · stem · education · other";
const TYPE_VALUES = "behavioral · technical · mixed · case-study · architectural · academic-discussion";
const LEVEL_VALUES = "junior · mid · senior · lead · student · graduate · phd · professor";

async function categorizeAndSave(
  interviewId: string,
  systemPrompt: string,
  transcript: string,
  userId: string,
): Promise<void> {
  const [existing] = await sql`
    SELECT
      array_agg(DISTINCT role)           FILTER (WHERE role IS NOT NULL)           AS roles,
      array_agg(DISTINCT domain)         FILTER (WHERE domain IS NOT NULL)         AS domains,
      array_agg(DISTINCT specialization) FILTER (WHERE specialization IS NOT NULL) AS specializations,
      (SELECT array_agg(DISTINCT t) FROM (SELECT unnest(tags) AS t FROM interviews WHERE user_id = ${userId}) sub) AS tags
    FROM interviews WHERE user_id = ${userId}
  `;

  const existingRoles = (existing?.roles ?? []).join(", ") || "none";
  const existingDomains = (existing?.domains ?? []).join(", ") || "none";
  const existingSpecs = (existing?.specializations ?? []).join(", ") || "none";
  const existingTags = (existing?.tags ?? []).join(", ") || "none";

  const { object } = await generateObject({
    model: deepseek("deepseek-chat"),
    schema: CATEGORIZATION_SCHEMA,
    system: `You are an interview categorizer. Given an interview system prompt and transcript, assign clean consistent category values.

Allowed values:
- domain: ${DOMAIN_VALUES}
- type: ${TYPE_VALUES}
- level: ${LEVEL_VALUES}

Reference examples (style/format guidance):
- roles: React developer, marketing manager, cardiologist, financial analyst, economics PhD student, English literature professor
- domains: tech, finance, medicine, humanities
- specializations: animations, interventional, M&A, SEO, game theory, romanticism
- tags: ["React","TypeScript"], ["DCF","LBO"], ["Keats","Shelley"], ["TensorFlow","PyTorch"], ["IFRS","valuation"]

This user's existing DB values (prefer reusing if semantically equivalent — consistency matters):
- roles: ${existingRoles}
- domains: ${existingDomains}
- specializations: ${existingSpecs}
- tags: ${existingTags}

Rules:
- role: job title or academic role ONLY, no seniority prefix. E.g. "senior React developer" → "React developer".
- level: pick from allowed values, default to "mid" if unclear.
- type: pick from allowed values, default to "mixed" if unclear.
- domain: pick from allowed values.
- specialization: 1-3 words, must NOT repeat role. Empty string if nothing specific.
- tags: 1-3 items explicitly mentioned in the transcript or system prompt (stack, tools, authors, entities, frameworks, concepts). ONLY include what was directly named — never infer related items (e.g. if "CSS" and "Framer Motion" were mentioned, do NOT add "TypeScript" just because it is commonly used with React). Must NOT duplicate information already captured in role/level/type/domain/specialization. Prefer reusing existing tags. Empty array if nothing distinctive was explicitly named.`,
    prompt: `System prompt:\n${systemPrompt}\n\nTranscript:\n${transcript}`,
  });

  await sql`
    UPDATE interviews SET
      role           = ${object.role},
      level          = ${object.level},
      type           = ${object.type},
      domain         = ${object.domain},
      specialization = ${object.specialization || null},
      tags           = ${object.tags}
    WHERE id = ${interviewId}
  `;
}

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
      SELECT user_id, title, system_prompt FROM interview_sessions
      WHERE call_id = ${callId}
        AND created_at > NOW() - INTERVAL '4 hours'
    `;
    if (!session) throw new Error(`No session found for call_id: ${callId}`);
    const userId: string = session.user_id;
    const sessionTitle: string | null = session.title ?? null;
    const systemPrompt: string = session.system_prompt ?? "";

    const toolCall = body.message.toolCallList[0];
    toolCallId = toolCall.id;

    const rawArgs = toolCall.function.arguments;
    const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

    const transcript: string = typeof args.transcript === "string" ? args.transcript.trim() : "";
    const questions: string[] = Array.isArray(args.questions) ? args.questions : [];
    const evaluation = args.evaluation ?? null;

    console.log("VAPI save_interview — questions:", questions.length, "transcript length:", transcript.length);

    // Save immediately with questions and evaluation from VAPI — guarantees no data loss
    const [saved] = await sql`
      INSERT INTO interviews (user_id, title, questions, data, finalized)
      VALUES (
        ${userId},
        ${sessionTitle},
        ${questions},
        ${JSON.stringify({ evaluation, transcript })},
        TRUE
      )
      RETURNING id
    `;

    // Categorize async (role, level, type, domain, specialization, tags) — does not block VAPI response
    categorizeAndSave(saved.id, systemPrompt, transcript, userId)
      .catch((err) => console.error("[categorizeAndSave] Failed, raw data preserved:", err));

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
