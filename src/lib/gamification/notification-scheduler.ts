/**
 * Local notification scheduler for Guru Sishya.
 *
 * Schedules notifications using the browser Notification API with setTimeout.
 * Works when the tab is open — no server-side push needed for MVP.
 *
 * Notification types:
 *  - streak-at-risk:          Fires at user's preferred time if no activity today
 *  - daily-challenge-available: Fires once daily when a new challenge is ready
 *  - comeback-nudge:          Fires if user hasn't been active for 2+ days
 */

const SCHEDULED_KEY = "guru-sishya-notification-timers";
const LAST_NOTIFICATION_KEY = "guru-sishya-last-notification";
const PREFERRED_HOUR_KEY = "guru-sishya-notification-hour";

export type NotificationType =
  | "streak-at-risk"
  | "daily-challenge-available"
  | "comeback-nudge";

interface NotificationTemplate {
  title: string;
  body: string;
  tag: string;
  url: string;
}

// ── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  "streak-at-risk": {
    title: "Your streak is at risk!",
    body: "Complete a session today to keep your streak alive. Don't let your progress slip away!",
    tag: "streak-at-risk",
    url: "/app/dashboard",
  },
  "daily-challenge-available": {
    title: "New Daily Challenge!",
    body: "A fresh challenge is waiting for you. Complete it to earn bonus XP and keep your skills sharp!",
    tag: "daily-challenge",
    url: "/app/dashboard",
  },
  "comeback-nudge": {
    title: "We miss you!",
    body: "It's been a while since your last session. Come back and pick up where you left off — your next lesson awaits!",
    tag: "comeback-nudge",
    url: "/app/dashboard",
  },
};

// ── Active timer IDs (in-memory, cleared on page unload) ────────────────────

const activeTimers: number[] = [];

// ── Helpers ─────────────────────────────────────────────────────────────────

function canNotify(): boolean {
  if (typeof window === "undefined") return false;
  return "Notification" in window && Notification.permission === "granted";
}

/** Get user's preferred notification hour (0-23), default 9 AM. */
export function getPreferredHour(): number {
  if (typeof window === "undefined") return 9;
  const stored = localStorage.getItem(PREFERRED_HOUR_KEY);
  if (stored !== null) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) return parsed;
  }
  return 9;
}

/** Set user's preferred notification hour (0-23). */
export function setPreferredHour(hour: number): void {
  if (typeof window === "undefined") return;
  const clamped = Math.max(0, Math.min(23, Math.round(hour)));
  localStorage.setItem(PREFERRED_HOUR_KEY, String(clamped));
}

/** Get milliseconds until a given hour today (or tomorrow if that hour has passed). */
function msUntilHour(hour: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);

  if (target.getTime() <= now.getTime()) {
    // Hour already passed today — schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

/** Check if we already sent a notification of this type today. */
function alreadySentToday(type: NotificationType): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(LAST_NOTIFICATION_KEY);
  if (!stored) return false;

  try {
    const record: Record<string, string> = JSON.parse(stored);
    const lastDate = record[type];
    if (!lastDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return lastDate === today;
  } catch {
    return false;
  }
}

/** Mark a notification type as sent today. */
function markSentToday(type: NotificationType): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  let record: Record<string, string> = {};
  try {
    const stored = localStorage.getItem(LAST_NOTIFICATION_KEY);
    if (stored) record = JSON.parse(stored);
  } catch {
    // reset
  }
  record[type] = today;
  localStorage.setItem(LAST_NOTIFICATION_KEY, JSON.stringify(record));
}

// ── Show notification ───────────────────────────────────────────────────────

function showNotification(type: NotificationType): void {
  if (!canNotify()) return;
  if (alreadySentToday(type)) return;

  const template = TEMPLATES[type];

  try {
    const notification = new Notification(template.title, {
      body: template.body,
      icon: "/logo-mark.png",
      tag: template.tag,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = template.url;
      notification.close();
    };

    markSentToday(type);
  } catch (err) {
    // Service worker context — use registration.showNotification instead
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.showNotification(template.title, {
            body: template.body,
            icon: "/logo-mark.png",
            tag: template.tag,
            data: { url: template.url },
          });
          markSentToday(type);
        }
      }).catch(() => {
        console.error("[notification-scheduler] Failed to show notification:", err);
      });
    }
  }
}

// ── Schedule functions ──────────────────────────────────────────────────────

/**
 * Schedule a streak-at-risk notification.
 * Fires at the user's preferred hour if they haven't had activity today.
 */
export function scheduleStreakReminder(): void {
  if (!canNotify()) return;

  const hour = getPreferredHour();
  const delay = msUntilHour(hour);

  const timer = window.setTimeout(() => {
    // Check if user has been active today before showing
    const lastStreakDate = localStorage.getItem("lastStreakDate") ?? "";
    const today = new Date().toISOString().slice(0, 10);

    if (lastStreakDate !== today) {
      showNotification("streak-at-risk");
    }

    // Re-schedule for tomorrow
    scheduleStreakReminder();
  }, delay);

  activeTimers.push(timer);
}

/**
 * Schedule a daily challenge notification.
 * Fires at the user's preferred hour.
 */
export function scheduleDailyChallengeReminder(): void {
  if (!canNotify()) return;

  const hour = getPreferredHour();
  const delay = msUntilHour(hour);

  const timer = window.setTimeout(() => {
    showNotification("daily-challenge-available");

    // Re-schedule for tomorrow
    scheduleDailyChallengeReminder();
  }, delay);

  activeTimers.push(timer);
}

/**
 * Check and show a comeback nudge if user has been away 2+ days.
 * Called once on page load — not scheduled on a timer.
 */
export function checkAndShowComebackNudge(): void {
  if (!canNotify()) return;

  const lastStreakDate = localStorage.getItem("lastStreakDate") ?? "";
  if (!lastStreakDate) return;

  const last = new Date(lastStreakDate);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays >= 2) {
    showNotification("comeback-nudge");
  }
}

/**
 * Start all scheduled notifications.
 * Call this once from the app layout or dashboard after permission is granted.
 */
export function startNotificationScheduler(): void {
  if (!canNotify()) return;

  // Clear any existing timers
  stopNotificationScheduler();

  scheduleStreakReminder();
  scheduleDailyChallengeReminder();
  checkAndShowComebackNudge();

  // Store that scheduler is active
  if (typeof window !== "undefined") {
    localStorage.setItem(SCHEDULED_KEY, "true");
  }
}

/**
 * Stop all scheduled notifications and clear timers.
 */
export function stopNotificationScheduler(): void {
  while (activeTimers.length > 0) {
    const timer = activeTimers.pop();
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(SCHEDULED_KEY);
  }
}
