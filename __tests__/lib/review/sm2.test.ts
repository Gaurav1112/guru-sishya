import { describe, it, expect } from "vitest";
import {
  sm2,
  selfAssessmentToQuality,
  quizScoreToQuality,
  DEFAULT_EASE_FACTOR,
  SM2_DEFAULTS,
} from "@/lib/review/sm2";

// ────────────────────────────────────────────────────────────────────────────
// sm2() — core algorithm
// ────────────────────────────────────────────────────────────────────────────

describe("sm2 — correct answers (quality >= 3)", () => {
  it("first correct review: interval=1, repetitions=1", () => {
    const result = sm2(4, 2.5, 1, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("second consecutive correct: interval=6, repetitions=2", () => {
    const r1 = sm2(4, 2.5, 1, 0);
    const r2 = sm2(4, r1.easeFactor, r1.interval, r1.repetitions);
    expect(r2.repetitions).toBe(2);
    expect(r2.interval).toBe(6);
  });

  it("third consecutive correct: interval = round(6 * easeFactor)", () => {
    const r1 = sm2(5, 2.5, 1, 0);
    const r2 = sm2(5, r1.easeFactor, r1.interval, r1.repetitions);
    const r3 = sm2(5, r2.easeFactor, r2.interval, r2.repetitions);
    expect(r3.repetitions).toBe(3);
    expect(r3.interval).toBe(Math.round(6 * r2.easeFactor));
  });

  it("nextReviewAt is in the future", () => {
    const result = sm2(4, 2.5, 1, 0);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it("quality=3 (Good) is the minimum passing grade", () => {
    const result = sm2(3, 2.5, 1, 0);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });
});

describe("sm2 — failed reviews (quality < 3)", () => {
  it("quality=0 resets repetitions to 0, interval to 1", () => {
    const result = sm2(0, 2.5, 20, 3);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("quality=1 resets repetitions to 0, interval to 1", () => {
    const result = sm2(1, 2.5, 60, 5);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("quality=2 (Hard) resets repetitions to 0, interval to 1", () => {
    const result = sm2(2, 2.5, 30, 4);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("failed review after a long streak resets correctly", () => {
    let ef = 2.5, interval = 1, reps = 0;
    for (let i = 0; i < 5; i++) {
      const r = sm2(5, ef, interval, reps);
      ef = r.easeFactor;
      interval = r.interval;
      reps = r.repetitions;
    }
    expect(interval).toBeGreaterThan(6);

    const failed = sm2(1, ef, interval, reps);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);
  });
});

describe("sm2 — ease factor", () => {
  it("perfect recall (quality=5) increases ease factor", () => {
    const result = sm2(5, 2.5, 1, 0);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("quality=4 keeps ease factor roughly the same", () => {
    const result = sm2(4, 2.5, 1, 0);
    // EF' = 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0 = 2.5
    expect(result.easeFactor).toBe(2.5);
  });

  it("quality=3 decreases ease factor", () => {
    const result = sm2(3, 2.5, 1, 0);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("quality=0 significantly decreases ease factor", () => {
    const result = sm2(0, 2.5, 1, 0);
    expect(result.easeFactor).toBeLessThan(2.0);
  });

  it("ease factor never falls below 1.3", () => {
    let ef = 2.5;
    for (let i = 0; i < 30; i++) {
      const r = sm2(0, ef, 1, 0);
      ef = r.easeFactor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });

  it("ease factor formula: EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))", () => {
    // quality=5: delta = 0.1 - 0 * (0.08 + 0) = 0.1
    const r5 = sm2(5, 2.5, 1, 0);
    expect(r5.easeFactor).toBeCloseTo(2.6, 5);

    // quality=4: delta = 0.1 - 1 * (0.08 + 0.02) = 0.0
    const r4 = sm2(4, 2.5, 1, 0);
    expect(r4.easeFactor).toBeCloseTo(2.5, 5);

    // quality=3: delta = 0.1 - 2 * (0.08 + 0.04) = 0.1 - 0.24 = -0.14
    const r3 = sm2(3, 2.5, 1, 0);
    expect(r3.easeFactor).toBeCloseTo(2.36, 5);

    // quality=0: delta = 0.1 - 5 * (0.08 + 0.1) = 0.1 - 0.9 = -0.8
    const r0 = sm2(0, 2.5, 1, 0);
    expect(r0.easeFactor).toBeCloseTo(1.7, 5);
  });
});

describe("sm2 — defaults and constants", () => {
  it("DEFAULT_EASE_FACTOR is 2.5", () => {
    expect(DEFAULT_EASE_FACTOR).toBe(2.5);
  });

  it("SM2_DEFAULTS has correct initial values", () => {
    expect(SM2_DEFAULTS.easeFactor).toBe(2.5);
    expect(SM2_DEFAULTS.interval).toBe(1);
    expect(SM2_DEFAULTS.repetitions).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// selfAssessmentToQuality
// ────────────────────────────────────────────────────────────────────────────

describe("selfAssessmentToQuality", () => {
  it("maps again -> 0", () => {
    expect(selfAssessmentToQuality("again")).toBe(0);
  });

  it("maps hard -> 2", () => {
    expect(selfAssessmentToQuality("hard")).toBe(2);
  });

  it("maps good -> 3", () => {
    expect(selfAssessmentToQuality("good")).toBe(3);
  });

  it("maps easy -> 4", () => {
    expect(selfAssessmentToQuality("easy")).toBe(4);
  });

  it("maps perfect -> 5", () => {
    expect(selfAssessmentToQuality("perfect")).toBe(5);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// quizScoreToQuality
// ────────────────────────────────────────────────────────────────────────────

describe("quizScoreToQuality", () => {
  it("score 10 -> quality 5", () => {
    expect(quizScoreToQuality(10)).toBe(5);
  });

  it("score 9 -> quality 5", () => {
    expect(quizScoreToQuality(9)).toBe(5);
  });

  it("score 8 -> quality 4", () => {
    expect(quizScoreToQuality(8)).toBe(4);
  });

  it("score 7 -> quality 4", () => {
    expect(quizScoreToQuality(7)).toBe(4);
  });

  it("score 5 -> quality 3", () => {
    expect(quizScoreToQuality(5)).toBe(3);
  });

  it("score 4 -> quality 3", () => {
    expect(quizScoreToQuality(4)).toBe(3);
  });

  it("score 3 -> quality 1", () => {
    expect(quizScoreToQuality(3)).toBe(1);
  });

  it("score 2 -> quality 1", () => {
    expect(quizScoreToQuality(2)).toBe(1);
  });

  it("score 1 -> quality 0", () => {
    expect(quizScoreToQuality(1)).toBe(0);
  });

  it("score 0 -> quality 0", () => {
    expect(quizScoreToQuality(0)).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Integration: SM-2 progression over multiple reviews
// ────────────────────────────────────────────────────────────────────────────

describe("sm2 — multi-review progression", () => {
  it("perfect reviews produce increasing intervals", () => {
    const intervals: number[] = [];
    let ef = 2.5, interval = 1, reps = 0;

    for (let i = 0; i < 6; i++) {
      const r = sm2(5, ef, interval, reps);
      ef = r.easeFactor;
      interval = r.interval;
      reps = r.repetitions;
      intervals.push(interval);
    }

    // intervals should be: 1, 6, ~17, ~48, ...
    expect(intervals[0]).toBe(1);
    expect(intervals[1]).toBe(6);
    for (let i = 2; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThan(intervals[i - 1]);
    }
  });

  it("mixed reviews produce expected patterns", () => {
    // Start with a few correct reviews, then fail, then recover
    let ef = 2.5, interval = 1, reps = 0;

    // 3 correct reviews
    for (let i = 0; i < 3; i++) {
      const r = sm2(4, ef, interval, reps);
      ef = r.easeFactor;
      interval = r.interval;
      reps = r.repetitions;
    }
    expect(reps).toBe(3);
    expect(interval).toBeGreaterThan(6);

    // Fail once
    const failed = sm2(1, ef, interval, reps);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);

    // Recover with 2 correct reviews
    const r1 = sm2(4, failed.easeFactor, failed.interval, failed.repetitions);
    expect(r1.repetitions).toBe(1);
    expect(r1.interval).toBe(1);

    const r2 = sm2(4, r1.easeFactor, r1.interval, r1.repetitions);
    expect(r2.repetitions).toBe(2);
    expect(r2.interval).toBe(6);
  });
});
