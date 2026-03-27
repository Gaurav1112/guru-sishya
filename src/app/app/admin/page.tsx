"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Crown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  BarChart3,
  FlaskConical,
  Database,
  Users,
} from "lucide-react";
import { useStore } from "@/lib/store";

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kgauravis016@gmail.com";

// ── Types ──────────────────────────────────────────────────────────────────────

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

interface AppConfig {
  trialDays: number;
  freeAnswerLimit: number;
  freeStarLimit: number;
  freeFlashcardLimit: number;
  freeInterviewsPerDay: number;
  freeMitraMessages: number;
}

interface Subscriber {
  email: string;
  plan_type: string;
  premium_until: string | null;
  payment_id: string | null;
  created_at: string;
}

// Plan prices in INR for revenue estimate
const PLAN_PRICES: Record<string, number> = {
  monthly: 149,
  semester: 699,
  annual: 1199,
  lifetime: 2999,
};

// ── Admin Console Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const { setPremiumStatus } = useStore();

  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [fetchStatus, setFetchStatus] = useState<Status>({ type: "loading" });
  const [actionStatus, setActionStatus] = useState<Status>({ type: "idle" });
  const [newEmail, setNewEmail] = useState("");
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  // Config state
  const DEFAULT_CONFIG: AppConfig = {
    trialDays: 7,
    freeAnswerLimit: 5,
    freeStarLimit: 3,
    freeFlashcardLimit: 50,
    freeInterviewsPerDay: 0,
    freeMitraMessages: 3,
  };
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [configDraft, setConfigDraft] = useState<AppConfig>(DEFAULT_CONFIG);
  const [configStatus, setConfigStatus] = useState<Status>({ type: "idle" });
  const [configFetchStatus, setConfigFetchStatus] = useState<Status>({ type: "loading" });

  // Subscriber state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberFetchStatus, setSubscriberFetchStatus] = useState<Status>({ type: "loading" });
  const [setupDbStatus, setSetupDbStatus] = useState<Status>({ type: "idle" });
  const [setupSql, setSetupSql] = useState<string>("");

  // ── Auth guard ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (
      sessionStatus === "unauthenticated" ||
      session?.user?.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace("/app/dashboard");
    }
  }, [session, sessionStatus, router]);

  const isAdmin =
    sessionStatus === "authenticated" &&
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // ── Fetch allowlist ────────────────────────────────────────────────────────

  const fetchAllowlist = useCallback(async () => {
    setFetchStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/allowlist");
      if (!res.ok) throw new Error("Failed to fetch allowlist");
      const data = await res.json();
      setAllowedEmails(data.allowedEmails ?? []);
      setFetchStatus({ type: "idle" });
    } catch (err) {
      setFetchStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load allowlist",
      });
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAllowlist();
  }, [isAdmin, fetchAllowlist]);

  // ── Fetch app config ────────────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    setConfigFetchStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      const data = await res.json();
      setConfig(data.config);
      setConfigDraft(data.config);
      setConfigFetchStatus({ type: "idle" });
    } catch (err) {
      setConfigFetchStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load config",
      });
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchConfig();
  }, [isAdmin, fetchConfig]);

  // ── Fetch subscribers ───────────────────────────────────────────────────────

  const fetchSubscribers = useCallback(async () => {
    setSubscriberFetchStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/subscribers", {
        headers: { "x-admin-email": session?.user?.email ?? "" },
      });
      if (!res.ok) throw new Error("Failed to fetch subscribers");
      const data = await res.json();
      setSubscribers(data.subscribers ?? []);
      setSubscriberFetchStatus({ type: "idle" });
    } catch (err) {
      setSubscriberFetchStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load subscribers",
      });
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (isAdmin) fetchSubscribers();
  }, [isAdmin, fetchSubscribers]);

  // ── Setup database ──────────────────────────────────────────────────────────

  const handleSetupDb = useCallback(async () => {
    setSetupDbStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/setup-db", {
        method: "POST",
        headers: { "x-admin-email": session?.user?.email ?? "" },
      });
      const data = await res.json();
      if (data.success) {
        setSetupDbStatus({ type: "success", message: "Database tables created successfully." });
      } else {
        // exec_sql RPC not available — show the SQL to copy-paste
        setSetupSql(data.sql ?? "");
        setSetupDbStatus({
          type: "error",
          message: data.message ?? "Could not auto-create tables. Copy the SQL below into the Supabase SQL Editor.",
        });
      }
      setTimeout(() => setSetupDbStatus((s) => (s.type === "success" ? { type: "idle" } : s)), 4000);
    } catch (err) {
      setSetupDbStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Setup failed.",
      });
    }
  }, [session?.user?.email]);

  const handleSaveConfig = useCallback(async () => {
    setConfigStatus({ type: "loading" });
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": session?.user?.email ?? "",
        },
        body: JSON.stringify(configDraft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save config");
      setConfig(data.config);
      setConfigDraft(data.config);
      setConfigStatus({ type: "success", message: "Configuration saved successfully." });
      setTimeout(() => setConfigStatus({ type: "idle" }), 3000);
    } catch (err) {
      setConfigStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }, [configDraft, session?.user?.email]);

  // ── Mutation helper ────────────────────────────────────────────────────────

  const mutate = useCallback(
    async (email: string, action: "add" | "remove") => {
      setActionStatus({ type: "loading" });
      try {
        const res = await fetch("/api/admin/allowlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-email": session?.user?.email ?? "",
          },
          body: JSON.stringify({ email, action }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");
        setAllowedEmails(data.allowedEmails ?? []);
        setActionStatus({
          type: "success",
          message:
            action === "add"
              ? `${email} added to free premium list.`
              : `${email} removed from free premium list.`,
        });
        setTimeout(() => setActionStatus({ type: "idle" }), 3000);
      } catch (err) {
        setActionStatus({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong",
        });
      }
    },
    [session?.user?.email]
  );

  // ── Add email handler ──────────────────────────────────────────────────────

  const handleAdd = useCallback(async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    setNewEmail("");
    await mutate(trimmed, "add");
  }, [newEmail, mutate]);

  // ── Remove email handler ───────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (email: string) => {
      setRemovingEmail(email);
      await mutate(email, "remove");
      setRemovingEmail(null);
    },
    [mutate]
  );

  // ── Clear trial (for testing) ──────────────────────────────────────────────

  const handleClearTrial = useCallback(() => {
    // Reset premium state in store
    setPremiumStatus(false, null, null, null);
    // Clear trial-used flag so admin can test trial flow again
    try {
      localStorage.removeItem("gs-trial-used");
    } catch {
      // ignore
    }
    setActionStatus({ type: "success", message: "Trial state cleared. You can activate a trial again." });
    setTimeout(() => setActionStatus({ type: "idle" }), 3000);
  }, [setPremiumStatus]);

  // ── Loading / access-denied states ────────────────────────────────────────

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
          This page is restricted to the site administrator.
        </p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10">
          <ShieldCheck className="size-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-indigo-400">{session?.user?.email}</span>
          </p>
        </div>
      </div>

      {/* Admin-always-premium notice */}
      <div className="flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
        <Crown className="size-5 text-gold mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-semibold text-gold">Your account always has free Pro access</p>
          <p className="text-muted-foreground mt-0.5">
            The admin email <span className="font-mono text-xs text-foreground/70">{ADMIN_EMAIL}</span> is
            hardcoded as permanently premium — independent of this allowlist.
          </p>
        </div>
      </div>

      {/* Add email form */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-saffron" />
          <h2 className="font-heading font-semibold">Grant Free Premium</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a user&apos;s email to grant them permanent free Pro access. They will be auto-upgraded
          the next time they sign in.
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="user@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-saffron/50"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newEmail.trim() || actionStatus.type === "loading"}
            className="inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {actionStatus.type === "loading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Add
          </button>
        </div>

        {/* Action status */}
        {actionStatus.type === "success" && (
          <div className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            <CheckCircle2 className="size-4 shrink-0" />
            {actionStatus.message}
          </div>
        )}
        {actionStatus.type === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {actionStatus.message}
          </div>
        )}
      </section>

      {/* Allowlist table */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-gold" />
            <h2 className="font-heading font-semibold">
              Free Premium Users
              {allowedEmails.length > 0 && (
                <span className="ml-2 rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-xs font-medium text-gold">
                  {allowedEmails.length}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchAllowlist}
            disabled={fetchStatus.type === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${fetchStatus.type === "loading" ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {fetchStatus.type === "loading" && allowedEmails.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : fetchStatus.type === "error" ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {(fetchStatus as { type: "error"; message: string }).message}
          </div>
        ) : allowedEmails.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Crown className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No users on the free premium list yet.</p>
            <p className="text-xs text-muted-foreground/60">
              Add an email above to grant free Pro access.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
            {allowedEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between px-4 py-3 bg-background hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-xs font-bold text-gold">
                    {email[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{email}</span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-saffron/30 bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron">
                    <Crown className="size-2.5" /> Free Pro
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(email)}
                  disabled={removingEmail === email || actionStatus.type === "loading"}
                  title="Revoke free premium"
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                >
                  {removingEmail === email ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">Revoke</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Note: On Vercel, file writes are not persistent across deployments. For production,
          connect a database (e.g. Supabase) to store this list permanently.
        </p>
      </section>

      {/* Stats */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
          <p className="font-heading text-3xl font-bold text-saffron">{allowedEmails.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Users with free Pro</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-surface p-4 text-center">
          <p className="font-heading text-3xl font-bold text-indigo-400">1</p>
          <p className="text-xs text-muted-foreground mt-1">Admin accounts</p>
        </div>
      </section>

      {/* App Configuration */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="size-4 text-indigo-400" />
            <h2 className="font-heading font-semibold">App Configuration</h2>
          </div>
          {configFetchStatus.type === "loading" && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
          {configFetchStatus.type === "error" && (
            <span className="text-xs text-red-400">
              {(configFetchStatus as { type: "error"; message: string }).message}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Configure free-tier limits and trial duration. Stored in Redis.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              { key: "trialDays", label: "Trial Period (days)", min: 1 },
              { key: "freeAnswerLimit", label: "Free Answer Limit", min: 0 },
              { key: "freeStarLimit", label: "Free STAR Reveal Limit", min: 0 },
              { key: "freeFlashcardLimit", label: "Free Flashcard Limit", min: 0 },
              { key: "freeInterviewsPerDay", label: "Free Interviews / Day", min: 0 },
              { key: "freeMitraMessages", label: "Free Mitra Messages", min: 0 },
            ] as { key: keyof AppConfig; label: string; min: number }[]
          ).map(({ key, label, min }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <input
                type="number"
                min={min}
                value={configDraft[key]}
                onChange={(e) =>
                  setConfigDraft((prev) => ({ ...prev, [key]: parseInt(e.target.value, 10) || 0 }))
                }
                className="rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={configStatus.type === "loading"}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {configStatus.type === "loading" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Settings className="size-4" />
            )}
            Save Configuration
          </button>
          <button
            type="button"
            onClick={() => setConfigDraft(config)}
            disabled={configStatus.type === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            Reset
          </button>
        </div>

        {configStatus.type === "success" && (
          <div className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            <CheckCircle2 className="size-4 shrink-0" />
            {configStatus.message}
          </div>
        )}
        {configStatus.type === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {(configStatus as { type: "error"; message: string }).message}
          </div>
        )}
      </section>

      {/* Subscribers */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-gold" />
            <h2 className="font-heading font-semibold">
              Subscribers
              {subscribers.length > 0 && (
                <span className="ml-2 rounded-full bg-gold/10 border border-gold/30 px-2 py-0.5 text-xs font-medium text-gold">
                  {subscribers.length}
                </span>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchSubscribers}
            disabled={subscriberFetchStatus.type === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${subscriberFetchStatus.type === "loading" ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        {subscribers.length > 0 && (() => {
          const active = subscribers.filter(
            (s) => s.premium_until == null || new Date(s.premium_until) > new Date() || s.plan_type === "lifetime"
          );
          const revenue = subscribers.reduce((sum, s) => sum + (PLAN_PRICES[s.plan_type] ?? 0), 0);
          return (
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border/40 bg-background p-4 text-center">
                <p className="font-heading text-2xl font-bold text-saffron">{subscribers.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Pro Subscribers</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background p-4 text-center">
                <p className="font-heading text-2xl font-bold text-teal">{active.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Active Subscriptions</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background p-4 text-center">
                <p className="font-heading text-2xl font-bold text-gold">₹{revenue.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground mt-1">Revenue Estimate</p>
              </div>
            </div>
          );
        })()}

        {subscriberFetchStatus.type === "loading" && subscribers.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriberFetchStatus.type === "error" ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {(subscriberFetchStatus as { type: "error"; message: string }).message}
          </div>
        ) : subscribers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <BarChart3 className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No paid subscribers yet.</p>
            <p className="text-xs text-muted-foreground/60">
              Subscriber records appear here after successful Razorpay payments.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30 rounded-xl border border-border/40 overflow-hidden">
            {subscribers.map((sub) => {
              const isExpired =
                sub.plan_type !== "lifetime" &&
                sub.premium_until != null &&
                new Date(sub.premium_until) <= new Date();
              const expiryLabel =
                sub.plan_type === "lifetime"
                  ? "Lifetime"
                  : sub.premium_until
                  ? new Date(sub.premium_until).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—";
              return (
                <div
                  key={sub.email}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-background hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10 text-xs font-bold text-saffron">
                      {sub.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{sub.email}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Joined {new Date(sub.created_at).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 capitalize">
                      {sub.plan_type}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                        isExpired
                          ? "border-red-500/30 bg-red-500/10 text-red-400"
                          : "border-teal/30 bg-teal/10 text-teal"
                      }`}
                    >
                      {isExpired ? "Expired" : expiryLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Database Setup */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-indigo-400" />
          <h2 className="font-heading font-semibold">Database Setup</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Creates the required Supabase tables (<code className="text-xs font-mono text-foreground/70">subscriptions</code>,{" "}
          <code className="text-xs font-mono text-foreground/70">user_progress</code>,{" "}
          <code className="text-xs font-mono text-foreground/70">premium_allowlist</code>).
          Safe to run multiple times — uses <code className="text-xs font-mono text-foreground/70">CREATE TABLE IF NOT EXISTS</code>.
        </p>
        <button
          type="button"
          onClick={handleSetupDb}
          disabled={setupDbStatus.type === "loading"}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {setupDbStatus.type === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Database className="size-4" />
          )}
          Setup Database
        </button>

        {setupDbStatus.type === "success" && (
          <div className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            <CheckCircle2 className="size-4 shrink-0" />
            {setupDbStatus.message}
          </div>
        )}
        {setupDbStatus.type === "error" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="size-4 shrink-0" />
              {(setupDbStatus as { type: "error"; message: string }).message}
            </div>
            {setupSql && (
              <details className="rounded-lg border border-border/40 bg-background">
                <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  View SQL to run manually in Supabase SQL Editor
                </summary>
                <pre className="overflow-x-auto px-3 pb-3 text-[11px] text-foreground/80 whitespace-pre-wrap">
                  {setupSql}
                </pre>
              </details>
            )}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="rounded-2xl border border-border/50 bg-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-teal" />
          <h2 className="font-heading font-semibold">Quick Actions</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Testing utilities — actions affect this browser only.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleClearTrial}
            className="inline-flex items-center gap-2 rounded-lg border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal/20"
          >
            <RefreshCw className="size-4" />
            Clear My Trial
          </button>
        </div>

        {actionStatus.type === "success" && (
          <div className="flex items-center gap-2 rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal">
            <CheckCircle2 className="size-4 shrink-0" />
            {actionStatus.message}
          </div>
        )}
        {actionStatus.type === "error" && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            <AlertCircle className="size-4 shrink-0" />
            {(actionStatus as { type: "error"; message: string }).message}
          </div>
        )}
      </section>
    </div>
  );
}
