import type { StateCreator } from "zustand";

export type AIProviderType = "static" | "gemini" | "claude" | "groq" | "openrouter" | "ollama";

export interface SettingsState {
  apiKey: string;
  aiProvider: AIProviderType;
  theme: "dark" | "light";
  soundEnabled: boolean;
  dailyGoal: number; // minutes
  timezone: string;
  showOnLeaderboard: boolean;
  quizTimerEnabled: boolean;
  displayName: string | null;
  onboardingCompleted: boolean;
  visitCount: number;
  preferredLanguage: "java" | "python" | "typescript" | "all";
  weeklyDigestEnabled: boolean;
  interviewDate: string | null;
  interviewCompany: string;
}

export interface SettingsActions {
  setApiKey: (key: string) => void;
  setAIProvider: (provider: AIProviderType) => void;
  setTheme: (theme: "dark" | "light") => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDailyGoal: (minutes: number) => void;
  setShowOnLeaderboard: (show: boolean) => void;
  setQuizTimerEnabled: (enabled: boolean) => void;
  setDisplayName: (name: string) => void;
  setOnboardingCompleted: (done: boolean) => void;
  incrementVisitCount: () => void;
  setPreferredLanguage: (lang: "java" | "python" | "typescript" | "all") => void;
  setWeeklyDigestEnabled: (enabled: boolean) => void;
  setInterviewDate: (date: string | null) => void;
  setInterviewCompany: (company: string) => void;
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
  showOnLeaderboard: true,
  quizTimerEnabled: false,
  displayName: null,
  onboardingCompleted: false,
  visitCount: 0,
  preferredLanguage: "all",
  weeklyDigestEnabled: false,
  interviewDate: null,
  interviewCompany: "",

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
  setShowOnLeaderboard: (show) =>
    set((state) => {
      state.showOnLeaderboard = show;
    }),
  setQuizTimerEnabled: (enabled) =>
    set((state) => {
      state.quizTimerEnabled = enabled;
    }),
  setDisplayName: (name) =>
    set((state) => {
      state.displayName = name.trim() || null;
    }),
  setOnboardingCompleted: (done) =>
    set((state) => { state.onboardingCompleted = done; }),
  incrementVisitCount: () =>
    set((state) => { state.visitCount += 1; }),
  setPreferredLanguage: (lang) =>
    set((state) => { state.preferredLanguage = lang; }),
  setWeeklyDigestEnabled: (enabled) =>
    set((state) => { state.weeklyDigestEnabled = enabled; }),
  setInterviewDate: (date) =>
    set((state) => { state.interviewDate = date; }),
  setInterviewCompany: (company) =>
    set((state) => { state.interviewCompany = company.trim(); }),
});
