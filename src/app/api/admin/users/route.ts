import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/admin/users ────────────────────────────────────────────────────────
// Paginated user list with search and sort. Admin-only.

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const sortBy = searchParams.get("sort") ?? "created_at";
    const sortDir = searchParams.get("dir") === "asc" ? true : false;

    const supabase = getSupabaseAdmin();

    // Build query — plan_type and premium_until live in `subscriptions`, not `user_progress`
    let query = supabase
      .from("user_progress")
      .select(
        "id, email, name, avatar_url, created_at, last_active, total_xp, xp, level, quizzes_taken, topics_completed, current_streak, longest_streak, coins",
        { count: "exact" }
      );

    // Search filter
    // SECURITY: Sanitize search input to prevent PostgREST filter injection.
    // Characters like `,`, `.`, `(`, `)` can manipulate the filter syntax.
    if (search) {
      const sanitized = search.replace(/[%_,.*()\\]/g, "");
      if (sanitized.length > 0) {
        query = query.or(`email.ilike.%${sanitized}%,name.ilike.%${sanitized}%`);
      }
    }

    // Valid sort columns (total_xp is the actual column; accept "xp" as alias)
    const validSorts = ["created_at", "last_active", "total_xp", "xp", "level", "name", "email"];
    let sortColumn = validSorts.includes(sortBy) ? sortBy : "created_at";
    if (sortColumn === "xp") sortColumn = "total_xp";

    query = query
      .order(sortColumn, { ascending: sortDir })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/users]", error);
      return NextResponse.json(
        { error: "Failed to fetch users.", dbAvailable: false },
        { status: 500 }
      );
    }

    const users = data ?? [];

    // Fetch subscription info for the returned users from the `subscriptions` table
    let subsMap: Record<string, { plan_type: string; premium_until: string | null }> = {};
    if (users.length > 0) {
      const emails = users.map((u) => u.email).filter(Boolean);
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("email, plan_type, premium_until")
        .in("email", emails);

      if (subs) {
        for (const s of subs) {
          subsMap[s.email] = { plan_type: s.plan_type, premium_until: s.premium_until };
        }
      }
    }

    // Merge subscription data into each user row
    const mergedUsers = users.map((u) => ({
      ...u,
      plan_type: subsMap[u.email]?.plan_type ?? "free",
      premium_until: subsMap[u.email]?.premium_until ?? null,
    }));

    return NextResponse.json({
      dbAvailable: true,
      users: mergedUsers,
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/users]", err);
    const message = err instanceof Error ? err.message : "Fetch failed.";
    return NextResponse.json(
      { error: message, dbAvailable: false },
      { status: 500 }
    );
  }
}
