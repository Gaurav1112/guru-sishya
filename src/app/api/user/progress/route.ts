import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// ── GET /api/user/progress?email= ────────────────────────────────────────────
// Returns user progress from Supabase. Falls back to zeroed defaults when no
// record exists so the client never has to handle null.

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("email", email)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = "no rows returned" — anything else is a real error
    console.error("[user/progress GET]", error);
    return NextResponse.json({ error: "Failed to fetch progress." }, { status: 500 });
  }

  return NextResponse.json(
    data ?? { total_xp: 0, level: 1, current_streak: 0, longest_streak: 0, coins: 0, topics_completed: 0, quizzes_taken: 0 }
  );
}

// ── POST /api/user/progress ───────────────────────────────────────────────────
// Upserts user progress into Supabase. Conflict key is email.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      total_xp,
      level,
      current_streak,
      longest_streak,
      coins,
      topics_completed,
      quizzes_taken,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("user_progress").upsert(
      {
        email,
        total_xp,
        level,
        current_streak,
        longest_streak,
        coins,
        topics_completed,
        quizzes_taken,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("[user/progress POST]", error);
      return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[user/progress POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
