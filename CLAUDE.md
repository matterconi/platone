# CLAUDE.md — InterSpeak Voice Interview Platform

## Tech Stack

- **Framework:** Next.js (App Router), React 19, TypeScript 5 strict
- **Auth:** Clerk (`@clerk/nextjs`) — use `auth()` server-side, `useAuth()` client-side
- **Voice AI:** VAPI (`@vapi-ai/web`) — voice interviews, webhook at `/api/interview/call-end`
- **LLM:** Vercel AI SDK + DeepSeek — system prompt generation only
- **Database:** PostgreSQL (Neon serverless) — raw SQL via `sql` from `@/lib/db`
- **Billing:** Paddle — subscriptions, credits per minute (2 credits/min default)
- **Styling:** TailwindCSS 4, `cn()` utility from `@/lib/utils`
- **UI components:** Radix UI + Shadcn in `src/components/ui/`
- **Testing:** Vitest 3, Node environment, `vi.mock` for SQL
- **Validation:** Zod + React Hook Form

---

## Architecture Rules

### API Routes
- Every route lives in `src/app/api/<domain>/route.ts`
- Export named functions: `GET`, `POST`, `PATCH`, `DELETE`
- Always validate auth with `auth()` at the top, return 401 if no userId
- Return `NextResponse.json({ error: "..." }, { status: N })` for errors
- Use Zod schemas from `@/lib/validation` for body validation
- Log meaningful errors with `console.error` before returning 500

```ts
// Minimal route pattern
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await sql`SELECT ... FROM ... WHERE user_id = ${userId}`;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[api/domain] GET:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

### Database
- **No ORM** — use raw SQL with tagged template literals: `sql\`SELECT ...\``
- Always use parameterized queries (template literals handle this automatically)
- Never interpolate values directly with string concatenation
- Keep DB logic in lib functions or inline in routes — no separate repository layer
- Schema source of truth: `src/lib/schema.sql`
- Key tables: `users`, `interviews`, `interview_attempts`, `subscriptions`, `usage_logs`, `user_profiles`

### Components
- Client components: add `"use client"` at top, use hooks
- Server components: default (no directive), use `async/await` directly
- Prefer server components for data fetching, client components for interactivity
- Style with Tailwind classes + `cn()` for conditional classes
- Never inline style objects when Tailwind can do it

### TypeScript
- Strict mode is on — no `any`, no `@ts-ignore` unless absolutely necessary and commented
- Shared types live in `types/index.d.ts`
- API response types should be defined in `types/index.d.ts` or co-located
- Use `interface` for object shapes, `type` for unions/aliases

---

## Testing Rules

- Test files: `src/app/api/<domain>/__tests__/<name>.test.ts` or `src/lib/__tests__/<name>.test.ts`
- Always mock `@/lib/db` with `vi.mock('@/lib/db', () => ({ sql: vi.fn() }))`
- Always mock `@clerk/nextjs/server` to control `auth()` return value
- Always mock `next/server` to return a real `NextResponse`
- Test happy path + 401 unauthenticated + 500 error path at minimum
- Run tests: `npm test` | watch: `npm run test:watch` | coverage: `npm run test:coverage`

```ts
// Minimal test pattern
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

const mockSql = vi.fn();
vi.mock("@/lib/db", () => ({ sql: mockSql }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";

describe("GET /api/domain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
```

---

## Common Commands

```bash
npm run dev          # Start dev server
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript type check
npm test             # Run all tests once
npm run test:watch   # Watch mode
npm run test:coverage
```

---

## Key Business Rules

- **Credits:** 2 credits per minute of interview; deducted at call-end via `/api/interview/call-end`
- **Trial:** Each user gets 1 free demo interview (`trial_used` flag in `users` table)
- **Plans:** Casual (100), Regular (200), Pro (350) credits/month — renewed via Paddle webhook
- **Refund eligibility:** checked server-side in `/api/admin/refund-eligible` (admin) and planned user endpoint
- **Webhook security:** Clerk uses Svix signature, VAPI uses JWT nonce (`@/lib/nonce`), Paddle uses its own SDK

---

## Conventions

- Use Italian for user-facing text (UI labels, error messages shown to users)
- Use English for code, variable names, comments, and internal logs
- Path alias: `@/` maps to `src/`
- Constants (tech logos, dummy data): `constants/index.ts`
- Never hardcode credentials — use `process.env.*` and fail fast if missing
