"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  checkStreak,
  recordDailyActivity,
  type StreakState,
  type StreakCheckResult,
} from "@/lib/gamification/streaks";

export interface PendingFreeze {
  streak: number;
  freezesAvailable: number;
  result: StreakCheckResult;
}

/**
 * Runs on app load to check and update the streak for today.
 * Updates the Zustand store and records activity in Dexie.
 *
 * When the user missed exactly one day and has a freeze available, instead of
 * auto-consuming, it returns a `pendingFreeze` object so a modal can let the
 * user choose. Call `confirmFreeze()` to use the freeze, or `declineFreeze()`
 * to let the streak break.
 */
export function useStreak() {
  const { currentStreak, longestStreak, streakFreezes, setStreak, addXP, addCoins, queueCelebration } =
    useStore();

  const [pendingFreeze, setPendingFreeze] = useState<PendingFreeze | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const lastActivityDate = localStorage.getItem("lastStreakDate") ?? "";

    // Guard: never fire twice for the same calendar day
    if (lastActivityDate === today) return;

    const state: StreakState = {
      currentStreak,
      longestStreak,
      freezesAvailable: streakFreezes,
      lastActivityDate,
    };

    const result = checkStreak(state, today);

    if (result.status === "already_done") return;

    // ── Freeze available — defer to modal ──────────────────────────────────
    if (result.status === "frozen") {
      // Don't auto-consume. Show a modal so user can choose.
      // Guard: don't show the modal twice for the same gap
      const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);
      const freezeHandledKey = `gs-streak-freeze-handled-${yesterday}`;
      if (localStorage.getItem(freezeHandledKey)) {
        // Already handled (e.g. page refresh after choosing) — apply freeze silently
        applyFreezeInternal(result, today);
        return;
      }

      setPendingFreeze({
        streak: currentStreak,
        freezesAvailable: streakFreezes,
        result,
      });
      return;
    }

    // ── No freeze needed — process normally ────────────────────────────────
    applyResultInternal(result, today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  /** Apply a non-freeze streak result (maintained, broken) */
  function applyResultInternal(result: StreakCheckResult, today: string) {
    setStreak(result.newState.currentStreak, result.newState.longestStreak);
    localStorage.setItem("lastStreakDate", today);
    recordDailyActivity(today).catch(() => {});

    if (result.milestone) {
      const { milestone } = result;
      if (milestone.xp > 0) addXP(milestone.xp);
      if (milestone.freeze && milestone.freeze > 0) {
        useStore.setState((s) => ({ streakFreezes: s.streakFreezes + (milestone.freeze ?? 0) }));
      }
      const streakDay = result.newState.currentStreak;
      if (streakDay === 7) addCoins(15, "streak_milestone_7");
      else if (streakDay === 30) addCoins(50, "streak_milestone_30");
      else if (streakDay === 100) addCoins(100, "streak_milestone_100");

      queueCelebration({
        type: "streak_milestone",
        data: { streak: result.newState.currentStreak, milestone },
      });
    } else if (result.status === "maintained") {
      addXP(5);
      if (result.newState.currentStreak > 1) addCoins(1, "daily streak");
    } else if (result.status === "broken") {
      if (currentStreak > 1) {
        queueCelebration({
          type: "streak_broken",
          data: { lostStreak: currentStreak },
        });
      }
    }
  }

  /** Apply the freeze — consume one freeze and keep the streak */
  function applyFreezeInternal(result: StreakCheckResult, today: string) {
    setStreak(result.newState.currentStreak, result.newState.longestStreak);
    localStorage.setItem("lastStreakDate", today);
    recordDailyActivity(today).catch(() => {});

    useStore.setState((s) => ({
      streakFreezes: Math.max(0, s.streakFreezes - 1),
    }));
  }

  /** User chose to use the freeze */
  const confirmFreeze = useCallback(() => {
    if (!pendingFreeze) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

    applyFreezeInternal(pendingFreeze.result, today);

    // Mark as handled so refresh doesn't re-prompt
    localStorage.setItem(`gs-streak-freeze-handled-${yesterday}`, "1");

    toast("Streak freeze used!", {
      description: `Your ${pendingFreeze.streak}-day streak is safe. ${pendingFreeze.freezesAvailable - 1} freeze${pendingFreeze.freezesAvailable - 1 !== 1 ? "s" : ""} remaining.`,
      icon: "\uD83E\uDDCA",
      duration: 5000,
      style: {
        borderColor: "hsl(var(--saffron) / 0.5)",
        backgroundColor: "hsl(var(--saffron) / 0.08)",
        color: "hsl(var(--foreground))",
      },
    });

    setPendingFreeze(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFreeze]);

  /** User chose to let the streak break */
  const declineFreeze = useCallback(() => {
    if (!pendingFreeze) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400_000).toISOString().slice(0, 10);

    // Re-compute as a broken streak (ignoring the freeze)
    const brokenState: StreakState = {
      currentStreak: 1,
      longestStreak: Math.max(pendingFreeze.result.newState.longestStreak, 1),
      freezesAvailable: pendingFreeze.freezesAvailable,
      lastActivityDate: today,
    };
    const brokenResult: StreakCheckResult = {
      status: "broken",
      newState: brokenState,
    };

    applyResultInternal(brokenResult, today);

    // Mark as handled
    localStorage.setItem(`gs-streak-freeze-handled-${yesterday}`, "1");

    setPendingFreeze(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFreeze]);

  return { pendingFreeze, confirmFreeze, declineFreeze };
}
