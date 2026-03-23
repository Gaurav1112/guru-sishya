// ────────────────────────────────────────────────────────────────────────────
// Question Selector — pulls quiz questions from topics studied this week/month
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import { loadAllContent, type QuizBankQuestion } from "@/lib/content/loader";

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns the ISO date string (YYYY-MM-DD) for N days ago. */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the first day of the current month at midnight. */
function startOfMonth(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Difficulty distribution ──────────────────────────────────────────────────
// Weekly:  30% easy (1–2), 40% medium (3–4), 30% hard (5–7)
// Monthly: 20% easy (1–2), 40% medium (3–4), 40% hard (5–7)

type DiffBucket = "easy" | "medium" | "hard";

function difficultyBucket(d: number): DiffBucket {
  if (d <= 2) return "easy";
  if (d <= 4) return "medium";
  return "hard";
}

interface BucketedPool {
  easy: QuizBankQuestion[];
  medium: QuizBankQuestion[];
  hard: QuizBankQuestion[];
}

function pickFromBuckets(
  pool: BucketedPool,
  counts: { easy: number; medium: number; hard: number }
): QuizBankQuestion[] {
  const picked: QuizBankQuestion[] = [];
  const used = new Set<string>();

  function pickN(bucket: QuizBankQuestion[], n: number) {
    const available = bucket.filter((q) => !used.has(q.question));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, n);
    for (const q of chosen) {
      used.add(q.question);
      picked.push(q);
    }
  }

  pickN(pool.easy, counts.easy);
  pickN(pool.medium, counts.medium);
  pickN(pool.hard, counts.hard);

  // If any bucket was short, fill remaining slots from the other buckets
  const target = counts.easy + counts.medium + counts.hard;
  if (picked.length < target) {
    const all = [...pool.easy, ...pool.medium, ...pool.hard].filter(
      (q) => !used.has(q.question)
    );
    const shuffled = all.sort(() => Math.random() - 0.5);
    for (const q of shuffled) {
      if (picked.length >= target) break;
      picked.push(q);
    }
  }

  // Final shuffle so difficulties are interleaved
  return picked.sort(() => Math.random() - 0.5);
}

// ── Active topic IDs from a time window ──────────────────────────────────────

async function getActiveTopicIds(since: Date): Promise<number[]> {
  // Topics with quiz attempts in the window
  const attempts = await db.quizAttempts
    .where("completedAt")
    .aboveOrEqual(since)
    .toArray();

  const topicIds = new Set<number>(attempts.map((a) => a.topicId));

  // Also include topics with flashcard reviews in the window
  const cards = await db.flashcards.toArray();
  for (const card of cards) {
    // nextReviewAt is updated after each review; use a proxy: if the card's
    // nextReviewAt is within the future scheduling window (interval updated
    // recently) it was reviewed. We use quiz attempts as the primary signal
    // and flashcards as secondary — include topic if any card exists for it.
    if (card.topicId) topicIds.add(card.topicId);
  }

  return [...topicIds];
}

// ── Weekly question selection ─────────────────────────────────────────────────

/**
 * Get questions for the weekly test.
 * Pulls from topics with activity in the last 7 days.
 * Distribution: 30% easy, 40% medium, 30% hard.
 */
export async function getWeeklyTestQuestions(
  limit: number = 20
): Promise<QuizBankQuestion[]> {
  const since = daysAgo(7);
  const topicIds = await getActiveTopicIds(since);

  if (topicIds.length === 0) {
    // Fallback: use all available quiz bank questions
    return getFallbackQuestions(limit, { easy: 0.3, medium: 0.4, hard: 0.3 });
  }

  const topics = await db.topics.bulkGet(topicIds);
  const allContent = await loadAllContent();

  const pool: BucketedPool = { easy: [], medium: [], hard: [] };

  for (const topic of topics) {
    if (!topic) continue;
    const content = allContent.find(
      (c) => c.topic.toLowerCase().trim() === topic.name.toLowerCase().trim()
    );
    if (!content?.quizBank) continue;
    for (const q of content.quizBank) {
      pool[difficultyBucket(q.difficulty)].push(q);
    }
  }

  const easyCount = Math.round(limit * 0.3);
  const mediumCount = Math.round(limit * 0.4);
  const hardCount = limit - easyCount - mediumCount;

  return pickFromBuckets(pool, {
    easy: easyCount,
    medium: mediumCount,
    hard: hardCount,
  });
}

// ── Monthly question selection ────────────────────────────────────────────────

/**
 * Get questions for the monthly test.
 * Pulls from topics with activity since the start of the current month.
 * Distribution: 20% easy, 40% medium, 40% hard.
 */
export async function getMonthlyTestQuestions(
  limit: number = 40
): Promise<QuizBankQuestion[]> {
  const since = startOfMonth();
  const topicIds = await getActiveTopicIds(since);

  if (topicIds.length === 0) {
    return getFallbackQuestions(limit, { easy: 0.2, medium: 0.4, hard: 0.4 });
  }

  const topics = await db.topics.bulkGet(topicIds);
  const allContent = await loadAllContent();

  const pool: BucketedPool = { easy: [], medium: [], hard: [] };
  const seenTopics: string[] = [];

  for (const topic of topics) {
    if (!topic) continue;
    const content = allContent.find(
      (c) => c.topic.toLowerCase().trim() === topic.name.toLowerCase().trim()
    );
    if (!content?.quizBank) continue;
    seenTopics.push(content.topic);
    for (const q of content.quizBank) {
      pool[difficultyBucket(q.difficulty)].push(q);
    }
  }

  const easyCount = Math.round(limit * 0.2);
  const mediumCount = Math.round(limit * 0.4);
  const hardCount = limit - easyCount - mediumCount;

  return pickFromBuckets(pool, {
    easy: easyCount,
    medium: mediumCount,
    hard: hardCount,
  });
}

// ── Fallback: random questions from the full quiz bank ────────────────────────

async function getFallbackQuestions(
  limit: number,
  ratios: { easy: number; medium: number; hard: number }
): Promise<QuizBankQuestion[]> {
  const allContent = await loadAllContent();
  const pool: BucketedPool = { easy: [], medium: [], hard: [] };

  for (const content of allContent) {
    for (const q of content.quizBank ?? []) {
      pool[difficultyBucket(q.difficulty)].push(q);
    }
  }

  const easyCount = Math.round(limit * ratios.easy);
  const mediumCount = Math.round(limit * ratios.medium);
  const hardCount = limit - easyCount - mediumCount;

  return pickFromBuckets(pool, {
    easy: easyCount,
    medium: mediumCount,
    hard: hardCount,
  });
}

// ── Score breakdown by topic (used in monthly test results) ──────────────────

export interface TopicScoreBreakdown {
  topicName: string;
  correct: number;
  total: number;
  percentage: number;
}

export function computeTopicBreakdown(
  questions: QuizBankQuestion[],
  answers: { questionIndex: number; score: number }[],
  questionTopicMap: Map<number, string>
): TopicScoreBreakdown[] {
  const byTopic = new Map<
    string,
    { correct: number; total: number }
  >();

  for (const answer of answers) {
    const topicName = questionTopicMap.get(answer.questionIndex) ?? "Unknown";
    const existing = byTopic.get(topicName) ?? { correct: 0, total: 0 };
    existing.total += 1;
    if (answer.score >= 7) existing.correct += 1;
    byTopic.set(topicName, existing);
  }

  return [...byTopic.entries()]
    .map(([topicName, { correct, total }]) => ({
      topicName,
      correct,
      total,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

// ── Test result persistence type ─────────────────────────────────────────────

export interface TimedTestResult {
  id?: number;
  type: "weekly" | "monthly";
  score: number;          // 0–100
  questionsTotal: number;
  questionsCorrect: number;
  timeTakenSeconds: number;
  completedAt: Date;
  topicBreakdown?: TopicScoreBreakdown[];
}
