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
}

export interface GameActions {
  addXP: (amount: number) => void;
  addCoins: (amount: number, reason: string) => void;
  /** Returns true if coins were spent, false if insufficient balance */
  spendCoins: (amount: number, reason: string) => boolean;
  setStreak: (current: number, longest: number) => void;
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

  // Actions
  addXP: (amount) =>
    set((state) => {
      state.totalXP += amount;
      state.level = levelFromXP(state.totalXP);
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
});
