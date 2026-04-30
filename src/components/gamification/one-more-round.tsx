"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { OneMoreRoundTrigger } from "@/lib/gamification/one-more-round";

interface OneMoreRoundProps {
  trigger: OneMoreRoundTrigger | null;
  onAccept: () => void;
  onDismiss: () => void;
}

/**
 * Slides up from the bottom after quiz/session completion.
 * Auto-dismisses after 10 seconds. Never guilt-trips.
 */
export function OneMoreRound({ trigger, onAccept, onDismiss }: OneMoreRoundProps) {
  const [dismissed, setDismissed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [declined, setDeclined] = useState(false);

  // Reset state whenever a new trigger arrives
  useEffect(() => {
    if (!trigger) return;
    setDismissed(false);
    setDeclined(false);
    setSecondsLeft(10);
  }, [trigger]);

  // Countdown auto-dismiss
  useEffect(() => {
    if (!trigger || dismissed || declined) return;
    if (secondsLeft <= 0) {
      setDismissed(true);
      onDismiss();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [trigger, dismissed, declined, secondsLeft, onDismiss]);

  function handleAccept() {
    setDismissed(true);
    onAccept();
  }

  function handleDecline() {
    setDeclined(true);
    // Show positive message briefly then dismiss
    setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, 2000);
  }

  const visible = !!trigger && !dismissed;

  const xpLabel =
    trigger && trigger.xpMultiplier > 1
      ? ` (${trigger.xpMultiplier}x XP)`
      : "";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="one-more-round"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-surface shadow-2xl p-5">
            {declined ? (
              <div className="text-center py-2">
                <p className="text-lg font-heading font-semibold text-foreground">
                  Great session!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Rest well — tomorrow&apos;s daily quests reset at midnight.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {iconForType(trigger!.type)}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {secondsLeft}s
                    </span>
                  </div>
                  {trigger!.xpMultiplier > 1 && (
                    <span className="rounded-full bg-saffron/20 px-2 py-0.5 text-xs font-semibold text-saffron">
                      {trigger!.xpMultiplier}x XP
                    </span>
                  )}
                </div>

                {/* Message */}
                <p className="text-sm text-foreground mb-1">
                  {trigger!.message}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  {trigger!.action}{xpLabel}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 rounded-xl bg-saffron px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                  >
                    Let&apos;s go!
                  </button>
                  <button
                    onClick={handleDecline}
                    className="flex-1 rounded-xl border border-border/60 bg-transparent px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/30"
                  >
                    Maybe later
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function iconForType(type: OneMoreRoundTrigger["type"]): string {
  const map: Record<OneMoreRoundTrigger["type"], string> = {
    near_miss: "🎯",
    close_to_badge: "🏅",
    close_to_level: "⬆️",
    streak_active: "🔥",
    daily_available: "☀️",
    decay_alert: "⏳",
    cliffhanger: "🚀",
  };
  return map[type] ?? "✨";
}
