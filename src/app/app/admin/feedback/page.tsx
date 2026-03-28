"use client";

import { useState, useEffect } from "react";
import { Bug, Zap, Lightbulb, RefreshCw, Trash2 } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { BackButton } from "@/components/back-button";

interface FeedbackItem {
  type: string;
  message: string;
  page: string;
  screenSize: string;
  connection: string;
  userAgent: string;
  timestamp: string;
}

const TYPE_CONFIG = {
  bug: { icon: Bug, color: "text-red-400 border-red-400/30 bg-red-400/5", label: "Bug" },
  lag: { icon: Zap, color: "text-gold border-gold/30 bg-gold/5", label: "Performance" },
  idea: { icon: Lightbulb, color: "text-teal border-teal/30 bg-teal/5", label: "Feature" },
} as Record<string, { icon: typeof Bug; color: string; label: string }>;

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // Load from localStorage (pending feedback stored when API fails)
    const stored = JSON.parse(localStorage.getItem("gs-pending-feedback") ?? "[]");
    // Also check admin feedback store
    const adminStored = JSON.parse(localStorage.getItem("gs-admin-feedback") ?? "[]");
    setFeedback([...adminStored, ...stored].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, []);

  const filtered = filter === "all" ? feedback : feedback.filter((f) => f.type === filter);

  function clearAll() {
    if (!confirm("Clear all feedback?")) return;
    localStorage.removeItem("gs-pending-feedback");
    localStorage.removeItem("gs-admin-feedback");
    setFeedback([]);
  }

  return (
    <PageTransition>
      <div className="max-w-3xl">
        <BackButton href="/app/admin" label="Back to Admin" />
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-bold">User Feedback</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="size-3" /> Clear All
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          {["all", "bug", "lag", "idea"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === t
                  ? "bg-saffron/20 text-saffron border border-saffron/30"
                  : "border border-border/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "all" ? `All (${feedback.length})` : `${TYPE_CONFIG[t]?.label} (${feedback.filter((f) => f.type === t).length})`}
            </button>
          ))}
        </div>

        {/* Feedback list */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border/50 bg-surface p-8 text-center">
            <p className="text-muted-foreground">No feedback yet.</p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Feedback from users will appear here. Check Vercel logs for server-side entries.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item, i) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.bug;
              const Icon = config.icon;
              return (
                <div key={i} className={`rounded-xl border ${config.color} p-4`}>
                  <div className="flex items-start gap-3">
                    <Icon className="size-4 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{item.message}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>Page: {item.page}</span>
                        <span>Screen: {item.screenSize}</span>
                        <span>Connection: {item.connection}</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground/50 mt-6 text-center">
          Server-side feedback is logged to Vercel console (check Runtime Logs).
          If Supabase is configured, feedback is also stored in the &quot;feedback&quot; table.
        </p>
      </div>
    </PageTransition>
  );
}
