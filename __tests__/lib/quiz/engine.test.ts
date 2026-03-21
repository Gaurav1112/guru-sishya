import { describe, it, expect } from "vitest";
import {
  getNextLevel,
  calculateQuizResult,
  getStartingLevelFromCalibration,
} from "@/lib/quiz/engine";
import type { AnsweredQuestion, BloomLevel } from "@/lib/quiz/types";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeAnswer(
  score: number,
  difficulty: BloomLevel = 3
): AnsweredQuestion {
  return {
    question: "Test question",
    format: "open_ended",
    difficulty,
    bloomLabel: "Apply",
    userAnswer: "some answer",
    score,
    feedback: "feedback",
    missed: [],
    perfectAnswer: "perfect answer",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// getNextLevel
// ────────────────────────────────────────────────────────────────────────────

describe("getNextLevel — advance branch (score >= 7)", () => {
  it("advances from level 1 to 2 on score 7", () => {
    const result = getNextLevel(1, 7, 0);
    expect(result.nextLevel).toBe(2);
    expect(result.breakingPoint).toBe(false);
  });

  it("advances from level 3 to 4 on score 10", () => {
    const result = getNextLevel(3, 10, 0);
    expect(result.nextLevel).toBe(4);
    expect(result.breakingPoint).toBe(false);
  });

  it("does not advance past level 7", () => {
    const result = getNextLevel(7, 9, 0);
    expect(result.nextLevel).toBe(7);
    expect(result.breakingPoint).toBe(false);
  });

  it("clears breaking point flag when score is high", () => {
    const result = getNextLevel(4, 8, 3);
    expect(result.breakingPoint).toBe(false);
  });
});

describe("getNextLevel — drop branch (score <= 3)", () => {
  it("drops from level 4 to 3 on score 3", () => {
    const result = getNextLevel(4, 3, 0);
    expect(result.nextLevel).toBe(3);
    expect(result.breakingPoint).toBe(false);
  });

  it("does not drop below level 1", () => {
    const result = getNextLevel(1, 2, 0);
    expect(result.nextLevel).toBe(1);
  });

  it("triggers breaking point when consecutiveLow >= 1 and score <= 3", () => {
    const result = getNextLevel(3, 2, 1);
    expect(result.breakingPoint).toBe(true);
  });

  it("does NOT trigger breaking point when consecutiveLow is 0 and score <= 3", () => {
    const result = getNextLevel(3, 1, 0);
    expect(result.breakingPoint).toBe(false);
  });

  it("triggers breaking point on score 0 with 2 consecutive lows", () => {
    const result = getNextLevel(5, 0, 2);
    expect(result.breakingPoint).toBe(true);
  });
});

describe("getNextLevel — consolidation branch (score 4-6)", () => {
  it("stays at current level on score 5", () => {
    const result = getNextLevel(3, 5, 0);
    expect(result.nextLevel).toBe(3);
    expect(result.breakingPoint).toBe(false);
  });

  it("stays at current level on score 4", () => {
    const result = getNextLevel(2, 4, 0);
    expect(result.nextLevel).toBe(2);
  });

  it("stays at current level on score 6", () => {
    const result = getNextLevel(6, 6, 0);
    expect(result.nextLevel).toBe(6);
  });

  it("triggers breaking point in consolidation zone when consecutiveLow >= 1", () => {
    const result = getNextLevel(4, 5, 1);
    expect(result.breakingPoint).toBe(true);
  });

  it("does NOT trigger breaking point when consecutiveLow is 0 in consolidation zone", () => {
    const result = getNextLevel(4, 5, 0);
    expect(result.breakingPoint).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// calculateQuizResult
// ────────────────────────────────────────────────────────────────────────────

describe("calculateQuizResult", () => {
  it("returns zeroed result for empty answers", () => {
    const result = calculateQuizResult([]);
    expect(result.totalScore).toBe(0);
    expect(result.averageScore).toBe(0);
    expect(result.questionsAnswered).toBe(0);
    expect(result.xpEarned).toBe(0);
    expect(result.coinsEarned).toBe(0);
  });

  it("sums scores correctly", () => {
    const answers = [makeAnswer(8), makeAnswer(6), makeAnswer(9)];
    const result = calculateQuizResult(answers);
    expect(result.totalScore).toBe(23);
    expect(result.questionsAnswered).toBe(3);
  });

  it("calculates average score rounded to 1 decimal place", () => {
    const answers = [makeAnswer(7), makeAnswer(8)];
    const result = calculateQuizResult(answers);
    expect(result.averageScore).toBe(7.5);
  });

  it("counts perfect answers (score >= 9)", () => {
    const answers = [makeAnswer(9), makeAnswer(10), makeAnswer(7), makeAnswer(4)];
    const result = calculateQuizResult(answers);
    expect(result.perfectCount).toBe(2);
  });

  it("calculates highest level correctly", () => {
    const answers = [
      makeAnswer(8, 2),
      makeAnswer(6, 5),
      makeAnswer(7, 3),
    ];
    const result = calculateQuizResult(answers);
    expect(result.highestLevel).toBe(5);
  });

  it("earns XP for scores >= 5, more XP for higher scores", () => {
    const low = calculateQuizResult([makeAnswer(5)]); // 10 XP
    const mid = calculateQuizResult([makeAnswer(8)]); // 15 XP
    const high = calculateQuizResult([makeAnswer(10)]); // 25 XP
    expect(low.xpEarned).toBe(10);
    expect(mid.xpEarned).toBe(15);
    expect(high.xpEarned).toBe(25);
  });

  it("earns 0 XP for scores < 5", () => {
    const result = calculateQuizResult([makeAnswer(4), makeAnswer(3)]);
    expect(result.xpEarned).toBe(0);
  });

  it("applies 1.5x streak multiplier at streak >= 5", () => {
    const answers = Array(5).fill(null).map(() => makeAnswer(10)); // 5-streak
    const result = calculateQuizResult(answers);
    // First 4: 25 XP each = 100; 5th: 25 * 1.5 = 37 (rounded) = 37 → total 137 — wait, Math.round(25*1.5)=38
    // Actually: 25+25+25+25 = 100, then 5th gets multiplier: Math.round(25*1.5)=38 → 138
    expect(result.xpEarned).toBe(138);
  });

  it("resets streak on score < 5", () => {
    const answers = [makeAnswer(10), makeAnswer(10), makeAnswer(2), makeAnswer(8)];
    const result = calculateQuizResult(answers);
    // streak: 1→2→reset→1; XP: 25+25+0+15=65
    expect(result.xpEarned).toBe(65);
  });

  it("earns 5 coins when some questions are perfect", () => {
    const answers = [makeAnswer(9), makeAnswer(5), makeAnswer(6)];
    const result = calculateQuizResult(answers);
    expect(result.coinsEarned).toBe(5);
  });

  it("earns 15 coins when all 10+ questions are perfect", () => {
    const answers = Array(10).fill(null).map(() => makeAnswer(9));
    const result = calculateQuizResult(answers);
    expect(result.coinsEarned).toBe(15);
  });

  it("earns 0 coins when no perfect answers", () => {
    const answers = [makeAnswer(7), makeAnswer(6)];
    const result = calculateQuizResult(answers);
    expect(result.coinsEarned).toBe(0);
  });

  it("passes through breakingPointLevel", () => {
    const result = calculateQuizResult([makeAnswer(8)], 3);
    expect(result.breakingPoint).toBe(3);
  });

  it("breakingPoint defaults to null", () => {
    const result = calculateQuizResult([makeAnswer(8)]);
    expect(result.breakingPoint).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getStartingLevelFromCalibration
// ────────────────────────────────────────────────────────────────────────────

describe("getStartingLevelFromCalibration", () => {
  it("returns level 1 when all scores are below 6", () => {
    const result = getStartingLevelFromCalibration([5, 4, 3, 2, 1]);
    expect(result).toBe(1);
  });

  it("returns level 2 when only level 1 is mastered (score >= 6)", () => {
    const result = getStartingLevelFromCalibration([8, 4, 3, 2, 1]);
    expect(result).toBe(2);
  });

  it("returns level 3 when levels 1-2 are mastered", () => {
    const result = getStartingLevelFromCalibration([8, 7, 4, 2, 1]);
    expect(result).toBe(3);
  });

  it("returns level 6 when all 5 calibration levels are mastered", () => {
    const result = getStartingLevelFromCalibration([9, 8, 7, 7, 6]);
    expect(result).toBe(6);
  });

  it("does not exceed level 7", () => {
    const result = getStartingLevelFromCalibration([10, 10, 10, 10, 10]);
    expect(result).toBeLessThanOrEqual(7);
  });

  it("handles empty scores array — returns level 1", () => {
    const result = getStartingLevelFromCalibration([]);
    expect(result).toBe(1);
  });

  it("skips non-mastered levels and picks up at the next mastered boundary", () => {
    // Level 1 mastered, level 2 not, level 3 mastered → start at 4
    const result = getStartingLevelFromCalibration([7, 4, 8, 3, 2]);
    expect(result).toBe(4);
  });
});
