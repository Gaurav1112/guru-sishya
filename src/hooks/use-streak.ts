"use client";
import { useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  checkStreak,
  recordDailyActivity,
  type StreakState,
} from "@/lib/gamification/streaks";

/**
 * Runs on app load to check and update the streak for today.
 * Updates the Zustand store and records activity in Dexie.
 */
export function useStreak() {
  const { currentStreak, longestStreak, streakFreezes, setStreak, addXP, addCoins, queueCelebration } =
    useStore();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastActivityDate = localStorage.getItem("lastStreakDate") ?? "";

    const state: StreakState = {
      currentStreak,
      longestStreak,
      freezesAvailable: streakFreezes,
      lastActivityDate,
    };

    const result = checkStreak(state, today);

    if (result.status === "already_done") return;

    // Update Zustand streak values
    setStreak(result.newState.currentStreak, result.newState.longestStreak);

    // Persist last activity date to localStorage for quick retrieval
    localStorage.setItem("lastStreakDate", today);

    // Record in Dexie (fire-and-forget)
    recordDailyActivity(today).catch(() => {});

    // Handle milestone rewards
    if (result.milestone) {
      const { milestone } = result;
      if (milestone.xp > 0) {
        addXP(milestone.xp);
      }
      if (milestone.freeze && milestone.freeze > 0) {
        // Streak freezes are stored in the zustand store's streakFreezes field
        // We update via setStreak with a side-effect through addCoins as a proxy
        // Actually update directly via store set — use a workaround via the existing API
        useStore.setState((s) => ({ streakFreezes: s.streakFreezes + (milestone.freeze ?? 0) }));
      }
      queueCelebration({
        type: "streak_milestone",
        data: {
          streak: result.newState.currentStreak,
          milestone,
        },
      });
    } else if (result.status === "maintained") {
      // Subtle XP gain for maintaining streak (5 XP base)
      addXP(5);
      if (result.newState.currentStreak > 1) {
        addCoins(1, "daily streak");
      }
    } else if (result.status === "broken") {
      // Streak was broken — queue an emotional recovery overlay
      if (currentStreak > 1) {
        queueCelebration({
          type: "streak_broken",
          data: { lostStreak: currentStreak },
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
}
