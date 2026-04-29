import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/admin/stats ────────────────────────────────────────────────────────
// Returns dashboard statistics from Supabase. Graceful fallback when DB is down.

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Run all queries in parallel for speed
    const [usersResult, subsResult, feedbackResult] = await Promise.allSettled([
      supabase
        .from("user_progress")
        .select("id, email, name, avatar_url, created_at, last_active, total_xp, level", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("subscriptions")
        .select("email, plan_type, premium_until, payment_id, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false }),
      supabase
        .from("feedback")
        .select("*", { count: "exact" })
        .limit(0),
    ]);

    // ── Parse user stats ──────────────────────────────────────────────────────
    let totalUsers = 0;
    let recentSignups: Array<{
      id: string;
      email: string;
      name: string | null;
      avatar_url: string | null;
      created_at: string;
    }> = [];
    let activeToday = 0;
    let activeWeek = 0;
    let activeMonth = 0;
    let dbAvailable = true;

    if (usersResult.status === "fulfilled" && !usersResult.value.error) {
      totalUsers = usersResult.value.count ?? usersResult.value.data?.length ?? 0;
      recentSignups = (usersResult.value.data ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        name: u.name ?? null,
        avatar_url: u.avatar_url ?? null,
        created_at: u.created_at,
      }));

      // Count active users by period
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart.getTime() - 7 * 86400000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // We need a separate query for active users since the initial was limited to 10
      const { count: todayCount } = await supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", todayStart.toISOString());
      activeToday = todayCount ?? 0;

      const { count: weekCount } = await supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", weekStart.toISOString());
      activeWeek = weekCount ?? 0;

      const { count: monthCount } = await supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .gte("last_active", monthStart.toISOString());
      activeMonth = monthCount ?? 0;
    } else {
      dbAvailable = false;
    }

    // ── Parse subscriber stats ────────────────────────────────────────────────
    let totalSubscribers = 0;
    let activeSubscribers = 0;
    let revenueThisMonth = 0;
    const planPrices: Record<string, number> = {
      monthly: 149,
      semester: 699,
      annual: 1199,
      lifetime: 2999,
    };

    if (subsResult.status === "fulfilled" && !subsResult.value.error) {
      const subs = subsResult.value.data ?? [];
      totalSubscribers = subsResult.value.count ?? subs.length;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      activeSubscribers = subs.filter(
        (s) =>
          s.plan_type === "lifetime" ||
          !s.premium_until ||
          new Date(s.premium_until) > now
      ).length;

      // Revenue this month: sum of plan prices for subscriptions created this month
      revenueThisMonth = subs
        .filter((s) => new Date(s.created_at) >= monthStart)
        .reduce((sum, s) => sum + (planPrices[s.plan_type] ?? 0), 0);
    }

    // ── Parse feedback count ──────────────────────────────────────────────────
    let totalFeedback = 0;
    if (feedbackResult.status === "fulfilled" && !feedbackResult.value.error) {
      totalFeedback = feedbackResult.value.count ?? 0;
    }

    return NextResponse.json({
      dbAvailable,
      totalUsers,
      activeToday,
      activeWeek,
      activeMonth,
      totalSubscribers,
      activeSubscribers,
      revenueThisMonth,
      totalFeedback,
      recentSignups,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    const message = err instanceof Error ? err.message : "Failed to fetch stats.";
    // Graceful fallback: return zeros with dbAvailable: false
    return NextResponse.json({
      dbAvailable: false,
      totalUsers: 0,
      activeToday: 0,
      activeWeek: 0,
      activeMonth: 0,
      totalSubscribers: 0,
      activeSubscribers: 0,
      revenueThisMonth: 0,
      totalFeedback: 0,
      recentSignups: [],
      error: message,
    });
  }
}
