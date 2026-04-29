"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  AlertCircle,
  Crown,
  Database,
} from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { BackButton } from "@/components/back-button";
import { getLevelInfo } from "@/lib/gamification/xp";

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

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  last_active: string | null;
  xp: number;
  level: number | null;
  plan_type: string | null;
  premium_until: string | null;
}

interface UsersResponse {
  dbAvailable: boolean;
  users: UserRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function RowSkeleton() {
  return (
    <tr className="animate-pulse border-b border-border/20">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-border/30" />
          <div className="space-y-1">
            <div className="h-3 w-28 bg-border/30 rounded" />
            <div className="h-2.5 w-40 bg-border/20 rounded" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><div className="h-3 w-20 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-12 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-border/20 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-14 bg-border/20 rounded" /></td>
    </tr>
  );
}

// ── Level colors ─────────────────────────────────────────────────────────────

function getLevelTierName(level: number | null): string {
  if (level == null) return "—";
  const info = getLevelInfo(level);
  return info.title;
}

function getLevelColor(level: number | null): string {
  if (level == null) return "text-muted-foreground";
  const { tier } = getLevelInfo(level);
  if (tier === "Grandmaster" || tier === "Legend") return "text-gold";
  if (tier === "Master" || tier === "Expert") return "text-saffron";
  if (tier === "Scholar" || tier === "Apprentice") return "text-teal";
  return "text-indigo-400";
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) router.replace("/app/dashboard");
  }, [isAdmin, sessionStatus, router]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        search,
        sort: sortBy,
        dir: sortDir,
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json: UsersResponse = await res.json();
      setData(json);
    } catch (err) {
      setData({
        dbAvailable: false,
        users: [],
        total: 0,
        page: 1,
        pageSize: 25,
        totalPages: 0,
        error: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortDir]);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  // Search handler
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  // Sort handler
  function handleSort(column: string) {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
    setPage(1);
  }

  function SortButton({ column, label }: { column: string; label: string }) {
    const active = sortBy === column;
    return (
      <button
        type="button"
        onClick={() => handleSort(column)}
        className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
          active ? "text-saffron" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <ArrowUpDown className="size-3" />
      </button>
    );
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

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 py-4">
        <BackButton href="/app/admin" label="Back to Admin" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-saffron/40 bg-saffron/10">
              <Users className="size-5 text-saffron" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">User Management</h1>
              <p className="text-sm text-muted-foreground">
                {data?.total ?? 0} registered users
              </p>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-saffron/50 w-64"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </form>
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
                    <SortButton column="name" label="User" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton column="created_at" label="Signup Date" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton column="last_active" label="Last Active" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton column="xp" label="XP" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <SortButton column="level" label="Level" />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pro Status
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))
                ) : !data?.users.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      {search
                        ? `No users found matching "${search}"`
                        : "No registered users yet."}
                    </td>
                  </tr>
                ) : (
                  data.users.map((user) => {
                    const isPro =
                      user.plan_type === "lifetime" ||
                      (user.premium_until &&
                        new Date(user.premium_until) > new Date());
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border/20 hover:bg-surface-hover transition-colors cursor-pointer"
                        onClick={() =>
                          router.push(`/app/admin/users/${user.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt=""
                                className="size-8 rounded-full border border-border/30"
                              />
                            ) : (
                              <div className="flex size-8 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10 text-xs font-bold text-saffron">
                                {(
                                  user.name?.[0] ??
                                  user.email[0] ??
                                  "?"
                                ).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[200px]">
                                {user.name ?? "—"}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(user.created_at).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {user.last_active
                            ? new Date(user.last_active).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold text-saffron">
                            {(user.xp ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium ${getLevelColor(
                              user.level
                            )}`}
                          >
                            {getLevelTierName(user.level)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isPro ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                              <Crown className="size-2.5" />
                              {user.plan_type ?? "Pro"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Free
                            </span>
                          )}
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
                Page {data.page} of {data.totalPages} ({data.total} users)
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
