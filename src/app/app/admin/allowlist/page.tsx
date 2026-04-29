"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Database,
  Mail,
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

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAllowlistPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [emails, setEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const isAdmin =
    sessionStatus === "authenticated" && isAdminEmail(session?.user?.email);

  // Auth guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!isAdmin) router.replace("/app/dashboard");
  }, [isAdmin, sessionStatus, router]);

  // Fetch allowlist
  const fetchAllowlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/allowlist");
      if (!res.ok) throw new Error("Failed to fetch allowlist");
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setEmails(json.allowedEmails ?? []);
      setDbAvailable(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load allowlist");
      setDbAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAllowlist();
  }, [isAdmin, fetchAllowlist]);

  // Clear messages after a delay
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Add email
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, action: "add" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add email");
      setEmails(json.allowedEmails ?? []);
      setNewEmail("");
      setSuccess(`Added ${trimmed} to the allowlist.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add email");
    } finally {
      setSubmitting(false);
    }
  }

  // Remove email
  async function handleRemove(email: string) {
    setRemovingEmail(email);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, action: "remove" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to remove email");
      setEmails(json.allowedEmails ?? []);
      setSuccess(`Removed ${email} from the allowlist.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove email");
    } finally {
      setRemovingEmail(null);
    }
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
      <div className="mx-auto max-w-3xl space-y-6 py-4">
        <BackButton href="/app/admin" label="Back to Admin" />

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10">
            <UserPlus className="size-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold">Pro Allowlist</h1>
            <p className="text-sm text-muted-foreground">
              Grant free Pro access to specific emails
            </p>
          </div>
        </div>

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

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <CheckCircle className="size-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400">{success}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <AlertCircle className="size-5 text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Add email form */}
        <form
          onSubmit={handleAdd}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={submitting}
              className="w-full rounded-lg border border-border/60 bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newEmail.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Add
          </button>
        </form>

        {/* Table */}
        <div className="rounded-2xl border border-border/50 bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-background/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-border/20">
                      <td className="px-4 py-3">
                        <div className="h-3 w-48 bg-border/30 rounded" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-6 w-16 bg-border/20 rounded ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : emails.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No emails in the allowlist yet. Add one above.
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr
                      key={email}
                      className="border-b border-border/20 hover:bg-surface-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground">{email}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemove(email)}
                          disabled={removingEmail === email}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-2.5 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {removingEmail === email ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && emails.length > 0 && (
            <div className="border-t border-border/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {emails.length} email{emails.length !== 1 ? "s" : ""} in allowlist
              </p>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
