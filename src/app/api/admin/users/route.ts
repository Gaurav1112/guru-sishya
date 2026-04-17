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

    // Build query
    let query = supabase
      .from("user_progress")
      .select(
        "id, email, name, avatar_url, created_at, last_active, xp, level, plan_type, premium_until",
        { count: "exact" }
      );

    // Search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    // Valid sort columns
    const validSorts = ["created_at", "last_active", "xp", "level", "name", "email"];
    const sortColumn = validSorts.includes(sortBy) ? sortBy : "created_at";

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

    return NextResponse.json({
      dbAvailable: true,
      users: data ?? [],
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
