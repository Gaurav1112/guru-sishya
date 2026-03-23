// ────────────────────────────────────────────────────────────────────────────
// Review Engine — processes flashcard reviews and records results
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import { scheduleReview } from "@/lib/spaced-repetition";
import type {
  FlashcardReviewAction,
  ReviewFlashcard,
  ReviewSession,
  ReviewType,
  ReviewStreak,
} from "./types";

// ── Process a single flashcard review ───────────────────────────────────────

/**
 * Process a single flashcard review: update SM-2 schedule in the database.
 */
export async function processFlashcardReview(
  action: FlashcardReviewAction
): Promise<void> {
  const card = await db.flashcards.get(action.flashcardId);
  if (!card) return;

  const updated = scheduleReview(
    {
      easeFactor: card.easeFactor,
      interval: card.interval,
      repetitions: card.repetitions,
      nextReviewAt: new Date(card.nextReviewAt),
    },
    action.quality
  );

  await db.flashcards.update(action.flashcardId, {
    easeFactor: updated.easeFactor,
    interval: updated.interval,
    repetitions: updated.repetitions,
    nextReviewAt: updated.nextReviewAt,
    lastReviewedAt: new Date(),
  });
}

// ── Process a batch of reviews (entire session) ─────────────────────────────

/**
 * Process all reviews in a session and save the session record.
 * Returns the created ReviewSession.
 */
export async function completeReviewSession(
  type: ReviewType,
  actions: FlashcardReviewAction[],
  durationSeconds: number
): Promise<ReviewSession> {
  // Process each card review
  for (const action of actions) {
    await processFlashcardReview(action);
  }

  // Calculate session stats
  const correctCount = actions.filter((a) => a.quality >= 3).length;
  const averageScore =
    actions.length > 0
      ? actions.reduce((sum, a) => sum + a.quality, 0) / actions.length
      : 0;

  const session: ReviewSession = {
    type,
    scheduledFor: new Date().toISOString().slice(0, 10),
    cardIds: actions.map((a) => a.flashcardId),
    totalCards: actions.length,
    correctCount,
    averageScore: Math.round(averageScore * 100) / 100,
    durationSeconds,
    completedAt: new Date(),
    createdAt: new Date(),
  };

  // Save to database
  try {
    const id = await db.table("reviewSessions").add(session);
    session.id = id as number;
  } catch {
    // Table may not exist yet — silently fail
  }

  // Update review streak
  await updateReviewStreak(type);

  return session;
}

// ── Review Streak ───────────────────────────────────────────────────────────

/**
 * Record that a review was completed today and update the streak.
 */
async function updateReviewStreak(type: ReviewType): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const existing = await db
      .table("reviewStreaks")
      .where("date")
      .equals(today)
      .first();

    if (existing) {
      const typesCompleted = existing.typesCompleted ?? [];
      if (!typesCompleted.includes(type)) {
        typesCompleted.push(type);
      }
      await db.table("reviewStreaks").update(existing.id, {
        completed: true,
        typesCompleted,
      });
    } else {
      await db.table("reviewStreaks").add({
        date: today,
        completed: true,
        typesCompleted: [type],
      });
    }
  } catch {
    // Table may not exist yet — silently fail
  }
}

// ── XP & Coin Rewards for Reviews ───────────────────────────────────────────

export interface ReviewRewards {
  xp: number;
  coins: number;
  reason: string;
}

/**
 * Calculate XP and coin rewards for completing a review session.
 */
export function calculateReviewRewards(
  type: ReviewType,
  totalCards: number,
  correctCount: number,
  averageScore: number
): ReviewRewards {
  const accuracy = totalCards > 0 ? correctCount / totalCards : 0;

  switch (type) {
    case "daily_flashcards": {
      // Base: 10 XP, +1 XP per card reviewed, bonus for high accuracy
      const base = 10;
      const perCard = totalCards;
      const accuracyBonus = accuracy >= 0.8 ? 10 : accuracy >= 0.6 ? 5 : 0;
      return {
        xp: base + perCard + accuracyBonus,
        coins: accuracy >= 0.8 ? 3 : 1,
        reason: "daily_flashcard_review",
      };
    }

    case "daily_quiz": {
      // Base: 15 XP, scaled by average score
      const base = 15;
      const scoreBonus = Math.round(averageScore * 5);
      return {
        xp: base + scoreBonus,
        coins: accuracy >= 0.8 ? 5 : 2,
        reason: "daily_quiz_review",
      };
    }

    case "weekly_flashcards": {
      // Base: 25 XP, +2 XP per card
      const base = 25;
      const perCard = totalCards * 2;
      return {
        xp: base + perCard,
        coins: 5,
        reason: "weekly_flashcard_review",
      };
    }

    case "weekly_test": {
      // Base: 40 XP, significant bonus for accuracy
      const base = 40;
      const accuracyBonus = accuracy >= 0.9 ? 30 : accuracy >= 0.7 ? 15 : 0;
      return {
        xp: base + accuracyBonus,
        coins: accuracy >= 0.9 ? 15 : accuracy >= 0.7 ? 10 : 5,
        reason: "weekly_test",
      };
    }

    case "monthly_test": {
      // Base: 80 XP, large bonus for accuracy
      const base = 80;
      const accuracyBonus = accuracy >= 0.9 ? 50 : accuracy >= 0.7 ? 25 : 0;
      return {
        xp: base + accuracyBonus,
        coins: accuracy >= 0.9 ? 30 : accuracy >= 0.7 ? 20 : 10,
        reason: "monthly_test",
      };
    }

    default:
      return { xp: 10, coins: 1, reason: "review" };
  }
}

// ── Quality from self-assessment ────────────────────────────────────────────
//
// When the user flips a flashcard and self-assesses, map their response
// to an SM-2 quality rating.

export type SelfAssessment =
  | "forgot"       // quality 0: complete blackout
  | "hard"         // quality 2: incorrect, but answer seemed familiar
  | "good"         // quality 3: correct with difficulty
  | "easy"         // quality 5: perfect recall

export function selfAssessmentToQuality(assessment: SelfAssessment): 0 | 2 | 3 | 5 {
  switch (assessment) {
    case "forgot": return 0;
    case "hard": return 2;
    case "good": return 3;
    case "easy": return 5;
  }
}
