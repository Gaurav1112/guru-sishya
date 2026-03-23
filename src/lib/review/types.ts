// ────────────────────────────────────────────────────────────────────────────
// Review System — Types & Data Model
// ────────────────────────────────────────────────────────────────────────────
//
// This file defines the complete data model for the spaced repetition and
// revision system. It extends the existing Flashcard type and adds new
// tables for review sessions, schedules, and test results.
// ────────────────────────────────────────────────────────────────────────────

// ── Extended Flashcard ──────────────────────────────────────────────────────
//
// The existing Flashcard interface (src/lib/types.ts) needs these additions.
// We re-export the full shape here so the review system has a single source
// of truth.

export interface ReviewFlashcard {
  id?: number;
  topicId: number;
  concept: string;
  front: string; // question side
  back: string; // answer side

  /** Where this card was generated from */
  source: "quiz_wrong" | "session_takeaway" | "cheatsheet";

  /** Optional: the quiz attempt ID that spawned this card */
  sourceQuizAttemptId?: number;
  /** Optional: the session number that spawned this card */
  sourceSessionNumber?: number;

  // SM-2 fields
  easeFactor: number; // starts at 2.5, min 1.3
  interval: number; // days until next review
  repetitions: number; // consecutive correct answers (quality >= 3)
  nextReviewAt: Date; // absolute date of next review
  lastReviewedAt?: Date; // when the card was last reviewed

  createdAt: Date;
}

// ── Review Session ──────────────────────────────────────────────────────────
//
// Tracks each review session the user completes (daily flashcards, daily quiz,
// weekly review, weekly test, monthly test).

export type ReviewType =
  | "daily_flashcards"
  | "daily_quiz"
  | "weekly_flashcards"
  | "weekly_test"
  | "monthly_test";

export interface ReviewSession {
  id?: number;
  type: ReviewType;
  /** ISO date string (YYYY-MM-DD) for daily, ISO week string for weekly, ISO month for monthly */
  scheduledFor: string;
  /** Cards/questions that were part of this session */
  cardIds: number[];
  /** Total cards reviewed in this session */
  totalCards: number;
  /** Cards the user got correct (quality >= 3 for flashcards, score >= 7 for quiz) */
  correctCount: number;
  /** Average SM-2 quality rating or quiz score for this session */
  averageScore: number;
  /** Duration in seconds */
  durationSeconds: number;
  completedAt?: Date;
  createdAt: Date;
}

// ── Review Schedule ─────────────────────────────────────────────────────────
//
// Pre-computed schedule entries. The scheduler creates these ahead of time
// so the UI can show "X cards due today" without recomputing.

export interface ReviewScheduleEntry {
  id?: number;
  type: ReviewType;
  /** ISO date string (YYYY-MM-DD) when this review is due */
  dueDate: string;
  /** Whether this review has been completed */
  completed: boolean;
  /** Link to the ReviewSession that completed this, if any */
  reviewSessionId?: number;
  /** Number of cards/questions expected */
  expectedCount: number;
  createdAt: Date;
}

// ── Test Question (for weekly/monthly tests) ────────────────────────────────

export interface ReviewTestQuestion {
  flashcardId: number;
  topicId: number;
  question: string;
  expectedAnswer: string;
  userAnswer?: string;
  score?: number; // 0-10
  feedback?: string;
}

export interface ReviewTestResult {
  id?: number;
  type: "weekly_test" | "monthly_test";
  /** ISO date of the test */
  testDate: string;
  questions: ReviewTestQuestion[];
  totalScore: number;
  averageScore: number;
  /** Duration in seconds */
  durationSeconds: number;
  /** Topic IDs covered in this test */
  topicIds: number[];
  completedAt: Date;
}

// ── Review Streak (separate from learning streak) ───────────────────────────

export interface ReviewStreak {
  id?: number;
  /** ISO date string */
  date: string;
  /** Whether daily review was completed on this date */
  completed: boolean;
  /** Which review types were completed */
  typesCompleted: ReviewType[];
}

// ── Dashboard Summary (computed, not stored) ────────────────────────────────

export interface ReviewDashboardSummary {
  /** Number of flashcards due today (nextReviewAt <= today) */
  cardsDueToday: number;
  /** Whether daily quiz is available */
  dailyQuizAvailable: boolean;
  /** Whether weekly review is due (Sunday) */
  weeklyReviewDue: boolean;
  /** Whether monthly test is due (1st of month) */
  monthlyTestDue: boolean;
  /** Current review streak (consecutive days of completed daily reviews) */
  reviewStreak: number;
  /** Longest review streak ever */
  longestReviewStreak: number;
  /** Retention rate — average across all active cards */
  averageRetention: number;
  /** Cards by decay state */
  decayBreakdown: {
    mastered: number;
    strong: number;
    fading: number;
    needs_review: number;
    forgotten: number;
  };
}

// ── Flashcard Review Action ─────────────────────────────────────────────────

export type FlashcardQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface FlashcardReviewAction {
  flashcardId: number;
  quality: FlashcardQuality;
  /** Time spent on this card in seconds */
  timeSpentSeconds: number;
}
