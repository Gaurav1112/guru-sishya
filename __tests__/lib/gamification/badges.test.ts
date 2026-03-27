import { describe, it, expect, beforeEach } from "vitest";
import {
  BADGE_DEFINITIONS,
  checkAndUnlockBadges,
  getUserStats,
  type UserStats,
} from "@/lib/gamification/badges";
import { db } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeStats(overrides: Partial<UserStats> = {}): UserStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalXP: 0,
    level: 1,
    topicsExplored: 0,
    perfectRounds: 0,
    cheatSheetsGenerated: 0,
    feynmanMastered: 0,
    plansCompleted: 0,
    decayedTopicsReviewed: 0,
    categoriesExplored: 0,
    totalQuizzes: 0,
    badgeCount: 0,
    sessionsCompleted: 0,
    highScoreQuizzes: 0,
    excellentQuizzes: 0,
    dailyChallengesCompleted: 0,
    timedTestsCompleted: 0,
    quizzesInOneDay: 0,
    interviewsCompleted: 0,
    interviewHighScore: 0,
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Badge definitions
// ────────────────────────────────────────────────────────────────────────────

describe("BADGE_DEFINITIONS", () => {
  it("has exactly 33 badge definitions", () => {
    expect(BADGE_DEFINITIONS).toHaveLength(33);
  });

  it("has unique IDs", () => {
    const ids = BADGE_DEFINITIONS.map((b) => b.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has valid categories", () => {
    const validCategories = ["consistency", "mastery", "speed", "exploration", "social"];
    for (const badge of BADGE_DEFINITIONS) {
      expect(validCategories).toContain(badge.category);
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Individual badge checks
// ────────────────────────────────────────────────────────────────────────────

describe("badge check functions", () => {
  it("prathama_jyoti: unlocked when topicsExplored >= 1", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "prathama_jyoti")!;
    expect(badge.check(makeStats({ topicsExplored: 0 }))).toBe(false);
    expect(badge.check(makeStats({ topicsExplored: 1 }))).toBe(true);
  });

  it("nityam: unlocked when longestStreak >= 7", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "nityam")!;
    expect(badge.check(makeStats({ longestStreak: 6 }))).toBe(false);
    expect(badge.check(makeStats({ longestStreak: 7 }))).toBe(true);
  });

  it("tapasvi: unlocked when longestStreak >= 30", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "tapasvi")!;
    expect(badge.check(makeStats({ longestStreak: 29 }))).toBe(false);
    expect(badge.check(makeStats({ longestStreak: 30 }))).toBe(true);
  });

  it("shuddh_gyan: unlocked when perfectRounds >= 1", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "shuddh_gyan")!;
    expect(badge.check(makeStats({ perfectRounds: 0 }))).toBe(false);
    expect(badge.check(makeStats({ perfectRounds: 1 }))).toBe(true);
  });

  it("pancha_siddhi: unlocked when perfectRounds >= 5", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "pancha_siddhi")!;
    expect(badge.check(makeStats({ perfectRounds: 4 }))).toBe(false);
    expect(badge.check(makeStats({ perfectRounds: 5 }))).toBe(true);
  });

  it("jigyasu: unlocked when topicsExplored >= 10", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "jigyasu")!;
    expect(badge.check(makeStats({ topicsExplored: 9 }))).toBe(false);
    expect(badge.check(makeStats({ topicsExplored: 10 }))).toBe(true);
  });

  it("pathik: unlocked when plansCompleted >= 1", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "pathik")!;
    expect(badge.check(makeStats({ plansCompleted: 0 }))).toBe(false);
    expect(badge.check(makeStats({ plansCompleted: 1 }))).toBe(true);
  });

  it("param_parakrami: unlocked when badgeCount >= 25", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "param_parakrami")!;
    expect(badge.check(makeStats({ badgeCount: 24 }))).toBe(false);
    expect(badge.check(makeStats({ badgeCount: 25 }))).toBe(true);
  });

  it("brahma_muhurta: always returns false (tracked externally)", () => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === "brahma_muhurta")!;
    expect(badge.check(makeStats({ totalXP: 99999 }))).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// checkAndUnlockBadges
// ────────────────────────────────────────────────────────────────────────────

describe("checkAndUnlockBadges", () => {
  beforeEach(async () => {
    await db.badges.clear();
  });

  it("unlocks prathama_jyoti when topicsExplored >= 1", async () => {
    const stats = makeStats({ topicsExplored: 1 });
    const newlyUnlocked = await checkAndUnlockBadges(stats);
    const ids = newlyUnlocked.map((b) => b.id);
    expect(ids).toContain("prathama_jyoti");
  });

  it("does not re-unlock already unlocked badges", async () => {
    const stats = makeStats({ topicsExplored: 1 });
    await checkAndUnlockBadges(stats);
    const secondRun = await checkAndUnlockBadges(stats);
    const ids = secondRun.map((b) => b.id);
    expect(ids).not.toContain("prathama_jyoti");
  });

  it("unlocks multiple badges at once", async () => {
    const stats = makeStats({ topicsExplored: 10, longestStreak: 7, perfectRounds: 1 });
    const newlyUnlocked = await checkAndUnlockBadges(stats);
    const ids = newlyUnlocked.map((b) => b.id);
    expect(ids).toContain("prathama_jyoti");
    expect(ids).toContain("jigyasu");
    expect(ids).toContain("nityam");
    expect(ids).toContain("shuddh_gyan");
  });

  it("returns empty array when no new badges qualify", async () => {
    const stats = makeStats(); // all zeros
    const newlyUnlocked = await checkAndUnlockBadges(stats);
    // prathama_jyoti requires totalQuizzes >= 1 or topicsExplored >= 1 — neither is true
    expect(newlyUnlocked).toHaveLength(0);
  });

  it("persists newly unlocked badges in Dexie", async () => {
    const stats = makeStats({ topicsExplored: 1 });
    await checkAndUnlockBadges(stats);
    const saved = await db.badges.where("type").equals("prathama_jyoti").first();
    expect(saved).toBeDefined();
    expect(saved?.name).toBe("Prathama Jyoti");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getUserStats
// ────────────────────────────────────────────────────────────────────────────

describe("getUserStats", () => {
  beforeEach(async () => {
    await db.topics.clear();
    await db.quizAttempts.clear();
    await db.cheatSheets.clear();
    await db.chatSessions.clear();
    await db.learningPlans.clear();
    await db.badges.clear();
  });

  it("returns zeroed stats when DB is empty", async () => {
    const stats = await getUserStats({ currentStreak: 0, longestStreak: 0, totalXP: 0, level: 1 });
    expect(stats.topicsExplored).toBe(0);
    expect(stats.totalQuizzes).toBe(0);
    expect(stats.cheatSheetsGenerated).toBe(0);
    expect(stats.feynmanMastered).toBe(0);
    expect(stats.plansCompleted).toBe(0);
    expect(stats.categoriesExplored).toBe(0);
  });

  it("counts topics and categories correctly", async () => {
    await db.topics.bulkAdd([
      { name: "Algebra", category: "Mathematics", createdAt: new Date() },
      { name: "Calculus", category: "Mathematics", createdAt: new Date() },
      { name: "Physics", category: "Science", createdAt: new Date() },
    ]);
    const stats = await getUserStats({ currentStreak: 0, longestStreak: 0, totalXP: 0, level: 1 });
    expect(stats.topicsExplored).toBe(3);
    expect(stats.categoriesExplored).toBe(2);
  });

  it("counts perfect rounds correctly", async () => {
    await db.quizAttempts.bulkAdd([
      { topicId: 1, score: 100, difficulty: "medium", questions: [], completedAt: new Date() },
      { topicId: 1, score: 80, difficulty: "medium", questions: [], completedAt: new Date() },
      { topicId: 1, score: 100, difficulty: "hard", questions: [], completedAt: new Date() },
    ]);
    const stats = await getUserStats({ currentStreak: 0, longestStreak: 0, totalXP: 0, level: 1 });
    expect(stats.perfectRounds).toBe(2);
    expect(stats.totalQuizzes).toBe(3);
  });

  it("passes through store state values", async () => {
    const stats = await getUserStats({ currentStreak: 5, longestStreak: 10, totalXP: 500, level: 3 });
    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(10);
    expect(stats.totalXP).toBe(500);
    expect(stats.level).toBe(3);
  });
});
