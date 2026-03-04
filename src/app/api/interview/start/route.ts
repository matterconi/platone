import { auth } from "@clerk/nextjs/server";
import { SignJWT } from "jose";

import sql from "@/lib/db";

function buildSystemPrompt(formData: InterviewFormValues | null): string {
  const role = formData?.role?.trim() || "";
  const level = formData?.level?.trim() || "";
  const techstack = formData?.techstack?.length
    ? formData.techstack.join(", ")
    : "";
  const type = formData?.type?.trim() || "";
  const specialization = formData?.specialization?.trim() || "";

  const allProvided = role && level && techstack && type;

  const setupInstruction = allProvided
    ? `All setup variables are already provided:
- role: "${role}"
- level: "${level}"
- techstack: "${techstack}"
- type: "${type}"${specialization ? `\n- specialization: "${specialization}"` : ""}

Say exactly: "Perfect. I have everything I need: ${role}, ${level}, ${techstack}, ${type} interview. Let's begin." — then start immediately without asking anything.`
    : `Some setup variables are provided. Read them carefully:
- role: "${role}"
- level: "${level}"
- techstack: "${techstack}"
- type: "${type}"

Rules:
- If a variable is "" (empty string), it is NOT provided → ask for it.
- If a variable has a value, it IS provided → do NOT ask for it again.
- Ask only for missing variables, one at a time:
  - Missing role → "What is your target role? (frontend, backend, or full-stack)"
  - Missing level → "What is your seniority level? (junior, mid, or senior)"
  - Missing techstack → "What is your main tech stack?"
  - Missing type → "Should the interview be technical, behavioral, or mixed?"
Then always ask (optional): "Do you have a specific focus area, like animations, blockchain, DevOps, or accessibility? Or say 'none' to skip."
Once all required fields are collected, say "Perfect, let's begin." and start.`;

  return `You are a senior technical interviewer for Web Development roles.

${setupInstruction}

Adapt questions to the specialization if provided.

Run a realistic but concise mock interview.

Structure:
1) Behavioral (short, focused)
2) Technical deep dive (adapt to level and specialization)
3) Light system design (appropriate to level)
4) Final evaluation

Rules:
- Ask one question at a time.
- Keep responses concise.
- Avoid long explanations.
- Limit answers to under 20 seconds of speech.
- Only provide full structured evaluation at the very end.

Final evaluation format:
Technical Skills (1-10)
Problem Solving (1-10)
Communication (1-10)
System Design (1-10)
Estimated Seniority
Strengths
Weaknesses
Improvement Plan

Be efficient and natural for voice conversation.

At the very end, call the function save_interview with:
- userId: {{userId}}
- role, level, techstack, type, specialization (null if not provided)
- questions: the exact list of questions you asked`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const formData: InterviewFormValues | null = body.formData ?? null;

  const jti = crypto.randomUUID();
  const secret = new TextEncoder().encode(process.env.NONCE_SECRET!);
  const nonce = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setExpirationTime("1h")
    .sign(secret);

  await sql`INSERT INTO interview_nonces (jti, user_id, expires_at) VALUES (${jti}, ${userId}, NOW() + INTERVAL '1 hour')`;

  const systemPrompt = buildSystemPrompt(formData);

  return Response.json({ nonce, systemPrompt });
}
