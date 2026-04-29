import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

// ── POST /api/admin/setup-db ───────────────────────────────────────────────────
// Admin-only route that creates required Supabase tables.
// Protected by server-side session check (not spoofable headers).

const SETUP_SQL = `
-- User subscriptions (server-side, not bypassable)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free',
  premium_until TIMESTAMPTZ,
  payment_id TEXT,
  razorpay_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User progress (synced across devices)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  total_xp INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  topics_completed INTEGER DEFAULT 0,
  quizzes_taken INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if table already exists (idempotent)
DO $$ BEGIN
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();
  ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Premium allowlist
CREATE TABLE IF NOT EXISTS premium_allowlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- App config (key-value store, replaces Redis)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  name TEXT,
  message TEXT NOT NULL,
  rating INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Authenticate via server-side session, not client-supplied headers
    const session = await auth();
    const sessionEmail = session?.user?.email;
    if (!isAdminEmail(sessionEmail)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Execute each CREATE TABLE statement individually via rpc or raw SQL.
    // Supabase JS does not expose a direct SQL executor on the client; we use
    // the postgrest rpc approach by calling pg functions — but the simplest
    // supported path is splitting and running via supabase.rpc if a helper
    // function exists. Since we control the schema, we use the REST API
    // exec_sql if available, otherwise we attempt individual table checks.

    // Split statements on double-newline boundaries and run each one.
    const statements = SETUP_SQL
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const errors: string[] = [];

    for (const sql of statements) {
      const { error } = await supabase.rpc("exec_sql", { query: sql + ";" });
      if (error) {
        // If exec_sql doesn't exist, fall through — we'll report it
        errors.push(`${error.message} [SQL: ${sql.slice(0, 60)}...]`);
      }
    }

    if (errors.length > 0) {
      // exec_sql RPC may not exist yet; return instructions
      return NextResponse.json({
        success: false,
        message:
          "exec_sql RPC not available. Run the SQL manually in the Supabase SQL Editor.",
        sql: SETUP_SQL,
        errors,
      });
    }

    return NextResponse.json({ success: true, message: "Database tables created successfully." });
  } catch (err) {
    console.error("[setup-db]", err);
    const message = err instanceof Error ? err.message : "Setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET — return the SQL so the admin can copy-paste it into Supabase SQL Editor
export async function GET(req: NextRequest) {
  // SECURITY: Authenticate via server-side session
  const session = await auth();
  const sessionEmail = session?.user?.email;
  if (!isAdminEmail(sessionEmail)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({ sql: SETUP_SQL });
}
