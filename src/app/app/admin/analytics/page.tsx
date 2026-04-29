"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Users,
  Activity,
  Eye,
  Crown,
  Database,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { BackButton } from "@/components/back-button";

// ── Admin email check ────────────────────────────────────────────────────────

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "kgauravis016@gmail.com,gurusishya.in@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  dbAvailable: boolean;
  growth: {
    totalUsers: number;
    newThisWeek: number;
    newThisMonth: number;
    growthPercentage: number;
  };
  activeUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  signupTrend: Array<{ date: string; count: number }>;
  topPages: Array<{ path: string; views: number }>;
  subscriptionBreakdown: Array<{ plan: string; count: number }>;
  error?: string;
}

// ── Skeleton components ──────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5 animate-pulse">
      <div className="h-3 w-20 bg-border/30 rounded mb-3" />
      <div className="h-8 w-16 bg-border/30 rounded" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-surface p-5 animate-pulse">
      <div className="h-4 w-40 bg-border/30 rounded mb-6" />
      <div className="flex items-end gap-1 h-40">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-border/20 rounded-t"
            style={{ height: `${20 + ((i * 37 + 13) % 60)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-surface p-5 animate-pulse space-y-3">
      <div className="h-4 w-32 bg-border/30 rounded" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between py-2">
          <div className="h-3 w-48 bg-border/20 rounded" />
          <div className="h-3 w-12 bg-border/20 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Plan badge colors ────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  monthly: "border-blue-400/30 bg-blue-500/10 text-blue-400",
  semester: "border-teal/30 bg-teal/10 text-teal",
  annual: "border-saffron/30 bg-saffron/10 text-saffron",
  lifetime: "border-gold/30 bg-gold/10 text-gold",
};

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) router.replace("/app/dashboard");
  }, [isAdmin, sessionStatus, router]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json: AnalyticsData = await res.json();
      setData(json);
    } catch (err) {
      setData({
        dbAvailable: false,
        growth: { totalUsers: 0, newThisWeek: 0, newThisMonth: 0, growthPercentage: 0 },
        activeUsers: { today: 0, thisWeek: 0, thisMonth: 0 },
        signupTrend: [],
        topPages: [],
        subscriptionBreakdown: [],
        error: err instanceof Error ? err.message : "Failed to load",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAnalytics();
  }, [isAdmin, fetchAnalytics]);

  // Loading state
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-8 animate-spin text-saffron" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
          <AlertCircle className="size-8 text-red-400" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          This page is restricted to site administrators.
        </p>
      </div>
    );
  }

  // Chart helpers
  const maxSignups = data
    ? Math.max(...data.signupTrend.map((d) => d.count), 1)
    : 1;

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        <BackButton href="/app/admin" label="Back to Admin" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10">
              <TrendingUp className="size-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Platform usage trends and engagement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* DB unavailable warning */}
        {data && !data.dbAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Database className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Database Unavailable</p>
              <p className="text-muted-foreground mt-0.5">
                Could not connect to Supabase. Data below may show zeros.
                {data.error && (
                  <span className="block mt-1 text-xs text-amber-400/70">
                    {data.error}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Growth Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              {/* Total Users */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Users className="size-4" />
                  <span className="text-xs font-medium">Total Users</span>
                </div>
                <p className="font-heading text-3xl font-bold text-saffron">
                  {data?.growth.totalUsers.toLocaleString() ?? "0"}
                </p>
                <div className="mt-1.5 flex items-center gap-1 text-[10px]">
                  {(data?.growth.growthPercentage ?? 0) >= 0 ? (
                    <ArrowUpRight className="size-3 text-teal" />
                  ) : (
                    <ArrowDownRight className="size-3 text-red-400" />
                  )}
                  <span
                    className={
                      (data?.growth.growthPercentage ?? 0) >= 0
                        ? "text-teal"
                        : "text-red-400"
                    }
                  >
                    {data?.growth.growthPercentage ?? 0}% this month
                  </span>
                </div>
              </div>

              {/* New This Week */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="size-4" />
                  <span className="text-xs font-medium">New This Week</span>
                </div>
                <p className="font-heading text-3xl font-bold text-teal">
                  {data?.growth.newThisWeek.toLocaleString() ?? "0"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  This month: {data?.growth.newThisMonth ?? 0}
                </p>
              </div>

              {/* Active Users Today */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Activity className="size-4" />
                  <span className="text-xs font-medium">Active Today</span>
                </div>
                <p className="font-heading text-3xl font-bold text-indigo-400">
                  {data?.activeUsers.today.toLocaleString() ?? "0"}
                </p>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>Week: {data?.activeUsers.thisWeek ?? 0}</span>
                  <span>Month: {data?.activeUsers.thisMonth ?? 0}</span>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Crown className="size-4" />
                  <span className="text-xs font-medium">Total Subscribers</span>
                </div>
                <p className="font-heading text-3xl font-bold text-gold">
                  {(data?.subscriptionBreakdown ?? [])
                    .reduce((s, b) => s + b.count, 0)
                    .toLocaleString()}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {(data?.subscriptionBreakdown ?? []).length} plan type
                  {(data?.subscriptionBreakdown ?? []).length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Signup Trend Chart */}
        {loading ? (
          <ChartSkeleton />
        ) : (
          <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-saffron" />
              <h2 className="font-heading font-semibold">
                Signup Trend (Last 30 Days)
              </h2>
            </div>
            {data && data.signupTrend.length > 0 ? (
              <div className="space-y-2">
                {/* Bar chart */}
                <div className="flex items-end gap-[3px] h-40">
                  {data.signupTrend.map((day) => {
                    const heightPct =
                      day.count > 0
                        ? Math.max((day.count / maxSignups) * 100, 4)
                        : 2;
                    return (
                      <div
                        key={day.date}
                        className="group relative flex-1 flex flex-col items-center"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                          <div className="rounded-md bg-background border border-border/60 px-2 py-1 text-[10px] whitespace-nowrap shadow-lg">
                            <span className="font-medium">{day.count}</span>{" "}
                            <span className="text-muted-foreground">
                              {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${
                            day.count > 0
                              ? "bg-saffron/70 group-hover:bg-saffron"
                              : "bg-border/20"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                {/* X-axis labels (show every 5th day) */}
                <div className="flex gap-[3px]">
                  {data.signupTrend.map((day, i) => (
                    <div key={day.date} className="flex-1 text-center">
                      {i % 5 === 0 ? (
                        <span className="text-[8px] text-muted-foreground">
                          {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <TrendingUp className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No signup data available.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Two-column layout: Top Pages + Subscription Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Pages */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-teal" />
                <h2 className="font-heading font-semibold">
                  Top Pages (Last 7 Days)
                </h2>
              </div>
              {data && data.topPages.length > 0 ? (
                <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
                  {data.topPages.map((page) => (
                    <div
                      key={page.path}
                      className="flex items-center justify-between px-4 py-2.5 bg-background hover:bg-surface-hover transition-colors"
                    >
                      <span className="text-xs font-medium text-foreground truncate max-w-[240px]">
                        {page.path}
                      </span>
                      <span className="text-xs font-semibold text-teal shrink-0 ml-3">
                        {page.views.toLocaleString()} views
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Eye className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No page view data available.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Subscription Breakdown */}
          {loading ? (
            <TableSkeleton />
          ) : (
            <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-gold" />
                <h2 className="font-heading font-semibold">
                  Subscription Breakdown
                </h2>
              </div>
              {data && data.subscriptionBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {data.subscriptionBreakdown.map((item) => {
                    const totalSubs = data.subscriptionBreakdown.reduce(
                      (s, b) => s + b.count,
                      0
                    );
                    const pct =
                      totalSubs > 0
                        ? Math.round((item.count / totalSubs) * 100)
                        : 0;
                    const colorClass =
                      PLAN_COLORS[item.plan] ??
                      "border-border/30 bg-background text-foreground";

                    return (
                      <div key={item.plan} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${colorClass}`}
                          >
                            {item.plan}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.count} ({pct}%)
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-border/20 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.plan === "lifetime"
                                ? "bg-gold"
                                : item.plan === "annual"
                                ? "bg-saffron"
                                : item.plan === "semester"
                                ? "bg-teal"
                                : "bg-blue-400"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Crown className="size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No subscription data available.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
