// ────────────────────────────────────────────────────────────────────────────
// SM-2 Spaced Repetition Algorithm
// ────────────────────────────────────────────────────────────────────────────
//
// This module re-exports the canonical SM-2 implementation from
// src/lib/review/sm2.ts and provides backward-compatible wrappers
// for existing call-sites that use the FlashcardSchedule interface.
// ────────────────────────────────────────────────────────────────────────────

import {
  sm2,
  type SM2Result,
  type SM2Quality,
  type SelfAssessmentLabel,
  DEFAULT_EASE_FACTOR,
  SM2_DEFAULTS,
} from "@/lib/review/sm2";

// Re-export core types and functions
export {
  sm2,
  type SM2Result,
  type SM2Quality,
  type SelfAssessmentLabel,
  DEFAULT_EASE_FACTOR,
  SM2_DEFAULTS,
};

// ── Backward-compatible wrapper ─────────────────────────────────────────────

export interface FlashcardSchedule {
  /** Modified ease factor -- starts at 2.5, minimum 1.3 */
  easeFactor: number;
  /** Days until the next review */
  interval: number;
  /** Consecutive correct answers (quality >= 3) */
  repetitions: number;
  /** Absolute date of next review */
  nextReviewAt: Date;
}

/**
 * SM-2 algorithm: compute the next schedule for a flashcard after a review.
 *
 * This is a backward-compatible wrapper around the canonical sm2() function.
 * New code should use sm2() directly from @/lib/review/sm2.
 *
 * @param card    Current schedule for the card
 * @param quality Rating 0-5:
 *                  0 = complete blackout
 *                  1 = incorrect; correct answer seemed easy
 *                  2 = incorrect; correct answer felt familiar
 *                  3 = correct with serious difficulty
 *                  4 = correct with hesitation
 *                  5 = perfect recall
 */
export function scheduleReview(
  card: FlashcardSchedule,
  quality: number
): FlashcardSchedule {
  const result = sm2(quality, card.easeFactor, card.interval, card.repetitions);
  return {
    easeFactor: result.easeFactor,
    interval: result.interval,
    repetitions: result.repetitions,
    nextReviewAt: result.nextReviewAt,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Retention model (exponential decay)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estimate the probability that a card is still retained.
 * Uses exponential forgetting curve: R = e^(-t / (I x EF))
 *
 * @param daysSinceReview Days elapsed since last review
 * @param interval        Scheduled interval in days
 * @param easeFactor      Card's ease factor
 * @returns Retention probability in [0, 1]
 */
export function calculateRetention(
  daysSinceReview: number,
  interval: number,
  easeFactor: number
): number {
  if (daysSinceReview <= 0) return 1;
  return Math.exp(-daysSinceReview / (interval * easeFactor));
}

// ────────────────────────────────────────────────────────────────────────────
// Decay state classification
// ────────────────────────────────────────────────────────────────────────────

export type DecayState =
  | "mastered"
  | "strong"
  | "fading"
  | "needs_review"
  | "forgotten";

/**
 * Classify a retention value into a human-readable decay state.
 */
export function getDecayState(retention: number): DecayState {
  if (retention >= 0.9) return "mastered";
  if (retention >= 0.7) return "strong";
  if (retention >= 0.5) return "fading";
  if (retention >= 0.3) return "needs_review";
  return "forgotten";
}
