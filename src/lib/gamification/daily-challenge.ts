// ────────────────────────────────────────────────────────────────────────────
// Daily Challenge — generate, store and submit the question of the day
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";
import type { DailyChallenge } from "@/lib/types";

// ── Prompt builders ───────────────────────────────────────────────────────────

/**
 * Returns the system + user prompts for Claude to generate today's challenge.
 * If 2+ topics are provided a cross-topic question is generated; otherwise
 * a single-topic question is generated.
 */
export function dailyChallengePrompt(
  topics: string[],
  userLevel: number
): { system: string; user: string } {
  const difficulty =
    userLevel <= 3
      ? "beginner (conceptual, straightforward)"
      : userLevel <= 8
        ? "intermediate (requires applied thinking)"
        : "advanced (requires synthesis and nuanced reasoning)";

  const topicInstruction =
    topics.length >= 2
      ? `Create a cross-topic question that draws on concepts from BOTH: ${topics.slice(0, 2).join(" and ")}.`
      : `Create a question about: ${topics[0] ?? "general knowledge"}.`;

  const system = `You are a Guru generating the Daily Challenge for a student using the Guru Sishya learning app.

Return ONLY valid JSON — no markdown, no commentary — matching this exact schema:
{
  "question": "<the question text>",
  "options": ["<A>", "<B>", "<C>", "<D>"],
  "correctAnswer": "<exact text of the correct option>",
  "explanation": "<2-3 sentence explanation of why the answer is correct>",
  "topic": "<primary topic name>"
}

Rules:
- Make it a multiple-choice question (MCQ) with 4 options
- Difficulty: ${difficulty}
- The question should be thought-provoking and educational, not trivial
- The explanation should teach, not just confirm`;

  const user = `${topicInstruction}

Student level: ${userLevel}/20

Generate today's challenge question.`;

  return { system, user };
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayInTimezone(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Returns today's DailyChallenge row from Dexie, or null if none exists yet.
 */
export async function getTodaysChallenge(
  timezone: string
): Promise<DailyChallenge | null> {
  const today = todayInTimezone(timezone);
  const row = await db.dailyChallenges.where("date").equals(today).first();
  return row ?? null;
}

/**
 * Saves a newly generated challenge to Dexie for today.
 */
export async function saveTodaysChallenge(
  challenge: Omit<DailyChallenge, "id">
): Promise<number> {
  const id = await db.dailyChallenges.add(challenge);
  return id as number;
}

/**
 * Marks a challenge as answered and records the user's answer + score.
 */
export async function submitDailyChallenge(
  challengeId: number,
  answer: string,
  score: number
): Promise<void> {
  await db.dailyChallenges.update(challengeId, {
    answered: true,
    userAnswer: answer,
    score,
  });
}

// ── XP awards ─────────────────────────────────────────────────────────────────

/** XP awarded for attempting the daily challenge (any answer). */
export const DAILY_CHALLENGE_ATTEMPT_XP = 15;

/** XP awarded for a correct answer. */
export const DAILY_CHALLENGE_CORRECT_XP = 30;

// ── Countdown helper ─────────────────────────────────────────────────────────

/**
 * Returns the number of whole hours until midnight in the given timezone.
 */
export function hoursUntilNextChallenge(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    return 24 - hour - (minute > 0 ? 1 : 0);
  } catch {
    const h = new Date().getUTCHours();
    return 24 - h;
  }
}
