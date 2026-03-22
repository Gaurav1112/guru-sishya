import type { StateCreator } from "zustand";

export type AIProviderType = "static" | "gemini" | "claude" | "groq" | "openrouter" | "ollama";

export interface SettingsState {
  apiKey: string;
  aiProvider: AIProviderType;
  theme: "dark" | "light";
  soundEnabled: boolean;
  dailyGoal: number; // minutes
  timezone: string;
}

export interface SettingsActions {
  setApiKey: (key: string) => void;
  setAIProvider: (provider: AIProviderType) => void;
  setTheme: (theme: "dark" | "light") => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDailyGoal: (minutes: number) => void;
}

export type SettingsSlice = SettingsState & SettingsActions;

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  SettingsSlice
> = (set) => ({
  // State
  apiKey: "",
  aiProvider: "static" as AIProviderType,
  theme: "dark",
  soundEnabled: false,
  dailyGoal: 15,
  timezone: "UTC",

  // Actions
  setApiKey: (key) =>
    set((state) => {
      state.apiKey = key;
    }),
  setAIProvider: (provider) =>
    set((state) => {
      state.aiProvider = provider;
    }),
  setTheme: (theme) =>
    set((state) => {
      state.theme = theme;
    }),
  setSoundEnabled: (enabled) =>
    set((state) => {
      state.soundEnabled = enabled;
    }),
  setDailyGoal: (minutes) =>
    set((state) => {
      state.dailyGoal = minutes;
    }),
});
