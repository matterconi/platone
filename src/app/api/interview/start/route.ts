import { auth } from "@clerk/nextjs/server";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";
import sql from "@/lib/db";
import { getUserAccess, getRemainingSeconds } from "@/lib/subscription";

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

  const access = await getUserAccess(userId);
  let isTrial = false;

  if (access.hasActiveSubscription && access.plan && access.periodStart) {
    // Subscribed user: check remaining minutes
    const remaining = await getRemainingSeconds(userId, access.plan, access.periodStart);
    if (remaining < 60) {
      return Response.json({ error: "Hai esaurito i minuti del piano corrente." }, { status: 403 });
    }
  } else {
    // No active subscription: allow only one free trial
    if (access.trialUsed) {
      return Response.json({ error: "Il tuo trial gratuito è stato utilizzato. Scegli un piano per continuare." }, { status: 403 });
    }
    // Mark trial as used immediately to prevent concurrent starts
    await sql`UPDATE users SET trial_used = TRUE WHERE id = ${userId}`;
    isTrial = true;
  }

  const body = await req.json().catch(() => ({}));
  const userMessage: string = body.userMessage ?? "";

  // Trial: use simplified prompt, skip extras query
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
      { role: "user", content: userMessage || "" },
    ],
  });

  if (!object.valid) {
    return Response.json({ error: object.reason }, { status: 422 });
  }

  return Response.json({
    systemPrompt: object.systemPrompt,
    duration: object.duration ?? "regular",
    title: object.title ?? null,
  });
}
