"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Crown,
  IndianRupee,
  TrendingUp,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronRight,
  UserPlus,
  Activity,
  Database,
  Calendar,
} from "lucide-react";
import { PageTransition } from "@/components/page-transition";

// ── Admin email check (client-side) ──────────────────────────────────────────

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  dbAvailable: boolean;
  totalUsers: number;
  activeToday: number;
  activeWeek: number;
  activeMonth: number;
  totalSubscribers: number;
  activeSubscribers: number;
  revenueThisMonth: number;
  totalFeedback: number;
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  }>;
  error?: string;
}

// ── Skeleton component ───────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border/40 bg-surface p-5 animate-pulse">
      <div className="h-3 w-20 bg-border/30 rounded mb-3" />
      <div className="h-8 w-16 bg-border/30 rounded" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="size-8 rounded-full bg-border/30" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-32 bg-border/30 rounded" />
        <div className="h-2.5 w-48 bg-border/20 rounded" />
      </div>
      <div className="h-3 w-20 bg-border/20 rounded" />
    </div>
  );
}

// ── Quick Link Card ──────────────────────────────────────────────────────────

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border/40 bg-surface p-4 transition-all hover:border-border/60 hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between">
        <div className={`flex size-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="size-4" />
        </div>
        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </div>
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </Link>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) {
      router.replace("/app/dashboard");
    }
  }, [isAdmin, sessionStatus, router]);

  // ── Fetch stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data: DashboardStats = await res.json();
      setStats(data);
    } catch (err) {
      setStats({
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
        error: err instanceof Error ? err.message : "Failed to load stats",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin, fetchStats]);

  // ── Loading state ───────────────────────────────────────────────────────────
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10">
              <ShieldCheck className="size-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Signed in as{" "}
                <span className="font-medium text-indigo-400">
                  {session?.user?.email}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* DB unavailable warning */}
        {stats && !stats.dbAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Database className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">
                Database Unavailable
              </p>
              <p className="text-muted-foreground mt-0.5">
                Could not connect to Supabase. Stats below may show zeros.
                {stats.error && (
                  <span className="block mt-1 text-xs text-amber-400/70">
                    {stats.error}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
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
                  {stats?.totalUsers.toLocaleString() ?? "0"}
                </p>
              </div>

              {/* Active Today */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Activity className="size-4" />
                  <span className="text-xs font-medium">Active Today</span>
                </div>
                <p className="font-heading text-3xl font-bold text-teal">
                  {stats?.activeToday.toLocaleString() ?? "0"}
                </p>
                <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                  <span>Week: {stats?.activeWeek ?? 0}</span>
                  <span>Month: {stats?.activeMonth ?? 0}</span>
                </div>
              </div>

              {/* Pro Subscribers */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Crown className="size-4" />
                  <span className="text-xs font-medium">Pro Subscribers</span>
                </div>
                <p className="font-heading text-3xl font-bold text-gold">
                  {stats?.totalSubscribers.toLocaleString() ?? "0"}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {stats?.activeSubscribers ?? 0} active
                </p>
              </div>

              {/* Revenue This Month */}
              <div className="rounded-xl border border-border/40 bg-surface p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <IndianRupee className="size-4" />
                  <span className="text-xs font-medium">Revenue (Month)</span>
                </div>
                <p className="font-heading text-3xl font-bold text-indigo-400">
                  {stats?.revenueThisMonth
                    ? `₹${stats.revenueThisMonth.toLocaleString("en-IN")}`
                    : "₹0"}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Quick Links */}
        <section>
          <h2 className="font-heading text-lg font-semibold mb-3">
            Quick Links
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickLink
              href="/app/admin/users"
              icon={Users}
              label="Users"
              description="View and search all registered users"
              color="bg-saffron/10 text-saffron border border-saffron/20"
            />
            <QuickLink
              href="/app/admin/subscribers"
              icon={Crown}
              label="Subscribers"
              description="Pro subscriber list and revenue"
              color="bg-gold/10 text-gold border border-gold/20"
            />
            <QuickLink
              href="/app/admin/feedback"
              icon={MessageSquare}
              label="Feedback"
              description={`${stats?.totalFeedback ?? 0} feedback entries`}
              color="bg-teal/10 text-teal border border-teal/20"
            />
            <QuickLink
              href="/app/admin"
              icon={TrendingUp}
              label="Analytics"
              description="Usage trends and engagement"
              color="bg-indigo-500/10 text-indigo-400 border border-indigo-400/20"
            />
          </div>
        </section>

        {/* Recent Signups */}
        <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="size-4 text-saffron" />
              <h2 className="font-heading font-semibold">Recent Signups</h2>
            </div>
            <Link
              href="/app/admin/users"
              className="text-xs text-saffron hover:text-saffron/80 font-medium"
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </div>
          ) : !stats?.recentSignups.length ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No registered users yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
              {stats.recentSignups.map((user) => (
                <Link
                  key={user.id}
                  href={`/app/admin/users/${user.id}`}
                  className="flex items-center gap-3 px-4 py-3 bg-background hover:bg-surface-hover transition-colors"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="size-8 rounded-full border border-border/30"
                    />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10 text-xs font-bold text-saffron">
                      {(user.name?.[0] ?? user.email[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.name ?? user.email}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <Calendar className="size-3" />
                    {new Date(user.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageTransition>
  );
}
