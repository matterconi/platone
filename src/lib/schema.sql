CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  type TEXT NOT NULL,
  level TEXT NOT NULL,
  techstack TEXT[] NOT NULL,
  specialization TEXT,
  questions TEXT[] NOT NULL,
  cover_image TEXT,
  finalized BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_nonces (
  jti TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Make interview fields nullable and add raw data column
ALTER TABLE interviews
  ALTER COLUMN role DROP NOT NULL,
  ALTER COLUMN type DROP NOT NULL,
  ALTER COLUMN level DROP NOT NULL,
  ALTER COLUMN techstack DROP NOT NULL,
  ALTER COLUMN questions DROP NOT NULL;

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS data JSONB;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  profession TEXT NOT NULL,
  level TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  interview_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('casual', 'regular', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Binds a VAPI call_id to a verified Clerk user_id.
-- Populated by /api/interview/register-call after vapi.start() returns.
-- Records older than 4 hours can be safely deleted.
CREATE TABLE IF NOT EXISTS interview_sessions (
  call_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interviews ADD COLUMN IF NOT EXISTS title TEXT;

-- Duration tracking on sessions
ALTER TABLE interview_sessions
  ADD COLUMN IF NOT EXISTS duration_seconds INT,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Usage log per billing (one row per call, UNIQUE on call_id prevents double-counting)
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  call_id TEXT NOT NULL UNIQUE,
  duration_seconds INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usage_logs_user_recorded ON usage_logs (user_id, recorded_at);

-- Paddle payment integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT UNIQUE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE;

-- Credit system
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 0;

-- Refund eligibility tracking: timestamp of the last successful payment
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_paid_at TIMESTAMPTZ;

-- Scheduled plan change (e.g. downgrade or cancellation at next renewal)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_plan TEXT CHECK (next_plan IN ('casual', 'regular', 'pro', 'cancelled'));
