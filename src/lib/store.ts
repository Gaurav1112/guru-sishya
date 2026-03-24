import { create, type StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  createSettingsSlice,
  type SettingsSlice,
} from "./stores/settings-slice";
import { createGameSlice, type GameSlice } from "./stores/game-slice";
import { createUISlice, type UISlice } from "./stores/ui-slice";
import { createQuizSlice, type QuizSlice } from "./stores/quiz-slice";
import { createChatSlice, type ChatSlice } from "./stores/chat-slice";

// ────────────────────────────────────────────────────────────────────────────
// Combined store state type
// ────────────────────────────────────────────────────────────────────────────

export type StoreState = SettingsSlice & GameSlice & UISlice & QuizSlice & ChatSlice;

// ────────────────────────────────────────────────────────────────────────────
// Keys that are persisted to localStorage
// ────────────────────────────────────────────────────────────────────────────

type PersistedState = Pick<
  StoreState,
  | "apiKey"
  | "aiProvider"
  | "theme"
  | "soundEnabled"
  | "dailyGoal"
  | "timezone"
  | "showOnLeaderboard"
  | "quizTimerEnabled"
  | "totalXP"
  | "level"
  | "coins"
  | "currentStreak"
  | "longestStreak"
  | "streakFreezes"
  | "dailyXP"
  | "dailyXPDate"
  | "activeXPBoost"
  | "hintTokens"
  | "streakRepairAvailable"
>;

// ────────────────────────────────────────────────────────────────────────────
// Store
// ────────────────────────────────────────────────────────────────────────────

// Each slice is typed against its own slice type; we use a cast so they
// compose correctly into the full StoreState without circular imports.
type ImmerStateCreator = StateCreator<
  StoreState,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  StoreState
>;

const rootSlice: ImmerStateCreator = (...args) => ({
  ...(createSettingsSlice as unknown as ImmerStateCreator)(...args),
  ...(createGameSlice as unknown as ImmerStateCreator)(...args),
  ...(createUISlice as unknown as ImmerStateCreator)(...args),
  ...(createQuizSlice as unknown as ImmerStateCreator)(...args),
  ...(createChatSlice as unknown as ImmerStateCreator)(...args),
});

export const useStore = create<StoreState>()(
  persist(
    immer(rootSlice),
    {
      name: "guru-sishya-store",
      partialize: (state): PersistedState => ({
        apiKey: state.apiKey,
        aiProvider: state.aiProvider,
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        dailyGoal: state.dailyGoal,
        timezone: state.timezone,
        showOnLeaderboard: state.showOnLeaderboard,
        totalXP: state.totalXP,
        level: state.level,
        coins: state.coins,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        streakFreezes: state.streakFreezes,
        dailyXP: state.dailyXP,
        dailyXPDate: state.dailyXPDate,
        activeXPBoost: state.activeXPBoost,
        hintTokens: state.hintTokens,
        streakRepairAvailable: state.streakRepairAvailable,
        quizTimerEnabled: state.quizTimerEnabled,
      }),
    }
  )
);
