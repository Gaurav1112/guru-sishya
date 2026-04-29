"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Zap,
  Lightbulb,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Database,
  MessageSquare,
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

interface FeedbackRow {
  id: string;
  type: string;
  message: string;
  page: string | null;
  screen_size: string | null;
  connection: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  created_at: string;
}

interface FeedbackResponse {
  dbAvailable: boolean;
  feedback: FeedbackRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

// ── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: typeof Bug; color: string; label: string; borderColor: string }> = {
  bug: { icon: Bug, color: "text-red-400", label: "Bug", borderColor: "border-red-400/30 bg-red-400/5" },
  lag: { icon: Zap, color: "text-gold", label: "Performance", borderColor: "border-gold/30 bg-gold/5" },
  idea: { icon: Lightbulb, color: "text-teal", label: "Feature", borderColor: "border-teal/30 bg-teal/5" },
};

// ── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border/20">
      <td className="px-4 py-3"><div className="h-5 w-5 rounded bg-border/30" /></td>
      <td className="px-4 py-3"><div className="h-3 w-64 bg-border/30 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-24 bg-border/20 rounded" /></td>
    </tr>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) router.replace("/app/dashboard");
  }, [isAdmin, sessionStatus, router]);

  // Fetch feedback
  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter !== "all") params.set("type", filter);
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (!res.ok) throw new Error("Failed to fetch feedback");
      const json: FeedbackResponse = await res.json();
      setData(json);
    } catch (err) {
      setData({
        dbAvailable: false,
        feedback: [],
        total: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
        error: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    if (isAdmin) fetchFeedback();
  }, [isAdmin, fetchFeedback]);

  // Filter change resets page
  function handleFilterChange(newFilter: string) {
    setFilter(newFilter);
    setPage(1);
  }

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

  // Count by type from current data
  const totalCount = data?.total ?? 0;

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 py-4">
        <BackButton href="/app/admin" label="Back to Admin" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-saffron/40 bg-saffron/10">
              <MessageSquare className="size-5 text-saffron" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">User Feedback</h1>
              <p className="text-sm text-muted-foreground">
                {totalCount} feedback {totalCount === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchFeedback}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "bug", "lag", "idea"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleFilterChange(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === t
                  ? "bg-saffron/20 text-saffron border border-saffron/30"
                  : "border border-border/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all"
                ? "All"
                : TYPE_CONFIG[t]?.label ?? t}
            </button>
          ))}
        </div>

        {/* DB unavailable */}
        {data && !data.dbAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Database className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Database Unavailable</p>
              <p className="text-muted-foreground mt-0.5">
                Cannot connect to Supabase.{" "}
                {data.error && (
                  <span className="text-amber-400/70">{data.error}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-border/50 bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-background/50">
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground">Type</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground">Message</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground">Page</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground">Date</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))
                ) : !data?.feedback.length ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No feedback entries found.
                    </td>
                  </tr>
                ) : (
                  data.feedback.map((item) => {
                    const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.bug;
                    const Icon = config.icon;
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-border/20 hover:bg-surface-hover transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.color} ${config.borderColor}`}
                          >
                            <Icon className="size-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground max-w-md truncate">
                            {item.message}
                          </p>
                          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-muted-foreground">
                            {item.screen_size && <span>Screen: {item.screen_size}</span>}
                            {item.connection && <span>Connection: {item.connection}</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {item.page ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          <br />
                          <span className="text-[10px]">
                            {new Date(item.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {data.page} of {data.totalPages} ({data.total} entries)
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="size-3.5" /> Prev
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  disabled={page >= data.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-hover disabled:opacity-40 transition-colors"
                >
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
