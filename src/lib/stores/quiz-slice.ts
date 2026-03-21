// ────────────────────────────────────────────────────────────────────────────
// Quiz slice — ephemeral session state (NOT persisted)
// ────────────────────────────────────────────────────────────────────────────

import type { StateCreator } from "zustand";
import type {
  QuizSessionState,
  GeneratedQuestion,
  AnsweredQuestion,
  BloomLevel,
} from "@/lib/quiz/types";

export interface QuizSlice {
  quiz: QuizSessionState | null;
  startQuiz: (
    topicId: number,
    topicName: string,
    isCalibration: boolean,
    startLevel?: BloomLevel
  ) => void;
  addQuestion: (question: GeneratedQuestion) => void;
  submitAnswer: (answer: AnsweredQuestion) => void;
  setQuizStatus: (status: QuizSessionState["status"]) => void;
  updateLevel: (level: BloomLevel) => void;
  incrementSessionStreak: () => void;
  resetSessionStreak: () => void;
  incrementConsecutiveLow: () => void;
  resetConsecutiveLow: () => void;
  endQuiz: () => void;
}

export const createQuizSlice: StateCreator<
  QuizSlice,
  [["zustand/immer", never], ["zustand/persist", unknown]],
  [],
  QuizSlice
> = (set) => ({
  quiz: null,

  startQuiz: (topicId, topicName, isCalibration, startLevel = 1) =>
    set((state) => {
      state.quiz = {
        topicId,
        topicName,
        currentLevel: startLevel,
        questionIndex: 0,
        questions: [],
        answers: [],
        inSessionStreak: 0,
        consecutiveLowAtLevel: 0,
        isCalibration,
        status: "loading",
      };
    }),

  addQuestion: (question) =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.questions.push(question);
      state.quiz.status = "answering";
    }),

  submitAnswer: (answer) =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.answers.push(answer);
      state.quiz.questionIndex += 1;
    }),

  setQuizStatus: (status) =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.status = status;
    }),

  updateLevel: (level) =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.currentLevel = level;
    }),

  incrementSessionStreak: () =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.inSessionStreak += 1;
    }),

  resetSessionStreak: () =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.inSessionStreak = 0;
    }),

  incrementConsecutiveLow: () =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.consecutiveLowAtLevel += 1;
    }),

  resetConsecutiveLow: () =>
    set((state) => {
      if (!state.quiz) return;
      state.quiz.consecutiveLowAtLevel = 0;
    }),

  endQuiz: () =>
    set((state) => {
      state.quiz = null;
    }),
});
