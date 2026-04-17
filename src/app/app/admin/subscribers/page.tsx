"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Crown,
  RefreshCw,
  Loader2,
  AlertCircle,
  IndianRupee,
  TrendingUp,
  Users,
  Database,
  Calendar,
} from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { BackButton } from "@/components/back-button";

// ── Admin email check ────────────────────────────────────────────────────────

const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kgauravis016@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase());

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Subscriber {
  email: string;
  plan_type: string;
  premium_until: string | null;
  payment_id: string | null;
  created_at: string;
}

const PLAN_PRICES: Record<string, number> = {
  monthly: 149,
  semester: 699,
  annual: 1199,
  lifetime: 2999,
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border/20">
      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="size-8 rounded-full bg-border/30" /><div className="h-3 w-40 bg-border/30 rounded" /></div></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-32 bg-border/20 rounded" /></td>
    </tr>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSubscribersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbAvailable, setDbAvailable] = useState(true);

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) router.replace("/app/dashboard");
  }, [isAdmin, sessionStatus, router]);

  // Fetch subscribers
  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscribers");
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubscribers(data.subscribers ?? []);
      setDbAvailable(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setDbAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchSubscribers();
  }, [isAdmin, fetchSubscribers]);

  // Computed stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeSubscribers = subscribers.filter(
    (s) =>
      s.plan_type === "lifetime" ||
      !s.premium_until ||
      new Date(s.premium_until) > now
  );

  const totalRevenue = subscribers.reduce(
    (sum, s) => sum + (PLAN_PRICES[s.plan_type] ?? 0),
    0
  );

  const monthRevenue = subscribers
    .filter((s) => new Date(s.created_at) >= monthStart)
    .reduce((sum, s) => sum + (PLAN_PRICES[s.plan_type] ?? 0), 0);

  // Loading / Access denied
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
        <AlertCircle className="size-8 text-red-400" />
        <h1 className="font-heading text-2xl font-bold">Access Denied</h1>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-6 py-4">
        <BackButton href="/app/admin" label="Back to Admin" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
              <Crown className="size-5 text-gold" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">Pro Subscribers</h1>
              <p className="text-sm text-muted-foreground">
                {subscribers.length} total subscribers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchSubscribers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* DB unavailable */}
        {!dbAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Database className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Database Unavailable</p>
              <p className="text-muted-foreground mt-0.5">
                Cannot connect to Supabase.{" "}
                {error && <span className="text-amber-400/70">{error}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Users className="size-3.5" />
              <span className="text-[10px] font-medium">Total</span>
            </div>
            <p className="font-heading text-2xl font-bold text-saffron">
              {subscribers.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <TrendingUp className="size-3.5" />
              <span className="text-[10px] font-medium">Active</span>
            </div>
            <p className="font-heading text-2xl font-bold text-teal">
              {activeSubscribers.length}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <IndianRupee className="size-3.5" />
              <span className="text-[10px] font-medium">This Month</span>
            </div>
            <p className="font-heading text-2xl font-bold text-gold">
              ₹{monthRevenue.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <IndianRupee className="size-3.5" />
              <span className="text-[10px] font-medium">Total Revenue</span>
            </div>
            <p className="font-heading text-2xl font-bold text-indigo-400">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="rounded-2xl border border-border/50 bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-background/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Plan
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Expiry
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Payment ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No paid subscribers yet. Subscriber records appear here
                      after successful Razorpay payments.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub, i) => {
                    const isExpired =
                      sub.plan_type !== "lifetime" &&
                      sub.premium_until != null &&
                      new Date(sub.premium_until) <= now;
                    const isActive = !isExpired;

                    return (
                      <tr
                        key={`${sub.email}-${i}`}
                        className="border-b border-border/20 hover:bg-surface-hover transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10 text-xs font-bold text-saffron">
                              {sub.email[0].toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[200px]">
                              {sub.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 capitalize">
                            {sub.plan_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {new Date(sub.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              isExpired
                                ? "border-red-500/30 bg-red-500/10 text-red-400"
                                : "border-teal/30 bg-teal/10 text-teal"
                            }`}
                          >
                            {sub.plan_type === "lifetime"
                              ? "Lifetime"
                              : sub.premium_until
                              ? new Date(
                                  sub.premium_until
                                ).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground truncate max-w-[180px] block">
                            {sub.payment_id ?? "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revenue Breakdown */}
        {subscribers.length > 0 && (
          <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-3">
            <h2 className="font-heading font-semibold flex items-center gap-2">
              <IndianRupee className="size-4 text-gold" />
              Revenue Breakdown
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(PLAN_PRICES).map(([plan, price]) => {
                const count = subscribers.filter(
                  (s) => s.plan_type === plan
                ).length;
                return (
                  <div
                    key={plan}
                    className="rounded-lg border border-border/30 bg-background p-3"
                  >
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 capitalize">
                      {plan}
                    </p>
                    <p className="text-sm font-semibold">
                      {count} subscriber{count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₹{(count * price).toLocaleString("en-IN")} (₹{price} each)
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
