import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// ── GET /api/user/progress?email= ────────────────────────────────────────────
// Returns user progress from Supabase. Falls back to zeroed defaults when no
// record exists so the client never has to handle null.
// SECURITY: Authenticated — users can only read their own progress.

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // SECURITY: Only allow users to query their own data (prevents IDOR)
    const email = session.user.email.toLowerCase();
    const requestedEmail = req.nextUrl.searchParams.get("email")?.toLowerCase();
    if (requestedEmail && requestedEmail !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  } catch (err) {
    console.error("[user/progress GET]", err);
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── POST /api/user/progress ───────────────────────────────────────────────────
// Upserts user progress into Supabase. Conflict key is email.
// SECURITY: Authenticated — users can only write their own progress.

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      total_xp,
      level,
      current_streak,
      longest_streak,
      coins,
      topics_completed,
      quizzes_taken,
    } = body;

    // SECURITY: Always use the authenticated email, never trust client-supplied email
    const email = session.user.email.toLowerCase();

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
