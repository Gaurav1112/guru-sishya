import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
// Returns platform analytics: signup trends, active users, top pages,
// subscription breakdown, and growth metrics.

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 86400000);

    // ── Run all queries in parallel ───────────────────────────────────────────
    const [
      allUsersResult,
      newWeekResult,
      newMonthResult,
      activeTodayResult,
      activeWeekResult,
      activeMonthResult,
      pageViewsResult,
      subsResult,
      signupTrendResult,
    ] = await Promise.allSettled([
      // Total users
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true }),

      // New users this week
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString()),

      // New users this month
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString()),

      // Active today
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", todayStart.toISOString()),

      // Active this week
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", weekStart.toISOString()),

      // Active this month
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", monthStart.toISOString()),

      // Top pages (last 7 days)
      supabase
        .from("page_views")
        .select("path, viewed_at")
        .gte("viewed_at", weekStart.toISOString())
        .order("viewed_at", { ascending: false })
        .limit(500),

      // All subscriptions
      supabase
        .from("subscriptions")
        .select("plan_type, created_at"),

      // Signup trend — all users from the last 30 days with created_at
      supabase
        .from("user_progress")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),
    ]);

    let dbAvailable = true;

    // ── Growth metrics ────────────────────────────────────────────────────────
    let totalUsers = 0;
    let newThisWeek = 0;
    let newThisMonth = 0;

    if (allUsersResult.status === "fulfilled" && !allUsersResult.value.error) {
      totalUsers = allUsersResult.value.count ?? 0;
    } else {
      dbAvailable = false;
    }

    if (newWeekResult.status === "fulfilled" && !newWeekResult.value.error) {
      newThisWeek = newWeekResult.value.count ?? 0;
    }

    if (newMonthResult.status === "fulfilled" && !newMonthResult.value.error) {
      newThisMonth = newMonthResult.value.count ?? 0;
    }

    // Growth percentage: new this month / (total - new this month) * 100
    const previousUsers = totalUsers - newThisMonth;
    const growthPercentage =
      previousUsers > 0
        ? Math.round((newThisMonth / previousUsers) * 100 * 10) / 10
        : newThisMonth > 0
        ? 100
        : 0;

    // ── Active users ──────────────────────────────────────────────────────────
    let activeToday = 0;
    let activeWeek = 0;
    let activeMonth = 0;

    if (activeTodayResult.status === "fulfilled" && !activeTodayResult.value.error) {
      activeToday = activeTodayResult.value.count ?? 0;
    }
    if (activeWeekResult.status === "fulfilled" && !activeWeekResult.value.error) {
      activeWeek = activeWeekResult.value.count ?? 0;
    }
    if (activeMonthResult.status === "fulfilled" && !activeMonthResult.value.error) {
      activeMonth = activeMonthResult.value.count ?? 0;
    }

    // ── Signup trend (last 30 days, grouped by day) ───────────────────────────
    const signupsByDay: Array<{ date: string; count: number }> = [];

    // Build an array of last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart.getTime() - i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      signupsByDay.push({ date: dateStr, count: 0 });
    }

    if (signupTrendResult.status === "fulfilled" && !signupTrendResult.value.error) {
      const rows = signupTrendResult.value.data ?? [];
      for (const row of rows) {
        const dateStr = new Date(row.created_at).toISOString().slice(0, 10);
        const entry = signupsByDay.find((d) => d.date === dateStr);
        if (entry) entry.count++;
      }
    }

    // ── Top pages ─────────────────────────────────────────────────────────────
    let topPages: Array<{ path: string; views: number }> = [];

    if (pageViewsResult.status === "fulfilled" && !pageViewsResult.value.error) {
      const rows = pageViewsResult.value.data ?? [];
      const pageCounts: Record<string, number> = {};
      for (const row of rows) {
        const path = row.path ?? "unknown";
        pageCounts[path] = (pageCounts[path] ?? 0) + 1;
      }
      topPages = Object.entries(pageCounts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);
    }

    // ── Subscription breakdown ────────────────────────────────────────────────
    const subscriptionBreakdown: Array<{ plan: string; count: number }> = [];

    if (subsResult.status === "fulfilled" && !subsResult.value.error) {
      const rows = subsResult.value.data ?? [];
      const planCounts: Record<string, number> = {};
      for (const row of rows) {
        const plan = row.plan_type ?? "unknown";
        planCounts[plan] = (planCounts[plan] ?? 0) + 1;
      }
      for (const [plan, count] of Object.entries(planCounts)) {
        subscriptionBreakdown.push({ plan, count });
      }
      subscriptionBreakdown.sort((a, b) => b.count - a.count);
    }

    return NextResponse.json(
      {
        dbAvailable,
        growth: {
          totalUsers,
          newThisWeek,
          newThisMonth,
          growthPercentage,
        },
        activeUsers: {
          today: activeToday,
          thisWeek: activeWeek,
          thisMonth: activeMonth,
        },
        signupTrend: signupsByDay,
        topPages,
        subscriptionBreakdown,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[admin/analytics]", err);
    return NextResponse.json(
      {
        dbAvailable: false,
        growth: {
          totalUsers: 0,
          newThisWeek: 0,
          newThisMonth: 0,
          growthPercentage: 0,
        },
        activeUsers: { today: 0, thisWeek: 0, thisMonth: 0 },
        signupTrend: [],
        topPages: [],
        subscriptionBreakdown: [],
        error: "Failed to fetch analytics.",
      },
      { status: 500 }
    );
  }
}
