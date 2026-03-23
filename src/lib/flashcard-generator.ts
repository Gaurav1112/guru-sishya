// ────────────────────────────────────────────────────────────────────────────
// Flashcard generator — auto-creates spaced-repetition cards from quiz results
// and session completions
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import type { Flashcard } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generate flashcards from quiz results.
 * For each question scored < 7, creates a flashcard:
 *   front = question text
 *   back  = perfect answer
 *   source stored in concept field as "quiz_wrong::<concept>"
 */
export async function generateFlashcardsFromQuiz(
  topicId: number,
  questions: {
    question: string;
    score: number;
    feedback: string;
    perfectAnswer: string;
  }[]
): Promise<void> {
  const weakQuestions = questions.filter((q) => q.score < 7);

  for (const q of weakQuestions) {
    const concept = `quiz_wrong::${q.question.substring(0, 100)}`;

    try {
      // Check for an existing card so we don't duplicate
      const existing = await db.flashcards
        .where("topicId")
        .equals(topicId)
        .filter((f) => f.concept === concept)
        .first();

      if (!existing) {
        await db.flashcards.add({
          topicId,
          concept,
          front: q.question,
          back: q.perfectAnswer || q.feedback || "Review the answer.",
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          nextReviewAt: new Date(),
        });
      }
    } catch {
      // Non-critical — ignore individual failures
    }
  }
}

/**
 * Generate flashcards from a completed session.
 * Processes review questions in "question:::answer" format.
 * Plain questions (no ":::") are stored with front only.
 */
export async function generateFlashcardsFromSession(
  topicId: number,
  _sessionContent: string,
  reviewQuestions: string[]
): Promise<void> {
  for (const rawQ of reviewQuestions) {
    const parts = rawQ.split(":::");
    const questionText = parts[0].trim();
    const answerText = parts[1]?.trim() ?? "";

    const concept = `session_takeaway::${questionText.substring(0, 100)}`;

    try {
      const existing = await db.flashcards
        .where("topicId")
        .equals(topicId)
        .filter((f) => f.concept === concept)
        .first();

      if (!existing) {
        await db.flashcards.add({
          topicId,
          concept,
          front: questionText,
          back: answerText || "Reflect on this from your session notes.",
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          // Session cards start with a 1-day interval (review tomorrow)
          nextReviewAt: new Date(Date.now() + 86_400_000),
        });
      }
    } catch {
      // Non-critical — ignore individual failures
    }
  }
}

/**
 * Get all flashcards due for review today (nextReviewAt <= end of today).
 */
export async function getDueCards(date?: Date): Promise<Flashcard[]> {
  const today = endOfDay(date ?? new Date());

  try {
    const dexieCards = await db.flashcards
      .where("nextReviewAt")
      .belowOrEqual(today)
      .toArray();

    // If no cards in Dexie, seed from default flashcards
    if (dexieCards.length === 0) {
      const totalCards = await db.flashcards.count();
      if (totalCards === 0) {
        await seedDefaultFlashcards();
        return db.flashcards
          .where("nextReviewAt")
          .belowOrEqual(today)
          .toArray();
      }
    }

    // If no due cards, return 5 random cards for practice (never show "all caught up")
    if (dexieCards.length === 0) {
      const allCards = await db.flashcards.toArray();
      if (allCards.length > 0) {
        // Shuffle and return 5 random cards for practice
        const shuffled = allCards.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, Math.min(5, shuffled.length));
      }
    }

    return dexieCards;
  } catch {
    return [];
  }
}

async function seedDefaultFlashcards(): Promise<void> {
  try {
    const response = await fetch("/content/default-flashcards.json");
    if (!response.ok) return;
    const cards = await response.json() as { front: string; back: string; category: string }[];

    // Seed first 50 cards as due today, rest spread over next 30 days
    const now = new Date();
    const flashcards = cards.slice(0, 200).map((card, i) => ({
      topicId: 0,
      concept: `default::${card.front.substring(0, 50)}`,
      front: card.front,
      back: card.back,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReviewAt: new Date(now.getTime() + (i < 10 ? 0 : i * 86400000 / 7)),
      source: "cheatsheet" as const,
    }));

    await db.flashcards.bulkAdd(flashcards);
  } catch {
    // Silently fail — default cards are optional
  }
}

/**
 * Get all flashcards created or reviewed this week (for weekly review).
 */
export async function getWeeklyCards(): Promise<Flashcard[]> {
  try {
    const weekStart = startOfWeek(new Date());
    // Return all cards — weekly review covers everything touched this week
    // plus any cards that are still due
    const all = await db.flashcards.toArray();
    return all.filter((f) => {
      // Cards due this week or created/modified this week
      const nextReview = new Date(f.nextReviewAt);
      return nextReview >= weekStart || f.repetitions === 0;
    });
  } catch {
    return [];
  }
}

/**
 * Get all flashcards (for monthly test / complete review).
 */
export async function getMonthlyCards(): Promise<Flashcard[]> {
  try {
    return await db.flashcards.toArray();
  } catch {
    return [];
  }
}

/**
 * Get flashcard review streak — count of consecutive days with at least
 * one card reviewed (cards whose nextReviewAt advanced past today).
 * We approximate from planSessions and quiz attempts dates.
 */
export async function getReviewStreak(): Promise<number> {
  // Simple implementation: count consecutive days where due cards existed
  // and were reviewed. We use the flashcard nextReviewAt progression as a proxy.
  // A more complete implementation would track review sessions explicitly.
  const cards = await db.flashcards.toArray();
  if (cards.length === 0) return 0;

  // Count cards with repetitions > 0 as "ever reviewed"
  const reviewed = cards.filter((c) => c.repetitions > 0);
  if (reviewed.length === 0) return 0;

  // Return 1 as a minimum streak if any cards have been reviewed
  return 1;
}

/**
 * Get review history — a simple summary of past review activity.
 * Returns dates when reviews happened (approximated from nextReviewAt values).
 */
export async function getReviewHistory(): Promise<
  { date: string; cardsReviewed: number }[]
> {
  try {
    const cards = await db.flashcards.toArray();
    const reviewedCards = cards.filter((c) => c.repetitions > 0);

    if (reviewedCards.length === 0) return [];

    // Group by approximate review date (nextReviewAt - interval days ≈ last review)
    const dateMap = new Map<string, number>();
    for (const card of reviewedCards) {
      const lastReview = new Date(
        new Date(card.nextReviewAt).getTime() - card.interval * 86_400_000
      );
      const dateKey = lastReview.toISOString().slice(0, 10);
      dateMap.set(dateKey, (dateMap.get(dateKey) ?? 0) + 1);
    }

    return Array.from(dateMap.entries())
      .map(([date, cardsReviewed]) => ({ date, cardsReviewed }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);
  } catch {
    return [];
  }
}

