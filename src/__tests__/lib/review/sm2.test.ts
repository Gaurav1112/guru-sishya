import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  sm2,
  selfAssessmentToQuality,
  quizScoreToQuality,
  DEFAULT_EASE_FACTOR,
} from "@/lib/review/sm2";

// Pin Date.now so nextReviewAt calculations are deterministic
const FIXED_NOW = new Date("2024-06-01T12:00:00Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sm2 — failed reviews (quality < 3)", () => {
  it("resets repetitions to 0 and interval to 1 on quality 0", () => {
    const r = sm2(0, 2.5, 10, 5);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it("resets repetitions to 0 and interval to 1 on quality 2", () => {
    const r = sm2(2, 2.5, 10, 5);
    expect(r.repetitions).toBe(0);
    expect(r.interval).toBe(1);
  });

  it("schedules next review exactly 1 day away", () => {
    const r = sm2(0, 2.5, 10, 5);
    const expected = new Date(FIXED_NOW + 1 * 86_400_000);
    expect(r.nextReviewAt.getTime()).toBe(expected.getTime());
  });

  it("decreases ease factor below 2.5 for quality 0", () => {
    const r = sm2(0, 2.5, 1, 1);
    expect(r.easeFactor).toBeLessThan(2.5);
  });

  it("enforces minimum ease factor of 1.3", () => {
    // Apply many failures to drive ease factor to floor
    let ef = 2.5;
    let interval = 1;
    let reps = 0;
    for (let i = 0; i < 20; i++) {
      const result = sm2(0, ef, interval, reps);
      ef = result.easeFactor;
      interval = result.interval;
      reps = result.repetitions;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });
});

describe("sm2 — first correct review (repetitions 0 → 1)", () => {
  it("sets interval to 1 and repetitions to 1", () => {
    const r = sm2(4, 2.5, 1, 0);
    expect(r.repetitions).toBe(1);
    expect(r.interval).toBe(1);
  });
});

describe("sm2 — second correct review (repetitions 1 → 2)", () => {
  it("sets interval to 6 and repetitions to 2", () => {
    const r = sm2(4, 2.5, 1, 1);
    expect(r.repetitions).toBe(2);
    expect(r.interval).toBe(6);
  });
});

describe("sm2 — third+ correct review (repetitions ≥ 2)", () => {
  it("multiplies interval by ease factor", () => {
    const r = sm2(4, 2.5, 6, 2);
    expect(r.repetitions).toBe(3);
    expect(r.interval).toBe(Math.round(6 * 2.5));
  });

  it("increments repetitions by 1 each time", () => {
    const r = sm2(4, 2.5, 15, 3);
    expect(r.repetitions).toBe(4);
  });
});

describe("sm2 — ease factor formula", () => {
  it("quality 5 increases ease factor", () => {
    const r = sm2(5, 2.5, 6, 2);
    expect(r.easeFactor).toBeGreaterThan(2.5);
  });

  it("quality 4 keeps ease factor at 2.5 (formula yields 0 delta)", () => {
    // EF' = EF + (0.1 - (5-4) * (0.08 + (5-4) * 0.02)) = EF + (0.1 - 0.1) = EF
    const r = sm2(4, 2.5, 6, 2);
    expect(r.easeFactor).toBeCloseTo(2.5, 5);
  });

  it("quality 3 slightly decreases ease factor", () => {
    const r = sm2(3, 2.5, 6, 2);
    expect(r.easeFactor).toBeLessThan(2.5);
  });

  it("quality 0 maximally decreases ease factor", () => {
    const r0 = sm2(0, 2.5, 1, 0);
    const r3 = sm2(3, 2.5, 1, 0);
    expect(r0.easeFactor).toBeLessThan(r3.easeFactor);
  });
});

describe("sm2 — quality clamping", () => {
  it("clamps quality below 0 to 0", () => {
    const r = sm2(-5, 2.5, 1, 0);
    const rZero = sm2(0, 2.5, 1, 0);
    expect(r.easeFactor).toBeCloseTo(rZero.easeFactor, 5);
    expect(r.interval).toBe(rZero.interval);
  });

  it("clamps quality above 5 to 5", () => {
    const r = sm2(10, 2.5, 6, 2);
    const rFive = sm2(5, 2.5, 6, 2);
    expect(r.easeFactor).toBeCloseTo(rFive.easeFactor, 5);
  });
});

describe("sm2 — nextReviewAt calculation", () => {
  it("interval 1 sets nextReviewAt to tomorrow", () => {
    const r = sm2(4, 2.5, 1, 0); // first correct → interval 1
    const tomorrow = new Date(FIXED_NOW + 86_400_000);
    expect(r.nextReviewAt.getTime()).toBe(tomorrow.getTime());
  });

  it("interval 6 sets nextReviewAt to 6 days from now", () => {
    const r = sm2(4, 2.5, 1, 1); // second correct → interval 6
    const expected = new Date(FIXED_NOW + 6 * 86_400_000);
    expect(r.nextReviewAt.getTime()).toBe(expected.getTime());
  });
});

describe("selfAssessmentToQuality", () => {
  it("maps all labels to correct SM-2 quality values", () => {
    expect(selfAssessmentToQuality("again")).toBe(0);
    expect(selfAssessmentToQuality("hard")).toBe(2);
    expect(selfAssessmentToQuality("good")).toBe(3);
    expect(selfAssessmentToQuality("easy")).toBe(4);
    expect(selfAssessmentToQuality("perfect")).toBe(5);
  });

  it("again and hard are both failing (< 3)", () => {
    expect(selfAssessmentToQuality("again")).toBeLessThan(3);
    expect(selfAssessmentToQuality("hard")).toBeLessThan(3);
  });

  it("good, easy, perfect are all passing (≥ 3)", () => {
    expect(selfAssessmentToQuality("good")).toBeGreaterThanOrEqual(3);
    expect(selfAssessmentToQuality("easy")).toBeGreaterThanOrEqual(3);
    expect(selfAssessmentToQuality("perfect")).toBeGreaterThanOrEqual(3);
  });
});

describe("quizScoreToQuality", () => {
  it("score >= 9 maps to 5 (perfect)", () => {
    expect(quizScoreToQuality(9)).toBe(5);
    expect(quizScoreToQuality(10)).toBe(5);
  });

  it("score >= 7 and < 9 maps to 4 (easy)", () => {
    expect(quizScoreToQuality(7)).toBe(4);
    expect(quizScoreToQuality(8)).toBe(4);
  });

  it("score >= 4 and < 7 maps to 3 (good)", () => {
    expect(quizScoreToQuality(4)).toBe(3);
    expect(quizScoreToQuality(6)).toBe(3);
  });

  it("score >= 2 and < 4 maps to 1 (forgot)", () => {
    expect(quizScoreToQuality(2)).toBe(1);
    expect(quizScoreToQuality(3)).toBe(1);
  });

  it("score < 2 maps to 0 (blackout)", () => {
    expect(quizScoreToQuality(0)).toBe(0);
    expect(quizScoreToQuality(1)).toBe(0);
  });
});
