import { db } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  freezesAvailable: number;
  lastActivityDate: string; // YYYY-MM-DD
}

export interface StreakMilestone {
  day: number;
  xp: number;
  badge?: string;
  freeze?: number;
  flameColor: string;
}

export interface StreakCheckResult {
  status: "maintained" | "frozen" | "broken" | "already_done";
  newState: StreakState;
  milestone?: StreakMilestone;
}

// ────────────────────────────────────────────────────────────────────────────
// Milestones
// ────────────────────────────────────────────────────────────────────────────

export const STREAK_MILESTONES: StreakMilestone[] = [
  { day: 3, xp: 0, freeze: 1, flameColor: "yellow" },
  { day: 7, xp: 50, badge: "nityam", flameColor: "orange" },
  { day: 14, xp: 100, flameColor: "orange" },
  { day: 30, xp: 200, badge: "tapasvi", freeze: 1, flameColor: "blue" },
  { day: 100, xp: 500, badge: "vajra_sankalp", freeze: 1, flameColor: "purple" },
  { day: 365, xp: 1000, badge: "akhand_sadhana", freeze: 2, flameColor: "diamond" },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / msPerDay);
}

function getMilestoneForStreak(streak: number): StreakMilestone | undefined {
  return STREAK_MILESTONES.find((m) => m.day === streak);
}

// ────────────────────────────────────────────────────────────────────────────
// getFlameColor
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns the flame color for a given streak count.
 * <7 yellow, 7-29 orange, 30-99 blue, 100-364 purple, 365+ diamond
 */
export function getFlameColor(streak: number): string {
  if (streak >= 365) return "diamond";
  if (streak >= 100) return "purple";
  if (streak >= 30) return "blue";
  if (streak >= 7) return "orange";
  return "yellow";
}

// ────────────────────────────────────────────────────────────────────────────
// checkStreak
// ────────────────────────────────────────────────────────────────────────────

/**
 * Determines the streak status for today.
 *
 * - already_done : lastActivityDate === today
 * - maintained   : lastActivityDate === yesterday (streak +1)
 * - frozen       : gap > 1 day and freeze available (uses one freeze, streak unchanged)
 * - broken       : gap > 1 day and no freeze (resets to 1 for today)
 */
export function checkStreak(state: StreakState, today: string): StreakCheckResult {
  const { lastActivityDate, currentStreak, longestStreak, freezesAvailable } = state;

  // No prior activity — start fresh
  if (!lastActivityDate) {
    const newStreak = 1;
    const newLongest = Math.max(longestStreak, newStreak);
    const newState: StreakState = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      freezesAvailable,
      lastActivityDate: today,
    };
    const milestone = getMilestoneForStreak(newStreak);
    return { status: "maintained", newState, milestone };
  }

  const gap = daysBetween(lastActivityDate, today);

  // Already recorded today
  if (gap === 0) {
    return {
      status: "already_done",
      newState: state,
    };
  }

  // Consecutive day — maintain streak
  if (gap === 1) {
    const newStreak = currentStreak + 1;
    const newLongest = Math.max(longestStreak, newStreak);
    const newState: StreakState = {
      currentStreak: newStreak,
      longestStreak: newLongest,
      freezesAvailable,
      lastActivityDate: today,
    };
    const milestone = getMilestoneForStreak(newStreak);
    return { status: "maintained", newState, milestone };
  }

  // Gap > 1 day — check for freeze
  if (gap === 2 && freezesAvailable > 0) {
    const newState: StreakState = {
      currentStreak,
      longestStreak,
      freezesAvailable: freezesAvailable - 1,
      lastActivityDate: today,
    };
    return { status: "frozen", newState };
  }

  // Broken — reset to 1
  const newStreak = 1;
  const newLongest = Math.max(longestStreak, newStreak);
  const newState: StreakState = {
    currentStreak: newStreak,
    longestStreak: newLongest,
    freezesAvailable,
    lastActivityDate: today,
  };
  return { status: "broken", newState };
}

// ────────────────────────────────────────────────────────────────────────────
// recordDailyActivity
// ────────────────────────────────────────────────────────────────────────────

/**
 * Records today's activity in the Dexie streakHistory table.
 * If a record for today already exists it is a no-op.
 */
export async function recordDailyActivity(today: string): Promise<void> {
  const existing = await db.streakHistory.where("date").equals(today).first();
  if (!existing) {
    await db.streakHistory.add({ date: today, maintained: true });
  }
}
