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
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "kgauravis016@gmail.com";

// ── Types ──────────────────────────────────────────────────────────────────────

type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

// ── Admin Console Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [fetchStatus, setFetchStatus] = useState<Status>({ type: "loading" });
  const [actionStatus, setActionStatus] = useState<Status>({ type: "idle" });
  const [newEmail, setNewEmail] = useState("");
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

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
    </div>
  );
}
