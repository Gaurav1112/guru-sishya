// ────────────────────────────────────────────────────────────────────────────
// SM-2 Spaced Repetition Algorithm
// ────────────────────────────────────────────────────────────────────────────

export interface FlashcardSchedule {
  /** Modified ease factor — starts at 2.5, minimum 1.3 */
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
 * @param card    Current schedule for the card
 * @param quality Rating 0–5:
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
  let { easeFactor, interval, repetitions } = card;

  if (quality < 3) {
    // Failed — reset streak and review again tomorrow
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (SM-2 formula)
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const nextReviewAt = new Date(Date.now() + interval * 86_400_000);

  return { easeFactor, interval, repetitions, nextReviewAt };
}

// ────────────────────────────────────────────────────────────────────────────
// Retention model (exponential decay)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estimate the probability that a card is still retained.
 * Uses exponential forgetting curve: R = e^(-t / (I × EF))
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
