// ────────────────────────────────────────────────────────────────────────────
// Quiz adaptive engine — difficulty progression and result calculation
// ────────────────────────────────────────────────────────────────────────────

import type { BloomLevel, AnsweredQuestion, QuizResult } from "./types";

/**
 * Determines the next Bloom's level and whether the student has hit their
 * breaking point based on the current score and consecutive low count.
 *
 * Score thresholds (0-10 scale):
 *   >= 7  → advance to next level
 *   <= 3  → drop one level; 2 consecutive lows = breaking point
 *   4-6   → consolidation zone — stay at current level; 2 consecutive = break
 */
export function getNextLevel(
  currentLevel: BloomLevel,
  score: number,
  consecutiveLow: number
): { nextLevel: BloomLevel; breakingPoint: boolean } {
  if (score >= 7) {
    const nextLevel = Math.min(7, currentLevel + 1) as BloomLevel;
    return { nextLevel, breakingPoint: false };
  }

  if (score <= 3) {
    const nextLevel = Math.max(1, currentLevel - 1) as BloomLevel;
    // 2 consecutive low scores triggers breaking point
    return { nextLevel, breakingPoint: consecutiveLow >= 1 };
  }

  // Consolidation zone (4-6): stay at current level
  // 2 consecutive consolidation scores also triggers breaking point
  return { nextLevel: currentLevel, breakingPoint: consecutiveLow >= 1 };
}

/**
 * Determines the starting adaptive level from calibration scores.
 * scores[0] = level 1 result, scores[4] = level 5 result.
 * Starts one level above the highest mastered level.
 */
export function getStartingLevelFromCalibration(
  scores: number[]
): BloomLevel {
  let startLevel: BloomLevel = 1;
  for (let i = 0; i < scores.length; i++) {
    if (scores[i] >= 6) {
      startLevel = Math.min(7, i + 2) as BloomLevel;
    }
  }
  return startLevel;
}

/**
 * Calculates the final quiz result from all answered questions.
 * XP is streaks-based; coins are awarded for exceptional performance.
 */
export function calculateQuizResult(
  answers: AnsweredQuestion[],
  breakingPointLevel: BloomLevel | null = null
): QuizResult {
  if (answers.length === 0) {
    return {
      totalScore: 0,
      averageScore: 0,
      highestLevel: 1,
      breakingPoint: breakingPointLevel,
      questionsAnswered: 0,
      perfectCount: 0,
      xpEarned: 0,
      coinsEarned: 0,
    };
  }

  const totalScore = answers.reduce((s, a) => s + a.score, 0);
  const avgScore = totalScore / answers.length;
  const perfectCount = answers.filter((a) => a.score >= 9).length;
  const highestLevel = Math.max(...answers.map((a) => a.difficulty)) as BloomLevel;

  // XP calculation with streak multiplier
  let xp = 0;
  let streak = 0;
  for (const a of answers) {
    if (a.score >= 5) {
      streak++;
      let points = 10;
      if (a.score >= 8) points = 15;
      if (a.score >= 10) points = 25;
      if (streak >= 5) points = Math.round(points * 1.5);
      xp += points;
    } else {
      streak = 0;
    }
  }

  // Coins: 15 if all answers were perfect in a 10+ question session, else 5 for any perfect
  const allPerfect =
    perfectCount > 0 &&
    answers.length >= 10 &&
    perfectCount === answers.length;
  const coins = allPerfect ? 15 : perfectCount > 0 ? 5 : 0;

  return {
    totalScore,
    averageScore: Math.round(avgScore * 10) / 10,
    highestLevel,
    breakingPoint: breakingPointLevel,
    questionsAnswered: answers.length,
    perfectCount,
    xpEarned: xp,
    coinsEarned: coins,
  };
}
