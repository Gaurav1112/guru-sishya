import type { StateCreator } from "zustand";
import { db } from "@/lib/db";
import { levelFromXP } from "@/lib/gamification/xp";

export interface GameState {
  totalXP: number;
  level: number;
  coins: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  /** XP earned today (resets at midnight). Persisted via partialize in store.ts. */
  dailyXP: number;
  /** ISO date (YYYY-MM-DD) when dailyXP was last reset */
  dailyXPDate: string;
  /** ISO string timestamp when the active XP boost expires, or null if none */
  activeXPBoost: string | null;
  /** Number of hint tokens available for use in quizzes */
  hintTokens: number;
  /** Whether a streak repair powerup is available */
  streakRepairAvailable: boolean;
}

export interface GameActions {
  addXP: (amount: number) => void;
  addCoins: (amount: number, reason: string) => void;
  /** Returns true if coins were spent, false if insufficient balance */
  spendCoins: (amount: number, reason: string) => boolean;
  setStreak: (current: number, longest: number) => void;
  addStreakFreeze: () => void;
  activateXPBoost: () => void;
  addHintToken: () => void;
  useHintToken: () => boolean;
  activateStreakRepair: () => void;
  consumeStreakRepair: () => void;
}

export type GameSlice = GameState & GameActions;

export const createGameSlice: StateCreator<
  GameSlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  GameSlice
> = (set, get) => ({
  // State
  totalXP: 0,
  level: 1,
  coins: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakFreezes: 0,
  dailyXP: 0,
  dailyXPDate: "",
  activeXPBoost: null,
  hintTokens: 0,
  streakRepairAvailable: false,

  // Actions
  addXP: (amount) =>
    set((state) => {
      // Apply 1.5x multiplier if an XP boost is active and not expired
      let effective = amount;
      if (state.activeXPBoost) {
        if (new Date(state.activeXPBoost) > new Date()) {
          effective = Math.round(amount * 1.5);
        } else {
          // Boost has expired — clear it
          state.activeXPBoost = null;
        }
      }

      state.totalXP += effective;
      state.level = levelFromXP(state.totalXP);

      // Reset dailyXP counter if the date has changed
      const today = new Date().toISOString().slice(0, 10);
      if (state.dailyXPDate !== today) {
        state.dailyXP = 0;
        state.dailyXPDate = today;
      }
      state.dailyXP += effective;
    }),

  addCoins: (amount, reason) => {
    set((state) => {
      state.coins += amount;
    });
    // Log to Dexie (fire-and-forget; ignore errors in tests)
    db.coinTransactions
      .add({ type: "earn", amount, reason, createdAt: new Date() })
      .catch(() => {});
  },

  spendCoins: (amount, reason) => {
    const { coins } = get();
    if (coins < amount) return false;
    set((state) => {
      state.coins -= amount;
    });
    db.coinTransactions
      .add({ type: "spend", amount, reason, createdAt: new Date() })
      .catch(() => {});
    return true;
  },

  setStreak: (current, longest) =>
    set((state) => {
      state.currentStreak = current;
      state.longestStreak = longest;
    }),

  addStreakFreeze: () =>
    set((state) => {
      state.streakFreezes += 1;
    }),

  activateXPBoost: () =>
    set((state) => {
      // Boost lasts 1 hour from now
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      state.activeXPBoost = expiry.toISOString();
    }),

  addHintToken: () =>
    set((state) => {
      state.hintTokens += 1;
    }),

  useHintToken: () => {
    const { hintTokens } = get();
    if (hintTokens <= 0) return false;
    set((state) => {
      state.hintTokens -= 1;
    });
    return true;
  },

  activateStreakRepair: () =>
    set((state) => {
      state.streakRepairAvailable = true;
    }),

  consumeStreakRepair: () =>
    set((state) => {
      state.streakRepairAvailable = false;
    }),
});
