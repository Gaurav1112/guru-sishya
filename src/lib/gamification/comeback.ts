// ────────────────────────────────────────────────────────────────────────────
// Comeback Mechanic — re-engagement flow for returning users
// ────────────────────────────────────────────────────────────────────────────

export interface ComebackCheck {
  eligible: boolean;
  daysAway: number;
}

export interface ComebackProgress {
  /** How many sessions the user has completed since returning (need 3 in 3 days) */
  sessionsCompleted: number;
  /** ISO date string when the comeback flow started */
  startedAt: string;
  /** ISO date string — 3 days after startedAt */
  deadline: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / msPerDay);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Determines whether the user qualifies for the comeback flow.
 * A user qualifies after 3 or more days of inactivity.
 *
 * @param lastActivityDate  YYYY-MM-DD of the most recent learning session
 * @param today             YYYY-MM-DD of today
 */
export function checkComeback(
  lastActivityDate: string,
  today: string
): ComebackCheck {
  if (!lastActivityDate) {
    return { eligible: false, daysAway: 0 };
  }
  const daysAway = daysBetween(lastActivityDate, today);
  return {
    eligible: daysAway >= 3,
    daysAway,
  };
}

/**
 * Starts a new comeback progress tracker.
 *
 * @param today  YYYY-MM-DD — the day the user returned
 */
export function startComebackProgress(today: string): ComebackProgress {
  return {
    sessionsCompleted: 0,
    startedAt: today,
    deadline: addDays(today, 3),
  };
}

/**
 * Records one completed session in the comeback progress.
 * Returns the updated progress object.
 */
export function recordComebackSession(
  progress: ComebackProgress
): ComebackProgress {
  return {
    ...progress,
    sessionsCompleted: progress.sessionsCompleted + 1,
  };
}

/**
 * Returns true when the comeback challenge has been completed
 * (3 sessions within 3 days).
 */
export function isComebackComplete(progress: ComebackProgress): boolean {
  return progress.sessionsCompleted >= 3;
}

/**
 * Returns true if the comeback deadline has passed without completion.
 */
export function isComebackExpired(
  progress: ComebackProgress,
  today: string
): boolean {
  return !isComebackComplete(progress) && today > progress.deadline;
}

/**
 * Returns a motivational message based on the current comeback state.
 */
export function getComebackMessage(daysAway: number): string {
  if (daysAway >= 30) {
    return "Welcome back! Knowledge never truly leaves — let's rekindle your learning journey.";
  }
  if (daysAway >= 14) {
    return `It's been ${daysAway} days, but every great journey has pauses. Ready to continue?`;
  }
  if (daysAway >= 7) {
    return `A week away makes the return sweeter. Your topics are waiting for you!`;
  }
  return `Welcome back! You've been away for ${daysAway} days — let's pick up where you left off.`;
}
