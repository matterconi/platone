import { auth } from "@clerk/nextjs/server";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { SignJWT } from "jose";
import { z } from "zod";
import sql from "@/lib/db";
import { getUserAccess } from "@/lib/subscription";
import { getCreditsPerMinute } from "@/lib/credits";

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY! });

const resultSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  systemPrompt: z.string().optional(),
  duration: z.enum(["quick", "regular", "long"]).optional(),
  title: z.string().optional(),
});

const TRIAL_META_PROMPT = `You are an expert at writing system prompts for AI voice interviewers.

The user is on a FREE TRIAL — they get exactly one short demo interview.

From the user's message, extract the role (e.g. "frontend developer", "marketing manager", "cardiologist").
If the role is missing or unclear, instruct VAPI to ask for it at the very start of the call (one question only).

Generate a system prompt for a minimal demo interview with these strict rules:
- Ask EXACTLY 1 interview question, generic and appropriate for the role. Do NOT ask for level, specialization, type, or any other preference.
- Keep the question broad enough to apply to any level (e.g. "Tell me about a challenging situation you faced in your role and how you handled it.").
- After the user answers, give 2-3 sentences of warm, encouraging feedback.
- Then say: "This was your free demo interview. To unlock full sessions with detailed feedback and multiple questions, check out our plans."
- Immediately call save_interview with the collected data (role, the one question asked, and a brief evaluation).
- title: a short label like "Demo · [Role]" (max 40 chars).
- Output only the system prompt text, nothing else.`;

const META_PROMPT = `You are an expert at writing system prompts for AI voice interviewers.
You cover any professional domain: software engineering, finance, medicine, law, marketing, design, economics, and more.

From the user's message, extract what is provided among:
- role (e.g. developer, financial analyst, cardiologist)
- level (e.g. junior, mid, senior)
- domain (the broad professional field, e.g. web development, finance, medicine, law)
- specialization (the specific focus within the domain, e.g. frontend, animations, M&A, cardiology — always infer this even if not explicitly stated: e.g. "React developer" → "frontend / React", "cardiologist" → "cardiology", "M&A lawyer" → "M&A")
- interview type (e.g. technical, behavioral, mixed, case study)
- objective (e.g. job interview prep, academic, certification)
- duration (how long / how many questions: "quick" = 3 questions, "regular" = 5 questions, "long" = 7 questions — infer from context or default to "regular")
- title (a concise label for the interview, max 60 chars, combining the most distinctive elements: level + role + key specialization or focus. Examples: "Senior Frontend Developer · React/Next.js", "Cardiologist · Clinical Behavioral", "M&A Lawyer · Senior · Case Study". Omit redundant info, no level if already in role.)

Then:
- If the message describes an interview or job role (any field) → set valid: true and write a systemPrompt.
- If the message is empty or incomplete → set valid: true and write a systemPrompt that instructs VAPI to collect all missing context fields at the start of the call.
- If the message is off-topic or nonsensical (clearly not about an interview) → set valid: false and explain why in reason.

Rules for systemPrompt (only when valid: true):
- You are writing instructions for a voice AI called VAPI that will conduct the interview. Do NOT write the questions yourself.
- Start the system prompt by listing all context fields that ARE provided (role, level, domain, specialization, type, objective), so VAPI knows them upfront.
- Instruct VAPI to ask — one at a time, at the start of the call — only for the fields that are NOT provided.
- Once all context is collected, VAPI conducts a realistic mock interview adapted to that context.
- VAPI must ask one question at a time and keep every response under 20 seconds - 1 minute of speech.
- Adapt the interview structure to the domain and role (behavioral, technical/conceptual, case study or problem-solving if relevant, final evaluation).
- Vary the questions: sometimes ask classic interview questions, other times ask less common but equally valid ones (e.g. edge cases, trade-offs, real-world scenarios, architecture decisions, debugging situations, opinion-based questions). Explicitly instruct VAPI to randomize which specific topics to cover each session and to avoid always asking the same standard questions.
- Based on duration, ask exactly this many interview questions (excluding clarification questions at the start): quick = 3, regular = 5, long = 7. State this explicitly in the system prompt (e.g. "Ask exactly 5 interview questions.").
- At the very end, VAPI must NOT read the evaluation aloud. Instead, simply thank the candidate and inform them that their written feedback will be available shortly.
- VAPI must then immediately call the function save_interview with: all collected metadata (role, level, domain, specialization, type, objective, questions asked), a structured evaluation object containing: domainKnowledge (1-10), problemSolving (1-10), communication (1-10), estimatedSeniority, strengths (array of strings), weaknesses (array of strings), improvementPlan (array of strings), and an extras object with domain-specific metadata using ONLY these canonical keys:
  - tech/engineering: techstack (string[]), frameworks (string[])
  - medicine/healthcare: clinical_setting (string), procedures (string[])
  - law/legal: practice_area (string), jurisdiction (string)
  - finance/economics: asset_class (string), instruments (string[])
  - marketing/design: channels (string[]), tools (string[])
  - other domains: use the most relevant 1-2 keys in snake_case, string or string[] values only
  Rules for extras: max 3 keys, only the most distinctive information for the domain. Extras are complementary to the core fields — do not duplicate role, level, domain, or specialization. If the user provided many details, distill only what is most relevant and not already captured elsewhere. Keep values concise (short strings or short arrays). Omit extras entirely if nothing domain-specific was discussed.
- Be efficient and natural for voice conversation.
- Output only the system prompt text, nothing else.`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userMessage: string = body.userMessage ?? "";
  const mode: string = body.mode ?? "new";
  const assistantId: string | undefined = body.assistantId;
  const userName: string = body.userName ?? "";
  // Mode-specific variableValues (optional — VAPI asks for missing data during the call)
  const extraVariables: Record<string, string> = body.extraVariables ?? {};

  const access = await getUserAccess(userId);
  let isTrial = false;
  let maxDurationSeconds: number;

  if (access.hasActiveSubscription && access.plan) {
    // Subscribed user: compute max duration from actual credits and assistant rate
    const creditsPerMinute = getCreditsPerMinute(assistantId);
    const remainingSeconds = Math.floor(access.credits / creditsPerMinute) * 60;
    if (remainingSeconds < 60) {
      return Response.json({ error: "Hai esaurito i crediti del piano corrente." }, { status: 403 });
    }
    maxDurationSeconds = remainingSeconds;
  } else {
    // No active subscription: allow only one free trial
    if (access.trialUsed) {
      return Response.json({ error: "Il tuo trial gratuito è stato utilizzato. Scegli un piano per continuare." }, { status: 403 });
    }
    // Mark trial as used immediately to prevent concurrent starts
    await sql`UPDATE users SET trial_used = TRUE WHERE id = ${userId}`;
    isTrial = true;
    maxDurationSeconds = 300; // 5 min cap for trial
  }

  // Build systemPrompt and session metadata
  let systemPrompt: string;
  let duration: "quick" | "regular" | "long";
  let title: string | null;

  if (mode === "try-again" && extraVariables.questions) {
    // Retry: generate systemPrompt directly — no Deepseek needed
    const questions = JSON.parse(extraVariables.questions) as string[];
    const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    const contextLine = [extraVariables.level, extraVariables.role, extraVariables.type]
      .filter(Boolean).join(" · ");

    systemPrompt = `You are an expert AI voice interviewer conducting a retry practice session.
${contextLine ? `Context: ${contextLine}` : ""}${extraVariables.techstack ? `\nTech stack: ${extraVariables.techstack}` : ""}

The candidate wants to practice these ${questions.length} questions again:
${questionsList}

Conduct the session:
- Ask each question one at a time, in order.
- After the candidate answers, give 1-2 sentences of focused, encouraging feedback.
- Keep every response under 30 seconds of speech.
- After the last question and feedback, thank the candidate.
- Immediately call save_attempt with: the interviewId (${extraVariables.interviewId ?? ""}), a structured evaluation (domainKnowledge 1-10, problemSolving 1-10, communication 1-10, estimatedSeniority, strengths array, weaknesses array, improvementPlan array).`;

    const q = questions.length;
    duration = q <= 3 ? "quick" : q <= 5 ? "regular" : "long";
    title = extraVariables.role ? `Retry · ${extraVariables.role}` : "Retry";
  } else {
    // New or change-questions: use Deepseek to generate systemPrompt
    let deepseekUserMessage = userMessage;

    if (mode === "change-questions" && !userMessage) {
      // Reconstruct context as userMessage so Deepseek generates new questions for the same role
      const parts = [extraVariables.level, extraVariables.role].filter(Boolean).join(" ");
      deepseekUserMessage = [
        parts && `Voglio un'intervista${extraVariables.type ? ` ${extraVariables.type}` : ""} da ${parts}`,
        extraVariables.techstack && `con ${extraVariables.techstack}`,
        extraVariables.specialization,
      ].filter(Boolean).join(" ").trim();
    }

    let systemContent: string;
    if (isTrial) {
      systemContent = TRIAL_META_PROMPT;
    } else {
      const extrasRows = await sql`
        SELECT DISTINCT jsonb_object_keys(data->'extras') AS key
        FROM interviews
        WHERE user_id = ${userId} AND data->'extras' IS NOT NULL
      `.catch(() => []);
      const existingExtrasKeys = extrasRows.map((r) => (r as { key: string }).key);
      systemContent = existingExtrasKeys.length > 0
        ? `${META_PROMPT}\n\nExtras keys already used in this user's history (prefer reusing these for consistency): ${existingExtrasKeys.join(", ")}`
        : META_PROMPT;
    }

    const { object } = await generateObject({
      model: deepseek("deepseek-chat"),
      output: "object",
      schema: resultSchema,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: deepseekUserMessage || "" },
      ],
    });

    if (!object.valid) {
      return Response.json({ error: object.reason }, { status: 422 });
    }

    systemPrompt = object.systemPrompt ?? "";
    duration = object.duration ?? "regular";
    title = object.title ?? null;
  }

  // Build variableValues server-side (client never passes maxDurationSeconds to VAPI)
  const questionMap = { quick: 3, regular: 5, long: 7 };
  const numQuestions = questionMap[duration] ?? 5;

  const variableValues: Record<string, string> = {
    userName,
    numQuestions: String(numQuestions),
    ...extraVariables,
  };
  if (systemPrompt) variableValues.systemPrompt = systemPrompt;

  // Generate short-lived JWT for VAPI (replaces public key — never sent to client)
  const vapiSecret = new TextEncoder().encode(process.env.VAPI_PRIVATE_KEY!);
  const vapiToken = await new SignJWT({ orgId: process.env.VAPI_ORG_ID! })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(vapiSecret);

  // Create web call via VAPI REST API — maxDurationSeconds enforced server-side
  const resolvedAssistantId = assistantId ?? process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const vapiBody = {
    assistantId: resolvedAssistantId,
    assistantOverrides: { maxDurationSeconds, variableValues },
  };

  const vapiRes = await fetch("https://api.vapi.ai/call/web", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${vapiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(vapiBody),
  });

  if (!vapiRes.ok) {
    console.error("VAPI call creation failed:", await vapiRes.text());
    return Response.json({ error: "Impossibile avviare la call." }, { status: 502 });
  }

  const vapiCall = await vapiRes.json();
  const callId: string = vapiCall.id;
  const webCallUrl: string = vapiCall.webCallUrl ?? vapiCall.transport?.callUrl;

  // Register session in DB (replaces the separate register-call step)
  await sql`
    INSERT INTO interview_sessions (call_id, user_id, title)
    VALUES (${callId}, ${userId}, ${title})
    ON CONFLICT (call_id) DO NOTHING
  `;

  return Response.json({
    webCall: { id: callId, webCallUrl },
    duration,
    title,
  });
}
