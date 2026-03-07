# Project Memory

## Project
**Intervoice** — AI voice interview coach. Next.js 14, Clerk auth, VAPI (voice AI), Deepseek (prompt generation), Neon Postgres, Vercel. Rename da "Platone" completato nel codice. Azioni manuali rimanenti: rinominare repo GitHub + progetto Vercel.

## Key Files
- [src/app/api/interview/start/route.ts](src/app/api/interview/start/route.ts) — generates systemPrompt via Deepseek, authenticates user via Clerk
- [src/components/Agent.tsx](src/components/Agent.tsx) — client component, calls VAPI
- [src/app/api/interviews/route.ts](src/app/api/interviews/route.ts) — VAPI webhook, saves interview to DB
- [src/app/api/attempts/route.ts](src/app/api/attempts/route.ts) — VAPI webhook, saves try-again attempts
- [src/lib/credits.ts](src/lib/credits.ts) — credit config: PLAN_CREDITS, ASSISTANT_CREDITS_PER_MINUTE, getCreditsPerMinute()
- [src/lib/subscription.ts](src/lib/subscription.ts) — getUserAccess(), getRemainingSeconds() (credit-based)
- [src/app/api/webhooks/paddle/route.ts](src/app/api/webhooks/paddle/route.ts) — Paddle webhook handler
- [src/app/api/admin/refund-eligible/route.ts](src/app/api/admin/refund-eligible/route.ts) — admin refund check

## Auth Architecture (current)
- Pre-call: Clerk `auth()` in start/route.ts authenticates user
- Webhook auth: `x-vapi-secret` header (set in VAPI dashboard per tool, verified against `VAPI_WEBHOOK_SECRET` env var)
- userId: passed as variableValue from Agent.tsx → VAPI → returned in webhook args (KNOWN FLAW: client-manipulable)

## Known Security Flaw + Next Task
userId passes through the client (Agent.tsx variableValues) → can be manipulated.
**Solution to implement**: use VAPI `call.id` as lookup key:
1. `start/route.ts` → after Clerk auth, save `{ callId: null, userId }` to DB, return a `sessionToken` (uuid)
2. `Agent.tsx` → call `vapi.start()` → VAPI SDK returns call object with `call.id` → POST to `/api/interview/register-call` with `{ sessionToken, callId }`
3. New endpoint `/api/interview/register-call` → update DB record: set `callId` where `sessionToken` matches
4. `interviews/route.ts` webhook → read `body.message.call.id` → lookup `userId` from DB → save interview

## VAPI Setup
- Assistant ID: `342c67c1-f5d3-4ed3-8b00-926e006749d1`
- Tool `save_interview`: `ad25eb8a-9f14-4fa3-954d-a0855ed23f46` → server: `platone-alpha.vercel.app/api/interviews`
- Tool `save_attempt`: `f40af0d0-dcbf-41f5-88f2-21a30818f592` → server: `platone-alpha.vercel.app/api/attempts`
- Both tools have `x-vapi-secret` header configured
- VAPI base system message should be: `{{systemPrompt}}\n\nUser ID: {{userId}}`

## VAPI Variable Substitution Gotcha
VAPI does ONE substitution pass. `{{variables}}` inside the value of another variable are NOT substituted (double-substitution doesn't work). Always pass variables as top-level variableValues, not nested inside systemPrompt text.

## Payments — Paddle (Merchant of Record)
Chose Paddle over Stripe: no P.IVA required, handles EU VAT/tax compliance, pays out net.

### Plans & Prices (USD, monthly subscription)
| Plan | Credits/month | Price | Paddle Price ID |
|------|-------------|-------|-----------------|
| Casual | 100 | $9.90 | pri_01kk1pndq89nmbytffssa8sejw |
| Regular | 200 | $14.90 | pri_01kk1pqm2pz7sq1z47ed04gqc2 |
| Pro | 350 | $24.99 | pri_01kk1ptvd4ky1wtrn44awc72cv |

### Credit System
- 1 min = 2 credits (DEFAULT_CREDITS_PER_MINUTE, configurable per assistant in credits.ts)
- Credits accumulate (never reset) — upgrade adds new plan credits on top of remaining
- Deducted at end of call via call-end webhook: `Math.ceil(durationSeconds / 60) * creditsPerMinute`
- Credits added on `transaction.completed` webhook (every payment incl. renewals)

### Upgrade/Downgrade Policy
- Upgrade: immediate (Paddle prorates, transaction.completed fires, credits added)
- Downgrade: at next renewal (Paddle default behavior, no code needed)
- No immediate downgrade to prevent daily abuse

### Refund Policy
- Eligible only if no `interview_sessions` row with `created_at > last_paid_at`
- Check via `GET /api/admin/refund-eligible?userId=xxx` (requires ADMIN_USER_IDS env var)
- Manual process: check eligibility → go to Paddle dashboard → process refund manually
- `last_paid_at` stored on `subscriptions` table, updated on every `transaction.completed`

### Webhook Events Handled
- `transaction.completed` → +credits su users, upsert subscription (plan, status=active, last_paid_at, next_plan=NULL)
- `subscription.updated` → se scheduledChange.action='cancel' → next_plan='cancelled'; altrimenti se piano cambia → next_plan=nuovo piano
- `subscription.canceled` → status='cancelled'

### next_plan logic
- next_plan = 'casual'|'regular'|'pro' → downgrade schedulato al prossimo rinnovo
- next_plan = 'cancelled' → cancellazione schedulata
- next_plan = NULL → nessuna modifica schedulata
- TransactionCompleted resetta sempre next_plan = NULL (rinnovo avvenuto)

### DB Schema additions
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_paid_at TIMESTAMPTZ;
```

### Env Vars (all set in .env.local + Vercel)
- PADDLE_API_KEY
- NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
- PADDLE_WEBHOOK_SECRET
- NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox (→ production when live)
- ADMIN_USER_IDS=your_clerk_user_id (needed for refund-eligible API)

### Paddle Webhook URL
`https://platone-alpha.vercel.app/api/webhooks/paddle`

## Interview Features
- duration: quick=3q, regular=5q, long=7q — inferred by Deepseek from user message
- Evaluation saved silently to DB (not read aloud), structured: domainKnowledge, problemSolving, communication, estimatedSeniority, strengths[], weaknesses[], improvementPlan[]
- Question variety: Deepseek instructs VAPI to randomize topics each session

## Pending Tasks
- Add ADMIN_USER_IDS to Vercel env vars (tuo Clerk user ID)
- Switch NEXT_PUBLIC_PADDLE_ENVIRONMENT to `production` when going live
- Test end-to-end in sandbox prima del go-live (PricingSection checkout → webhook → crediti)
- Rinominare repo GitHub in "intervoice" (Settings → Repository name)
- Rinominare progetto Vercel + aggiornare URL webhook su Paddle e VAPI dashboard
- Automate refund processing (future)
- Secure userId via sessionToken + callId (see Known Security Flaw section)
