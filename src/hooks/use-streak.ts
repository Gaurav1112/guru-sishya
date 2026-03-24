"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  checkStreak,
  recordDailyActivity,
  type StreakState,
} from "@/lib/gamification/streaks";

/**
 * Runs on app load to check and update the streak for today.
 * Updates the Zustand store and records activity in Dexie.
 *
 * Handles streak-freeze auto-consumption: when the user missed exactly one
 * day but has a freeze available, the freeze is consumed, the streak is kept,
 * and a saffron toast notifies the user.
 */
export function useStreak() {
  const { currentStreak, longestStreak, streakFreezes, setStreak, addXP, addCoins, queueCelebration } =
    useStore();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastActivityDate = localStorage.getItem("lastStreakDate") ?? "";

    // Guard: never fire twice for the same calendar day
    if (lastActivityDate === today) return;

    // Guard: don't fire the freeze-used toast twice for the same missed date
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
    const freezeUsedKey = `gs-streak-freeze-used-${yesterday}`;

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

    // ── Streak freeze was auto-consumed ──────────────────────────────────────
    if (result.status === "frozen") {
      // Deduct one freeze from the store (checkStreak already decremented
      // freezesAvailable in newState, so sync the store to match)
      useStore.setState((s) => ({
        streakFreezes: Math.max(0, s.streakFreezes - 1),
      }));

      // Show notification only once per missed day
      if (!localStorage.getItem(freezeUsedKey)) {
        localStorage.setItem(freezeUsedKey, "1");
        const savedStreak = result.newState.currentStreak;
        toast("Your streak freeze saved your streak!", {
          description: `Your ${savedStreak}-day streak is protected. You have ${result.newState.freezesAvailable} freeze${result.newState.freezesAvailable !== 1 ? "s" : ""} remaining.`,
          icon: "🧊",
          duration: 5000,
          style: {
            borderColor: "hsl(var(--saffron) / 0.5)",
            backgroundColor: "hsl(var(--saffron) / 0.08)",
            color: "hsl(var(--foreground))",
          },
        });
      }
      return;
    }

    // ── Handle milestone rewards ─────────────────────────────────────────────
    if (result.milestone) {
      const { milestone } = result;
      if (milestone.xp > 0) {
        addXP(milestone.xp);
      }
      if (milestone.freeze && milestone.freeze > 0) {
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
