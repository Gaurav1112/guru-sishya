// ────────────────────────────────────────────────────────────────────────────
// Spaced-repetition bridge — updates flashcards based on quiz performance
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import { scheduleReview } from "@/lib/spaced-repetition";
import type { AnsweredQuestion } from "./types";

/**
 * Maps a 0-10 quiz score to an SM-2 quality rating (0-5).
 *   score >= 9  → quality 5 (perfect recall)
 *   score >= 7  → quality 4 (correct with hesitation)
 *   score >= 4  → quality 3 (correct with difficulty)
 *   score < 4   → quality 1 (incorrect; answer felt familiar)
 */
function scoreToSM2Quality(score: number): number {
  if (score >= 9) return 5;
  if (score >= 7) return 4;
  if (score >= 4) return 3;
  return 1;
}

/**
 * After a quiz session, updates the spaced-repetition schedule for each
 * answered question.
 *
 * - If a flashcard exists for the concept, advance its SM-2 schedule.
 * - If the student struggled (score < 7) and no card exists yet, create one
 *   so it will appear in future review sessions.
 */
export async function updateFlashcardsFromQuiz(
  topicId: number,
  answers: AnsweredQuestion[]
): Promise<void> {
  for (const answer of answers) {
    const concept = answer.question.substring(0, 100);
    const quality = scoreToSM2Quality(answer.score);

    try {
      const existing = await db.flashcards
        .where({ topicId })
        .filter((f) => f.concept === concept)
        .first();

      if (existing) {
        const updated = scheduleReview(existing, quality);
        await db.flashcards.update(existing.id!, {
          easeFactor: updated.easeFactor,
          interval: updated.interval,
          repetitions: updated.repetitions,
          nextReviewAt: updated.nextReviewAt,
        });
      } else if (answer.score < 7) {
        // Only create cards for concepts the student struggled with
        await db.flashcards.add({
          topicId,
          concept,
          front: answer.question,
          back: answer.perfectAnswer,
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewAt: new Date(),
        });
      }
    } catch {
      // Ignore individual card errors to prevent one failure from aborting the batch
    }
  }
}

/**
 * When a user skips a question (navigates past without answering),
 * create a flashcard with quality=0 so it appears in revision queue immediately.
 */
export async function processSkippedQuestion(
  topicId: number,
  questionText: string,
  explanation: string
): Promise<void> {
  const concept = questionText.substring(0, 100);
  try {
    const existing = await db.flashcards
      .where({ topicId })
      .filter((f) => f.concept === concept)
      .first();
    if (existing) {
      const updated = scheduleReview(existing, 0);
      await db.flashcards.update(existing.id!, {
        easeFactor: updated.easeFactor,
        interval: 0,
        repetitions: 0,
        nextReviewAt: new Date(),
      });
    } else {
      await db.flashcards.add({
        topicId,
        concept,
        front: questionText,
        back: explanation || "Review this question",
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewAt: new Date(),
      });
    }
  } catch {
    // Ignore individual card errors
  }
}
