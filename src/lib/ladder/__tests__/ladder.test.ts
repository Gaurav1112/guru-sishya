import { describe, it, expect } from "vitest";

// ── Graduation test scoring logic ─────────────────────────────────────────────

const PASS_THRESHOLD = 0.8;

function didPass(correctCount: number, totalQuestions: number): boolean {
  return correctCount / totalQuestions >= PASS_THRESHOLD;
}

function cooldownRemaining(lastAttemptMs: number, nowMs: number): number {
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  return Math.max(0, lastAttemptMs + COOLDOWN_MS - nowMs);
}

describe("Graduation test scoring", () => {
  describe("Standard test (5 questions, 80% pass threshold)", () => {
    it("passes with 4 out of 5 correct (80%)", () => {
      expect(didPass(4, 5)).toBe(true);
    });

    it("passes with 5 out of 5 correct (100%)", () => {
      expect(didPass(5, 5)).toBe(true);
    });

    it("fails with 3 out of 5 correct (60%)", () => {
      expect(didPass(3, 5)).toBe(false);
    });

    it("fails with 0 out of 5 correct (0%)", () => {
      expect(didPass(0, 5)).toBe(false);
    });
  });

  describe("Boss battle (10 questions, 80% pass threshold)", () => {
    it("passes with 8 out of 10 correct (80%)", () => {
      expect(didPass(8, 10)).toBe(true);
    });

    it("passes with 10 out of 10 correct (100%)", () => {
      expect(didPass(10, 10)).toBe(true);
    });

    it("fails with 7 out of 10 correct (70%)", () => {
      expect(didPass(7, 10)).toBe(false);
    });

    it("fails with 0 out of 10 correct (0%)", () => {
      expect(didPass(0, 10)).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("exactly 80% passes", () => {
      // 4/5 = 0.8
      expect(didPass(4, 5)).toBe(true);
    });

    it("just below 80% fails", () => {
      // 3/4 = 0.75
      expect(didPass(3, 4)).toBe(false);
    });
  });
});

// ── Cooldown logic ────────────────────────────────────────────────────────────

describe("Graduation test cooldown", () => {
  const ONE_HOUR_MS = 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * ONE_HOUR_MS;

  it("returns zero when no cooldown is active (more than 24h ago)", () => {
    const lastAttempt = Date.now() - ONE_DAY_MS - 1000;
    expect(cooldownRemaining(lastAttempt, Date.now())).toBe(0);
  });

  it("returns remaining time when cooldown is active", () => {
    const lastAttempt = Date.now() - ONE_HOUR_MS; // 1 hour ago
    const remaining = cooldownRemaining(lastAttempt, Date.now());
    expect(remaining).toBeGreaterThan(ONE_DAY_MS - ONE_HOUR_MS - 1000);
    expect(remaining).toBeLessThanOrEqual(ONE_DAY_MS - ONE_HOUR_MS);
  });

  it("returns zero when exactly 24 hours have passed", () => {
    const lastAttempt = Date.now() - ONE_DAY_MS;
    expect(cooldownRemaining(lastAttempt, Date.now())).toBe(0);
  });

  it("is non-negative (never returns negative)", () => {
    const futureAttempt = Date.now() + ONE_HOUR_MS; // impossible but defensive
    expect(cooldownRemaining(futureAttempt, Date.now())).toBeGreaterThanOrEqual(0);
  });
});

// ── Level unlock logic ────────────────────────────────────────────────────────

describe("Level unlock progression", () => {
  function nextUnlockedLevel(currentUnlocked: number, passedLevel: number, isBoss: boolean): number {
    if (isBoss) return 5;
    return Math.max(currentUnlocked, passedLevel + 1);
  }

  it("unlocks level 2 after passing level 1 test", () => {
    expect(nextUnlockedLevel(1, 1, false)).toBe(2);
  });

  it("unlocks level 3 after passing level 2 test", () => {
    expect(nextUnlockedLevel(2, 2, false)).toBe(3);
  });

  it("unlocks level 5 state after boss battle", () => {
    expect(nextUnlockedLevel(4, 5, true)).toBe(5);
  });

  it("does not downgrade if already at a higher unlock level", () => {
    // Already unlocked level 3, passing level 1 test shouldn't downgrade
    expect(nextUnlockedLevel(3, 1, false)).toBe(3);
  });
});

// ── Dreyfus → Bloom level mapping ────────────────────────────────────────────

describe("Dreyfus to Bloom level mapping", () => {
  const DREYFUS_TO_BLOOM: Record<number, number> = {
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
  };

  it("maps each Dreyfus level to the correct Bloom base level", () => {
    expect(DREYFUS_TO_BLOOM[1]).toBe(1); // Novice → Remember
    expect(DREYFUS_TO_BLOOM[2]).toBe(2); // Adv. Beginner → Understand
    expect(DREYFUS_TO_BLOOM[3]).toBe(3); // Competent → Apply
    expect(DREYFUS_TO_BLOOM[4]).toBe(4); // Proficient → Analyze
    expect(DREYFUS_TO_BLOOM[5]).toBe(5); // Expert → Evaluate
  });

  it("all Dreyfus levels have valid Bloom levels (1–7)", () => {
    for (const level of [1, 2, 3, 4, 5]) {
      const bloom = DREYFUS_TO_BLOOM[level];
      expect(bloom).toBeGreaterThanOrEqual(1);
      expect(bloom).toBeLessThanOrEqual(7);
    }
  });
});
