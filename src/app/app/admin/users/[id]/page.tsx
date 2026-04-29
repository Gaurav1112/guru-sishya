"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Activity,
  Crown,
  Zap,
  BookOpen,
  Target,
  Loader2,
  AlertCircle,
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

interface UserDetail {
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
  total_sessions?: number;
  total_quizzes?: number;
  topics_explored?: number;
  payment_id?: string | null;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-full bg-border/30" />
        <div className="space-y-2">
          <div className="h-5 w-48 bg-border/30 rounded" />
          <div className="h-3 w-64 bg-border/20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-surface p-4">
            <div className="h-3 w-16 bg-border/30 rounded mb-2" />
            <div className="h-6 w-12 bg-border/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
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

  // Fetch user detail
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // We use the users API with search by ID
      // For a proper implementation, we'd have a dedicated endpoint
      // For now, we fetch from the users list with a search
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(id)}&page=1`);
      if (!res.ok) throw new Error("Failed to fetch user");
      const json = await res.json();

      if (!json.dbAvailable) {
        setDbAvailable(false);
        throw new Error("Database unavailable");
      }

      // Find user by ID from results
      const found = json.users?.find((u: UserDetail) => u.id === id);
      if (!found) {
        throw new Error("User not found");
      }
      setUser(found);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isAdmin) fetchUser();
  }, [isAdmin, fetchUser]);

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

  const isPro =
    user?.plan_type === "lifetime" ||
    (user?.premium_until && new Date(user.premium_until) > new Date());

  const isExpired =
    user?.plan_type &&
    user.plan_type !== "lifetime" &&
    user.premium_until &&
    new Date(user.premium_until) <= new Date();

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 py-4">
        <BackButton href="/app/admin/users" label="Back to Users" />

        {/* DB unavailable */}
        {!dbAvailable && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <Database className="size-5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-amber-400">Database Unavailable</p>
              <p className="text-muted-foreground mt-0.5">Cannot connect to Supabase.</p>
            </div>
          </div>
        )}

        {loading ? (
          <DetailSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <AlertCircle className="size-10 text-red-400" />
            <h2 className="font-heading text-xl font-bold">Error</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : user ? (
          <>
            {/* Profile Header */}
            <div className="rounded-2xl border border-border/50 bg-surface p-6">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="size-20 rounded-full border-2 border-border/30"
                  />
                ) : (
                  <div className="flex size-20 items-center justify-center rounded-full border-2 border-saffron/30 bg-saffron/10 text-2xl font-bold text-saffron">
                    {(user.name?.[0] ?? user.email[0] ?? "?").toUpperCase()}
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="font-heading text-2xl font-bold">
                      {user.name ?? "Unknown User"}
                    </h1>
                    {isPro && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs font-semibold text-gold">
                        <Crown className="size-3" />
                        {user.plan_type ?? "Pro"}
                      </span>
                    )}
                    {isExpired && (
                      <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                        Expired
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      Joined{" "}
                      {new Date(user.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {user.last_active && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Activity className="size-3" />
                      Last active:{" "}
                      {new Date(user.last_active).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Zap className="size-3.5" />
                  <span className="text-[10px] font-medium">XP</span>
                </div>
                <p className="font-heading text-2xl font-bold text-saffron">
                  {(user.xp ?? 0).toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <Target className="size-3.5" />
                  <span className="text-[10px] font-medium">Level</span>
                </div>
                <p className="font-heading text-lg font-bold text-teal">
                  {user.level != null ? getLevelInfo(user.level).title : "—"}
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <BookOpen className="size-3.5" />
                  <span className="text-[10px] font-medium">Sessions</span>
                </div>
                <p className="font-heading text-2xl font-bold text-indigo-400">
                  {user.total_sessions ?? "—"}
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                  <User className="size-3.5" />
                  <span className="text-[10px] font-medium">Quizzes</span>
                </div>
                <p className="font-heading text-2xl font-bold text-gold">
                  {user.total_quizzes ?? "—"}
                </p>
              </div>
            </div>

            {/* Subscription Details */}
            <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="size-4 text-gold" />
                <h2 className="font-heading font-semibold">Subscription</h2>
              </div>

              {user.plan_type ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border/30 bg-background p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Plan
                    </p>
                    <p className="text-sm font-semibold capitalize">
                      {user.plan_type}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/30 bg-background p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                      Expires
                    </p>
                    <p className="text-sm font-semibold">
                      {user.plan_type === "lifetime"
                        ? "Never (Lifetime)"
                        : user.premium_until
                        ? new Date(user.premium_until).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )
                        : "—"}
                    </p>
                  </div>
                  {user.payment_id && (
                    <div className="rounded-lg border border-border/30 bg-background p-3 sm:col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Payment ID
                      </p>
                      <p className="text-sm font-mono text-foreground/70">
                        {user.payment_id}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This user is on the free plan.
                </p>
              )}
            </section>

            {/* User ID (for debugging) */}
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground/40 font-mono">
                ID: {user.id}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
