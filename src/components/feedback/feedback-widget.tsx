"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, X, Send, Bug, Lightbulb, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FEEDBACK_TYPES = [
  { key: "bug", label: "Bug Report", icon: Bug, color: "text-red-400" },
  { key: "lag", label: "Performance Issue", icon: Zap, color: "text-gold" },
  { key: "idea", label: "Feature Request", icon: Lightbulb, color: "text-teal" },
] as const;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  async function handleSubmit() {
    if (!message.trim()) return;
    setSending(true);

    const payload = {
      type,
      message: message.trim(),
      page: page || window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as unknown as { connection?: { effectiveType?: string } }).connection?.effectiveType ?? "unknown",
    };

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Store locally if API fails
      const stored = JSON.parse(localStorage.getItem("gs-pending-feedback") ?? "[]");
      stored.push(payload);
      localStorage.setItem("gs-pending-feedback", JSON.stringify(stored));
    }

    setSubmitted(true);
    setSending(false);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setMessage("");
      setType("bug");
    }, 2000);
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-border/50 bg-surface shadow-lg hover:bg-surface-hover transition-colors"
        aria-label="Send feedback"
        title="Report a bug or suggest a feature"
      >
        <MessageSquarePlus className="size-4 text-muted-foreground" />
      </button>

      {/* Feedback modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-border/50 bg-surface shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
              <p className="text-sm font-semibold">Send Feedback</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close feedback form" className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {submitted ? (
              <div className="p-6 text-center">
                <p className="text-teal font-semibold">Thank you!</p>
                <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve Guru Sishya.</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Type selector */}
                <div className="flex gap-2">
                  {FEEDBACK_TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        type === t.key
                          ? "border-saffron/50 bg-saffron/10 text-saffron"
                          : "border-border/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <t.icon className="size-3.5" />
                      {t.label.split(" ")[0]}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-label="Feedback message"
                  placeholder={
                    type === "bug"
                      ? "Describe the bug... What happened? What did you expect?"
                      : type === "lag"
                        ? "Where did you experience lag? Which page/feature?"
                        : "What feature would make Guru Sishya better?"
                  }
                  className="w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-saffron/50 focus:outline-none resize-none"
                  rows={3}
                />

                {/* Page context */}
                <input
                  type="text"
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  aria-label="Page URL where issue occurred"
                  placeholder={`Page: ${currentPath}`}
                  className="w-full rounded-lg border border-border/30 bg-background px-3 py-1.5 text-xs placeholder:text-muted-foreground/50 focus:border-saffron/50 focus:outline-none"
                />

                {/* Submit */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!message.trim() || sending}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="size-3.5" />
                  {sending ? "Sending..." : "Send Feedback"}
                </button>

                <p className="text-[10px] text-muted-foreground/50 text-center">
                  Includes: page URL, screen size, browser info for debugging
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
