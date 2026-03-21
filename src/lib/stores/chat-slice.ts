// ────────────────────────────────────────────────────────────────────────────
// Chat slice — ephemeral Feynman session state (NOT persisted)
// ────────────────────────────────────────────────────────────────────────────

import type { StateCreator } from "zustand";
import type { MasteryScores } from "@/lib/types";

export type FeynmanStatus =
  | "priming"
  | "teaching"
  | "recalling"
  | "probing"
  | "struggling"
  | "reteaching"
  | "verifying"
  | "complete"
  | "loading";

export interface FeynmanChatState {
  topicId: number;
  topicName: string;
  concept: string;
  phase: number; // 1–7
  round: number; // 1–4
  masteryScores: MasteryScores;
  messages: { role: "user" | "assistant"; content: string }[];
  status: FeynmanStatus;
  mastered: boolean;
}

export interface ChatSlice {
  feynmanChat: FeynmanChatState | null;
  startFeynmanChat: (
    topicId: number,
    topicName: string,
    concept: string
  ) => void;
  setFeynmanPhase: (phase: number) => void;
  setFeynmanStatus: (status: FeynmanStatus) => void;
  setFeynmanRound: (round: number) => void;
  updateMasteryScores: (scores: Partial<MasteryScores>) => void;
  addChatMessage: (role: "user" | "assistant", content: string) => void;
  endFeynmanChat: (mastered: boolean) => void;
}

const defaultMasteryScores: MasteryScores = {
  completeness: 0,
  accuracy: 0,
  depth: 0,
  originality: 0,
};

export const createChatSlice: StateCreator<
  ChatSlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  ChatSlice
> = (set) => ({
  feynmanChat: null,

  startFeynmanChat: (topicId, topicName, concept) =>
    set((state) => {
      state.feynmanChat = {
        topicId,
        topicName,
        concept,
        phase: 1,
        round: 1,
        masteryScores: { ...defaultMasteryScores },
        messages: [],
        status: "priming",
        mastered: false,
      };
    }),

  setFeynmanPhase: (phase) =>
    set((state) => {
      if (!state.feynmanChat) return;
      state.feynmanChat.phase = phase;
    }),

  setFeynmanStatus: (status) =>
    set((state) => {
      if (!state.feynmanChat) return;
      state.feynmanChat.status = status;
    }),

  setFeynmanRound: (round) =>
    set((state) => {
      if (!state.feynmanChat) return;
      state.feynmanChat.round = round;
    }),

  updateMasteryScores: (scores) =>
    set((state) => {
      if (!state.feynmanChat) return;
      Object.assign(state.feynmanChat.masteryScores, scores);
    }),

  addChatMessage: (role, content) =>
    set((state) => {
      if (!state.feynmanChat) return;
      state.feynmanChat.messages.push({ role, content });
    }),

  endFeynmanChat: (mastered) =>
    set((state) => {
      if (!state.feynmanChat) return;
      state.feynmanChat.mastered = mastered;
      state.feynmanChat.status = "complete";
    }),
});
