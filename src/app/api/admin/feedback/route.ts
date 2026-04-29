import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/admin/feedback ─────────────────────────────────────────────────
// Paginated feedback list with optional type filter. Admin-only.

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const type = searchParams.get("type") ?? "";

    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("feedback")
      .select(
        "id, type, message, page, screen_size, connection, user_agent, ip_hash, created_at",
        { count: "exact" }
      );

    // Filter by feedback type
    if (type && ["bug", "lag", "idea"].includes(type)) {
      query = query.eq("type", type);
    }

    query = query
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/feedback]", error);
      return NextResponse.json(
        { error: "Failed to fetch feedback.", dbAvailable: false, feedback: [], total: 0 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      dbAvailable: true,
      feedback: data ?? [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
    });
  } catch (err) {
    console.error("[admin/feedback]", err);
    const message = err instanceof Error ? err.message : "Fetch failed.";
    return NextResponse.json(
      { error: message, dbAvailable: false, feedback: [], total: 0 },
      { status: 500 }
    );
  }
}
