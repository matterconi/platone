import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateObject } from "ai";
import { z } from "zod";

import sql from "@/lib/db";

const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY! });

const resultSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
  systemPrompt: z.string().optional(),
  duration: z.enum(["quick", "regular", "long"]).optional(),
});

const META_PROMPT = `You are an expert at writing system prompts for AI voice interviewers.
You cover any professional domain: software engineering, finance, medicine, law, marketing, design, economics, and more.

From the user's message, extract what is provided among:
- role (e.g. developer, financial analyst, cardiologist)
- level (e.g. junior, mid, senior)
- domain (the broad professional field, e.g. web development, finance, medicine, law)
- specialization (the specific focus within the domain, e.g. frontend, animations, M&A, cardiology)
- interview type (e.g. technical, behavioral, mixed, case study)
- objective (e.g. job interview prep, academic, certification)
- duration (how long / how many questions: "quick" = 3 questions, "regular" = 5 questions, "long" = 7 questions — infer from context or default to "regular")

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
- VAPI must then immediately call the function save_interview with: nonce: {{nonce}}, userId: {{userId}}, all collected metadata (role, level, domain, specialization, type, objective, questions asked), and a structured evaluation object containing: domainKnowledge (1-10), problemSolving (1-10), communication (1-10), estimatedSeniority, strengths (array of strings), weaknesses (array of strings), improvementPlan (array of strings).
- Be efficient and natural for voice conversation.
- Output only the system prompt text, nothing else.`;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userMessage: string = body.userMessage ?? "";

  const jti = crypto.randomUUID();
  const secret = new TextEncoder().encode(process.env.NONCE_SECRET!);
  const nonce = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setExpirationTime("1h")
    .sign(secret);

  await sql`INSERT INTO interview_nonces (jti, user_id, expires_at) VALUES (${jti}, ${userId}, NOW() + INTERVAL '1 hour')`;

  const { object } = await generateObject({
    model: deepseek("deepseek-chat"),
    output: "object",
    schema: resultSchema,
    messages: [
      { role: "system", content: META_PROMPT },
      { role: "user", content: userMessage || "" },
    ],
  });

  if (!object.valid) {
    return Response.json({ error: object.reason }, { status: 422 });
  }

  return Response.json({ nonce, systemPrompt: object.systemPrompt, duration: object.duration ?? "regular" });
}
