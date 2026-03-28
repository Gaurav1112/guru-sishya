"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { startNotificationScheduler } from "@/lib/gamification/notification-scheduler";
import { useStore } from "@/lib/store";

const DISMISSED_KEY = "guru-sishya-push-prompt-dismissed";
const VISIT_THRESHOLD = 3;

/**
 * One-time prompt that asks users to enable push notifications.
 *
 * Only shows:
 *  - After the user's 3rd visit (let them discover value first)
 *  - If notifications are supported and not yet granted
 *  - If the prompt hasn't been permanently dismissed
 */
export function PushNotificationPrompt() {
  const { supported, permission, subscribe } = usePushNotifications();
  const visitCount = useStore((s) => s.visitCount);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show if not supported, already granted, or denied
    if (!supported) return;
    if (permission === "granted" || permission === "denied") return;

    // Don't show before 3rd visit
    if (visitCount < VISIT_THRESHOLD) return;

    // Don't show if already dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") return;

    setVisible(true);
  }, [supported, permission, visitCount]);

  if (!visible) return null;

  async function handleEnable() {
    setLoading(true);
    const success = await subscribe();
    if (success) {
      startNotificationScheduler();
    }
    // Dismiss either way (don't nag on failure)
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    setLoading(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }

  return (
    <div className="relative rounded-xl border border-teal/30 bg-gradient-to-r from-teal/10 via-teal/5 to-saffron/5 p-4">
      {/* Close button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification prompt"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-start gap-4 pr-6">
        {/* Icon */}
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10">
          <Bell className="size-5 text-teal" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Never miss your streak
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Enable notifications to protect your streak and never miss a daily
            challenge. We&apos;ll only send reminders — no spam.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-3">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="bg-teal text-background hover:bg-teal/90 text-xs"
            >
              {loading ? "Enabling..." : "Enable Notifications"}
            </Button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
