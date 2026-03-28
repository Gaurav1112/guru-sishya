// ────────────────────────────────────────────────────────────────────────────
// SM-2 Spaced Repetition Algorithm
// ────────────────────────────────────────────────────────────────────────────
//
// Pure implementation of the SM-2 algorithm (SuperMemo 2) for scheduling
// flashcard reviews. This is the canonical implementation used across the
// entire review system.
//
// Reference: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
// ────────────────────────────────────────────────────────────────────────────

/**
 * Result of applying the SM-2 algorithm to a flashcard review.
 */
export interface SM2Result {
  /** Modified ease factor (minimum 1.3) */
  easeFactor: number;
  /** Days until the next review */
  interval: number;
  /** Consecutive correct answers (quality >= 3) */
  repetitions: number;
  /** Absolute date of next review */
  nextReviewAt: Date;
}

/**
 * SM-2 quality ratings:
 *   0 = complete blackout (Again)
 *   1 = incorrect; correct answer seemed easy (Forgot)
 *   2 = incorrect; correct answer felt familiar (Hard)
 *   3 = correct with serious difficulty (Good)
 *   4 = correct with hesitation (Easy)
 *   5 = perfect recall (Perfect)
 */
export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/** Minimum ease factor — the SM-2 algorithm floor */
const MIN_EASE_FACTOR = 1.3;

/** Default ease factor for new cards */
export const DEFAULT_EASE_FACTOR = 2.5;

/** Default initial values for a brand new flashcard */
export const SM2_DEFAULTS = {
  easeFactor: DEFAULT_EASE_FACTOR,
  interval: 1,
  repetitions: 0,
} as const;

/**
 * Core SM-2 algorithm: compute the next schedule for a flashcard after a
 * review.
 *
 * @param quality     Rating 0-5 (0=blackout, 5=perfect recall)
 * @param easeFactor  Current ease factor (starts at 2.5)
 * @param interval    Current interval in days
 * @param repetitions Consecutive correct answers (quality >= 3)
 * @returns SM2Result with updated scheduling parameters
 */
export function sm2(
  quality: number,
  easeFactor: number,
  interval: number,
  repetitions: number
): SM2Result {
  // Clamp quality to valid range
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (q < 3) {
    // Failed review — reset streak, review again tomorrow
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Correct review — advance the schedule
    newRepetitions += 1;

    if (newRepetitions === 1) {
      // First correct answer: review again in 1 day
      newInterval = 1;
    } else if (newRepetitions === 2) {
      // Second consecutive correct: review in 6 days
      newInterval = 6;
    } else {
      // Subsequent correct: multiply previous interval by ease factor
      newInterval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor using the SM-2 formula:
  //   EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  // This adjusts the ease factor based on the quality of the response.
  // The factor increases with higher quality ratings and decreases with lower ones.
  newEaseFactor =
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  // Enforce minimum ease factor
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Compute absolute next review date
  const nextReviewAt = new Date(Date.now() + newInterval * 86_400_000);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// UI Rating Mapping
// ────────────────────────────────────────────────────────────────────────────

/**
 * Human-readable self-assessment labels shown in the review UI.
 * Maps to SM-2 quality values.
 */
export type SelfAssessmentLabel =
  | "again"    // quality 0: complete blackout / didn't know
  | "hard"     // quality 2: incorrect, but answer felt familiar
  | "good"     // quality 3: correct with difficulty
  | "easy"     // quality 4: correct with some hesitation
  | "perfect"; // quality 5: perfect, effortless recall

/**
 * Map a self-assessment label to an SM-2 quality rating.
 */
export function selfAssessmentToQuality(label: SelfAssessmentLabel): SM2Quality {
  switch (label) {
    case "again":   return 0;
    case "hard":    return 2;
    case "good":    return 3;
    case "easy":    return 4;
    case "perfect": return 5;
  }
}

/**
 * Map a 0-10 quiz score to an SM-2 quality rating.
 * Used when auto-scheduling flashcards from quiz results.
 *
 *   score >= 9  -> quality 5 (perfect recall)
 *   score >= 7  -> quality 4 (correct with hesitation)
 *   score >= 4  -> quality 3 (correct with difficulty)
 *   score >= 2  -> quality 1 (incorrect; answer felt familiar)
 *   score < 2   -> quality 0 (complete blackout)
 */
export function quizScoreToQuality(score: number): SM2Quality {
  if (score >= 9) return 5;
  if (score >= 7) return 4;
  if (score >= 4) return 3;
  if (score >= 2) return 1;
  return 0;
}
