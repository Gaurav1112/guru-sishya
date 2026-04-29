import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Supabase leaderboard sync (optional) ─────────────────────────────────────
// Only works when NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
// Stores weekly XP entries in a `leaderboard_entries` table. If Supabase is not
// configured, returns a 501 with a helpful message.
//
// Table schema (create in Supabase dashboard):
//   CREATE TABLE leaderboard_entries (
//     id          BIGSERIAL PRIMARY KEY,
//     display_name TEXT NOT NULL,
//     weekly_xp   INTEGER NOT NULL DEFAULT 0,
//     league      TEXT NOT NULL DEFAULT 'Bronze',
//     week_id     TEXT NOT NULL,  -- "YYYY-WW"
//     updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
//   );
//   CREATE INDEX idx_leaderboard_week ON leaderboard_entries(week_id);
// ────────────────────────────────────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function getSupabaseAdmin() {
  const { getSupabaseAdmin: getSA } = await import("@/lib/supabase");
  return getSA();
}

function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (now.getTime() - startOfYear.getTime()) / 86400000
  );
  const week = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-${String(week).padStart(2, "0")}`;
}

// ── POST: sync user's weekly XP ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // SECURITY: Require authentication to prevent unauthenticated leaderboard manipulation
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // SECURITY: Rate limit to prevent abuse
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(`leaderboard:${ip}`, 10, 60000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase not configured. AI-only leaderboard is active." },
      { status: 501 }
    );
  }

  try {
    const body = await req.json();
    const { displayName, weeklyXP, league } = body;

    if (!displayName || typeof weeklyXP !== "number") {
      return NextResponse.json(
        { error: "displayName and weeklyXP are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseAdmin();
    const weekId = getCurrentWeekId();

    // Upsert: update if same display_name + week_id, otherwise insert
    const { error } = await supabase
      .from("leaderboard_entries")
      .upsert(
        {
          display_name: String(displayName).slice(0, 50),
          weekly_xp: Math.max(0, Math.round(weeklyXP)),
          league: String(league || "Bronze").slice(0, 20),
          week_id: weekId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "display_name,week_id" }
      );

    if (error) {
      console.error("[leaderboard/sync] Supabase error:", error.message);
      return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, weekId });
  } catch (err) {
    console.error("[leaderboard/sync] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ── GET: fetch top 20 real users for the current week ───────────────────────

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { entries: [], message: "Supabase not configured. AI-only leaderboard." },
      { status: 200 }
    );
  }

  try {
    const supabase = await getSupabaseAdmin();
    const weekId = getCurrentWeekId();

    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("display_name, weekly_xp, league")
      .eq("week_id", weekId)
      .order("weekly_xp", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[leaderboard/sync] Supabase error:", error.message);
      return NextResponse.json({ entries: [] }, { status: 500 });
    }

    const entries = (data ?? []).map((row) => ({
      displayName: row.display_name,
      weeklyXP: row.weekly_xp,
      league: row.league,
    }));

    return NextResponse.json({ entries, weekId });
  } catch (err) {
    console.error("[leaderboard/sync] Error:", err);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
