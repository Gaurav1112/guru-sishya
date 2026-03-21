import type { StateCreator } from "zustand";

export interface Celebration {
  type:
    | "level_up"
    | "badge"
    | "streak_milestone"
    | "perfect_round"
    | "xp_gain";
  data: Record<string, unknown>;
}

export interface UIState {
  celebrationQueue: Celebration[];
  sidebarOpen: boolean;
}

export interface UIActions {
  queueCelebration: (celebration: Celebration) => void;
  dequeueCelebration: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export type UISlice = UIState & UIActions;

export const createUISlice: StateCreator<
  UISlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  UISlice
> = (set) => ({
  // State
  celebrationQueue: [],
  sidebarOpen: true,

  // Actions
  queueCelebration: (celebration) =>
    set((state) => {
      state.celebrationQueue.push(celebration);
    }),

  dequeueCelebration: () =>
    set((state) => {
      state.celebrationQueue.shift();
    }),

  setSidebarOpen: (open) =>
    set((state) => {
      state.sidebarOpen = open;
    }),
});
