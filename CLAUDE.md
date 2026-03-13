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

## Frontend Tasks — Skill obbligatoria

Whenever the user asks to **create, redesign, or add** a UI component, section, or page, you MUST invoke the `frontend-design` skill BEFORE writing any code. This is a hard requirement — do not skip it.

Trigger phrases: "crea un componente", "aggiungi una sezione", "redesigna", "fai il frontend di", "crea la UI per", "nuova pagina", "nuovo componente".

After the skill completes, ensure the output respects the design system below.

---

## Frontend Design System

### Colors (CSS variables — `src/app/globals.css`)
- `--accent`: `#b8ff00` (lime) — brand color, CTAs, glows, highlights → Tailwind: `text-accent`, `bg-accent`
- `--accent` hover: `#ccff22`
- `--fg`: `#f0ede6` (off-white) — main text → Tailwind: `text-fg`
- `--muted`: `rgba(240, 237, 230, 0.45)` — secondary text
- `--border` / `--border-bright`: `rgba(240,237,230, 0.07/0.14)`
- Background: `#07070a` (base), `#0f0f13` (cards) — **hardcoded, not via var**
- **Dark-first design** — no light mode
- **ALWAYS** use canonical Tailwind 4 classes: `text-accent` not `text-[#b8ff00]`, `text-fg` not `text-[#f0ede6]`, `bg-linear-to-b` not `bg-gradient-to-b`, `m-px` not `m-[1px]`

### Typography
- Headlines: **Syne** (`font-display`), weights 700–800, `letter-spacing: -0.025em`
- Body: **Plus Jakarta Sans**, weights 300–800
- Hero: `text-6xl sm:text-7xl`, `leading-[0.93]`
- Section titles: `text-4xl md:text-5xl`
- Labels/micro: `text-xs` / `text-[11px]`

### Layout
- Container: `max-w-5xl`, horizontal padding `px-6`
- Sections: `py-10 md:py-20`
- Breakpoints: mobile-first → `sm:640` `md:768` `lg:1024`

### Animations
- **Framer Motion** standard `fadeUp` variant: `{ opacity:0, y:24, filter:"blur(6px)" }` → visible; easing `[0.22,1,0.36,1]`
- Use `whileInView` + stagger children via container variant
- Wrap sections in `FadeInView` component
- CSS keyframes: marquee (`38s/42s linear`), waveform `scaleY`, pulse dot `2.4s`

### Component conventions
- Always use `cn()` from `@/lib/utils` for conditional Tailwind classes — never raw string concatenation
- No inline `style` objects when Tailwind handles it
- Cards: bg `#0f0f13`, gradient border + box-shadow glow on hover
- Primary buttons: lime bg, dark text, hover → `#ccff22`
- Dynamic agent colors via `--agent-color` CSS variable
- Marquee sections: mask gradient on edges, pause on hover

### UI libraries
- Shadcn (`src/components/ui/`), Icons: Lucide, Carousel: Swiper, Toasts: Sonner, Charts: Recharts, Primitives: Radix UI

---

## Conventions

- Use Italian for user-facing text (UI labels, error messages shown to users)
- Use English for code, variable names, comments, and internal logs
- Path alias: `@/` maps to `src/`
- Constants (tech logos, dummy data): `constants/index.ts`
- Never hardcode credentials — use `process.env.*` and fail fast if missing
