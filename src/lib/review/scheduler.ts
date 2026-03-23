// ────────────────────────────────────────────────────────────────────────────
// Review Scheduler — determines what reviews are due and when
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import {
  calculateRetention,
  getDecayState,
  type DecayState,
} from "@/lib/spaced-repetition";
import type {
  ReviewFlashcard,
  ReviewDashboardSummary,
  ReviewType,
} from "./types";

// ── Date helpers ────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Sunday = 0, so go back to last Monday
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSunday(date: Date): boolean {
  return date.getDay() === 0;
}

function isFirstOfMonth(date: Date): boolean {
  return date.getDate() === 1;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000
  );
}

// ── Core Queries ────────────────────────────────────────────────────────────

/**
 * Get all flashcards that are due for review today (nextReviewAt <= end of today).
 */
export async function getCardsDueToday(): Promise<ReviewFlashcard[]> {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const allCards = await db.flashcards.toArray();
  return allCards.filter(
    (card) => new Date(card.nextReviewAt) <= endOfToday
  ) as unknown as ReviewFlashcard[];
}

/**
 * Get all flashcards studied during the current week (created or reviewed
 * since Monday).
 */
export async function getCardsForWeeklyReview(): Promise<ReviewFlashcard[]> {
  const weekStart = startOfWeek(new Date());
  const allCards = await db.flashcards.toArray();

  return allCards.filter((card) => {
    const created = new Date(card.createdAt ?? 0);
    const reviewed = card.lastReviewedAt
      ? new Date(card.lastReviewedAt)
      : null;
    return created >= weekStart || (reviewed && reviewed >= weekStart);
  }) as unknown as ReviewFlashcard[];
}

/**
 * Get all flashcards studied during the current month.
 */
export async function getCardsForMonthlyReview(): Promise<ReviewFlashcard[]> {
  const monthStart = startOfMonth(new Date());
  const allCards = await db.flashcards.toArray();

  return allCards.filter((card) => {
    const created = new Date(card.createdAt ?? 0);
    const reviewed = card.lastReviewedAt
      ? new Date(card.lastReviewedAt)
      : null;
    return created >= monthStart || (reviewed && reviewed >= monthStart);
  }) as unknown as ReviewFlashcard[];
}

/**
 * Get flashcards for a specific topic.
 */
export async function getCardsForTopic(
  topicId: number
): Promise<ReviewFlashcard[]> {
  return (await db.flashcards
    .where("topicId")
    .equals(topicId)
    .toArray()) as unknown as ReviewFlashcard[];
}

// ── Daily Quiz Question Selection ───────────────────────────────────────────
//
// The daily quiz prioritizes cards the user is about to forget, using the
// SM-2 retention model.

/**
 * Select cards for the daily quiz, prioritized by urgency (lowest retention
 * first). Returns 5-10 cards.
 */
export async function selectDailyQuizCards(
  minCards: number = 5,
  maxCards: number = 10
): Promise<ReviewFlashcard[]> {
  const dueCards = await getCardsDueToday();

  if (dueCards.length === 0) {
    // Fallback: pick the lowest-retention cards even if not technically due
    const allCards = await db.flashcards.toArray();
    if (allCards.length === 0) return [];

    const withRetention = (allCards as unknown as ReviewFlashcard[]).map(
      (card) => {
        const daysSince = card.lastReviewedAt
          ? daysBetween(new Date(card.lastReviewedAt), new Date())
          : daysBetween(new Date(card.createdAt ?? Date.now()), new Date());
        const retention = calculateRetention(
          daysSince,
          card.interval || 1,
          card.easeFactor
        );
        return { card, retention };
      }
    );

    withRetention.sort((a, b) => a.retention - b.retention);
    return withRetention
      .slice(0, maxCards)
      .map((item) => item.card);
  }

  // Sort by retention (ascending) — most urgent first
  const withRetention = dueCards.map((card) => {
    const daysSince = card.lastReviewedAt
      ? daysBetween(new Date(card.lastReviewedAt), new Date())
      : daysBetween(new Date(card.createdAt ?? Date.now()), new Date());
    const retention = calculateRetention(
      daysSince,
      card.interval || 1,
      card.easeFactor
    );
    return { card, retention };
  });

  withRetention.sort((a, b) => a.retention - b.retention);

  // Take between minCards and maxCards
  const count = Math.max(minCards, Math.min(maxCards, dueCards.length));
  return withRetention.slice(0, count).map((item) => item.card);
}

// ── Weekly Test Question Selection ──────────────────────────────────────────

/**
 * Select cards for the weekly test (15-20 questions).
 * Covers all topics studied this week, prioritizing weak areas.
 */
export async function selectWeeklyTestCards(): Promise<ReviewFlashcard[]> {
  const weekCards = await getCardsForWeeklyReview();
  if (weekCards.length === 0) return [];

  // Group by topic and ensure fair representation
  const byTopic = new Map<number, ReviewFlashcard[]>();
  for (const card of weekCards) {
    const existing = byTopic.get(card.topicId) ?? [];
    existing.push(card);
    byTopic.set(card.topicId, existing);
  }

  const TARGET = 20;
  const selected: ReviewFlashcard[] = [];

  // Round-robin across topics, prioritizing low-retention cards within each topic
  const topicQueues = new Map<number, ReviewFlashcard[]>();
  for (const [topicId, cards] of byTopic) {
    const sorted = cards
      .map((card) => {
        const daysSince = card.lastReviewedAt
          ? daysBetween(new Date(card.lastReviewedAt), new Date())
          : daysBetween(new Date(card.createdAt ?? Date.now()), new Date());
        const retention = calculateRetention(
          daysSince,
          card.interval || 1,
          card.easeFactor
        );
        return { card, retention };
      })
      .sort((a, b) => a.retention - b.retention)
      .map((item) => item.card);
    topicQueues.set(topicId, sorted);
  }

  let round = 0;
  while (selected.length < TARGET) {
    let addedThisRound = false;
    for (const [, queue] of topicQueues) {
      if (round < queue.length && selected.length < TARGET) {
        selected.push(queue[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  return selected.slice(0, TARGET);
}

// ── Monthly Test Question Selection ─────────────────────────────────────────

/**
 * Select cards for the monthly test (30-50 questions).
 * Comprehensive coverage of the entire month's learning.
 */
export async function selectMonthlyTestCards(): Promise<ReviewFlashcard[]> {
  const monthCards = await getCardsForMonthlyReview();
  if (monthCards.length === 0) return [];

  const TARGET = 50;

  // Same round-robin approach but with a larger target
  const byTopic = new Map<number, ReviewFlashcard[]>();
  for (const card of monthCards) {
    const existing = byTopic.get(card.topicId) ?? [];
    existing.push(card);
    byTopic.set(card.topicId, existing);
  }

  const selected: ReviewFlashcard[] = [];
  const topicQueues = new Map<number, ReviewFlashcard[]>();
  for (const [topicId, cards] of byTopic) {
    const sorted = cards
      .map((card) => {
        const daysSince = card.lastReviewedAt
          ? daysBetween(new Date(card.lastReviewedAt), new Date())
          : daysBetween(new Date(card.createdAt ?? Date.now()), new Date());
        const retention = calculateRetention(
          daysSince,
          card.interval || 1,
          card.easeFactor
        );
        return { card, retention };
      })
      .sort((a, b) => a.retention - b.retention)
      .map((item) => item.card);
    topicQueues.set(topicId, sorted);
  }

  let round = 0;
  while (selected.length < TARGET) {
    let addedThisRound = false;
    for (const [, queue] of topicQueues) {
      if (round < queue.length && selected.length < TARGET) {
        selected.push(queue[round]);
        addedThisRound = true;
      }
    }
    if (!addedThisRound) break;
    round++;
  }

  return selected.slice(0, TARGET);
}

// ── Dashboard Summary ───────────────────────────────────────────────────────

/**
 * Compute the review dashboard summary for the current user.
 */
export async function getReviewDashboardSummary(): Promise<ReviewDashboardSummary> {
  const today = new Date();
  const allCards = await db.flashcards.toArray();
  const dueCards = await getCardsDueToday();

  // Compute retention and decay states for all cards
  let totalRetention = 0;
  const decayBreakdown = {
    mastered: 0,
    strong: 0,
    fading: 0,
    needs_review: 0,
    forgotten: 0,
  };

  for (const card of allCards) {
    const daysSince = card.lastReviewedAt
      ? daysBetween(new Date(card.lastReviewedAt), today)
      : daysBetween(new Date(card.createdAt ?? Date.now()), today);
    const retention = calculateRetention(
      daysSince,
      card.interval || 1,
      card.easeFactor
    );
    totalRetention += retention;
    const state: DecayState = getDecayState(retention);
    decayBreakdown[state]++;
  }

  // Check if daily quiz was already completed today
  const todayStr = todayISO();
  const reviewSessions = await db.table("reviewSessions").toArray().catch(() => []);
  const dailyQuizDone = reviewSessions.some(
    (s: { type: string; completedAt?: Date }) =>
      s.type === "daily_quiz" &&
      s.completedAt &&
      new Date(s.completedAt).toISOString().slice(0, 10) === todayStr
  );

  // Review streak
  const reviewStreakEntries = await db
    .table("reviewStreaks")
    .toArray()
    .catch(() => []);
  let reviewStreak = 0;
  let longestReviewStreak = 0;

  // Count consecutive completed days going backwards from today
  const sortedEntries = (reviewStreakEntries as Array<{ date: string; completed: boolean }>)
    .filter((e) => e.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sortedEntries.length > 0) {
    let checkDate = todayStr;
    for (const entry of sortedEntries) {
      if (entry.date === checkDate) {
        reviewStreak++;
        // Move to previous day
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
      } else {
        break;
      }
    }
    // Compute longest streak
    let currentRun = 0;
    let prevDate = "";
    for (const entry of (reviewStreakEntries as Array<{ date: string; completed: boolean }>)
      .filter((e) => e.completed)
      .sort((a, b) => a.date.localeCompare(b.date))) {
      if (prevDate === "") {
        currentRun = 1;
      } else {
        const prev = new Date(prevDate);
        prev.setDate(prev.getDate() + 1);
        if (prev.toISOString().slice(0, 10) === entry.date) {
          currentRun++;
        } else {
          currentRun = 1;
        }
      }
      longestReviewStreak = Math.max(longestReviewStreak, currentRun);
      prevDate = entry.date;
    }
  }

  return {
    cardsDueToday: dueCards.length,
    dailyQuizAvailable: !dailyQuizDone && allCards.length > 0,
    weeklyReviewDue: isSunday(today),
    monthlyTestDue: isFirstOfMonth(today),
    reviewStreak,
    longestReviewStreak,
    averageRetention:
      allCards.length > 0 ? totalRetention / allCards.length : 0,
    decayBreakdown,
  };
}

// ── Availability Checks ─────────────────────────────────────────────────────

/**
 * Check which review types are currently available.
 */
export async function getAvailableReviews(): Promise<ReviewType[]> {
  const available: ReviewType[] = [];
  const today = new Date();
  const allCards = await db.flashcards.toArray();

  if (allCards.length === 0) return available;

  // Daily flashcards — always available if there are due cards
  const dueCards = await getCardsDueToday();
  if (dueCards.length > 0) {
    available.push("daily_flashcards");
  }

  // Daily quiz — available once per day if there are cards
  const todayStr = todayISO();
  const reviewSessions = await db.table("reviewSessions").toArray().catch(() => []);
  const dailyQuizDone = reviewSessions.some(
    (s: { type: string; completedAt?: Date }) =>
      s.type === "daily_quiz" &&
      s.completedAt &&
      new Date(s.completedAt).toISOString().slice(0, 10) === todayStr
  );
  if (!dailyQuizDone && allCards.length >= 5) {
    available.push("daily_quiz");
  }

  // Weekly flashcards — available on Sundays (or Saturday-Sunday)
  if (isSunday(today) || today.getDay() === 6) {
    const weekCards = await getCardsForWeeklyReview();
    if (weekCards.length > 0) {
      available.push("weekly_flashcards");
    }
  }

  // Weekly test — available on Sundays
  if (isSunday(today)) {
    const weekCards = await getCardsForWeeklyReview();
    if (weekCards.length >= 5) {
      available.push("weekly_test");
    }
  }

  // Monthly test — available on the 1st of the month
  if (isFirstOfMonth(today)) {
    const monthCards = await getCardsForMonthlyReview();
    if (monthCards.length >= 10) {
      available.push("monthly_test");
    }
  }

  return available;
}
