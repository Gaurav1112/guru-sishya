import { describe, it, expect } from "vitest";
import {
  scheduleReview,
  calculateRetention,
  getDecayState,
  type FlashcardSchedule,
} from "@/lib/spaced-repetition";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function newCard(): FlashcardSchedule {
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewAt: new Date(),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// scheduleReview
// ────────────────────────────────────────────────────────────────────────────

describe("scheduleReview – correct answers", () => {
  it("first correct review (quality=4): interval becomes 1, repetitions=1", () => {
    const result = scheduleReview(newCard(), 4);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
  });

  it("second consecutive correct review (quality=4): interval becomes 6", () => {
    const after1 = scheduleReview(newCard(), 4);
    const after2 = scheduleReview(after1, 4);
    expect(after2.repetitions).toBe(2);
    expect(after2.interval).toBe(6);
  });

  it("third consecutive correct review uses interval * easeFactor", () => {
    const after1 = scheduleReview(newCard(), 5);
    const after2 = scheduleReview(after1, 5);
    const after3 = scheduleReview(after2, 5);
    expect(after3.repetitions).toBe(3);
    // interval = round(6 * easeFactor)
    expect(after3.interval).toBe(Math.round(6 * after2.easeFactor));
  });

  it("nextReviewAt is in the future", () => {
    const result = scheduleReview(newCard(), 4);
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("scheduleReview – failed review", () => {
  it("quality=0 resets repetitions to 0 and interval to 1", () => {
    const card = { ...newCard(), repetitions: 3, interval: 20 };
    const result = scheduleReview(card, 0);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("quality=2 (below 3) resets repetitions to 0", () => {
    const card = { ...newCard(), repetitions: 5, interval: 60 };
    const result = scheduleReview(card, 2);
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(1);
  });

  it("failed review after a long streak resets correctly", () => {
    // Simulate several correct reviews
    let card = newCard();
    for (let i = 0; i < 5; i++) card = scheduleReview(card, 5);
    const prevInterval = card.interval;
    expect(prevInterval).toBeGreaterThan(6);

    // Now fail
    const failed = scheduleReview(card, 1);
    expect(failed.repetitions).toBe(0);
    expect(failed.interval).toBe(1);
  });
});

describe("scheduleReview – easeFactor", () => {
  it("perfect recall (quality=5) increases easeFactor", () => {
    const card = newCard(); // EF = 2.5
    const result = scheduleReview(card, 5);
    expect(result.easeFactor).toBeGreaterThan(2.5);
  });

  it("quality=3 decreases easeFactor", () => {
    const card = newCard(); // EF = 2.5
    const result = scheduleReview(card, 3);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it("easeFactor never falls below 1.3", () => {
    let card = newCard();
    // Repeatedly fail with quality=0
    for (let i = 0; i < 20; i++) {
      card = scheduleReview(card, 0);
    }
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("easeFactor stays >= 1.3 with quality=1 repeated", () => {
    let card = newCard();
    for (let i = 0; i < 30; i++) {
      card = scheduleReview(card, 1);
    }
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// calculateRetention
// ────────────────────────────────────────────────────────────────────────────

describe("calculateRetention", () => {
  it("returns 1 when daysSinceReview is 0", () => {
    expect(calculateRetention(0, 10, 2.5)).toBe(1);
  });

  it("returns 1 when daysSinceReview is negative", () => {
    expect(calculateRetention(-5, 10, 2.5)).toBe(1);
  });

  it("retention decreases over time", () => {
    const r1 = calculateRetention(1, 10, 2.5);
    const r5 = calculateRetention(5, 10, 2.5);
    const r10 = calculateRetention(10, 10, 2.5);
    expect(r1).toBeGreaterThan(r5);
    expect(r5).toBeGreaterThan(r10);
  });

  it("higher easeFactor means slower decay", () => {
    const rLow = calculateRetention(5, 10, 1.3);
    const rHigh = calculateRetention(5, 10, 2.5);
    expect(rHigh).toBeGreaterThan(rLow);
  });

  it("retention is between 0 and 1", () => {
    const r = calculateRetention(7, 5, 2.5);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getDecayState
// ────────────────────────────────────────────────────────────────────────────

describe("getDecayState", () => {
  it("returns 'mastered' for retention >= 0.9", () => {
    expect(getDecayState(1.0)).toBe("mastered");
    expect(getDecayState(0.9)).toBe("mastered");
  });

  it("returns 'strong' for retention in [0.7, 0.9)", () => {
    expect(getDecayState(0.89)).toBe("strong");
    expect(getDecayState(0.7)).toBe("strong");
  });

  it("returns 'fading' for retention in [0.5, 0.7)", () => {
    expect(getDecayState(0.69)).toBe("fading");
    expect(getDecayState(0.5)).toBe("fading");
  });

  it("returns 'needs_review' for retention in [0.3, 0.5)", () => {
    expect(getDecayState(0.49)).toBe("needs_review");
    expect(getDecayState(0.3)).toBe("needs_review");
  });

  it("returns 'forgotten' for retention < 0.3", () => {
    expect(getDecayState(0.29)).toBe("forgotten");
    expect(getDecayState(0)).toBe("forgotten");
  });
});
