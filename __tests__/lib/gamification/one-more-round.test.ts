import { describe, it, expect } from "vitest";
import {
  checkOneMoreRound,
  type OneMoreRoundContext,
} from "@/lib/gamification/one-more-round";

// ── Helpers ───────────────────────────────────────────────────────────────────

function baseContext(overrides: Partial<OneMoreRoundContext> = {}): OneMoreRoundContext {
  return {
    xpToNextLevel: 200,
    badgesNearUnlock: 0,
    inSessionStreak: 0,
    dailyChallengeAvailable: false,
    decayedTopicCount: 0,
    consecutivePrompts: 0,
    ...overrides,
  };
}

// ── Hard cap ──────────────────────────────────────────────────────────────────

describe("checkOneMoreRound — hard cap", () => {
  it("returns null when consecutivePrompts >= 2", () => {
    const ctx = baseContext({
      consecutivePrompts: 2,
      lastQuizScore: 75, // would normally trigger near_miss
    });
    expect(checkOneMoreRound(ctx)).toBeNull();
  });

  it("returns null when consecutivePrompts is 3", () => {
    const ctx = baseContext({ consecutivePrompts: 3 });
    expect(checkOneMoreRound(ctx)).toBeNull();
  });
});

// ── Near miss ────────────────────────────────────────────────────────────────

describe("checkOneMoreRound — near_miss", () => {
  it("triggers for scores 70–89", () => {
    for (const score of [70, 75, 85, 89]) {
      const result = checkOneMoreRound(baseContext({ lastQuizScore: score }));
      expect(result?.type).toBe("near_miss");
    }
  });

  it("does NOT trigger for score < 70", () => {
    const result = checkOneMoreRound(baseContext({ lastQuizScore: 65 }));
    expect(result?.type).not.toBe("near_miss");
  });

  it("does NOT trigger for score >= 90", () => {
    const result = checkOneMoreRound(baseContext({ lastQuizScore: 90 }));
    expect(result?.type).not.toBe("near_miss");
  });

  it("includes xpMultiplier 1.5", () => {
    const result = checkOneMoreRound(baseContext({ lastQuizScore: 80 }));
    expect(result?.xpMultiplier).toBe(1.5);
  });
});

// ── Close to level ────────────────────────────────────────────────────────────

describe("checkOneMoreRound — close_to_level", () => {
  it("triggers when xpToNextLevel <= 50", () => {
    const result = checkOneMoreRound(baseContext({ xpToNextLevel: 30 }));
    expect(result?.type).toBe("close_to_level");
  });

  it("triggers at exactly 50 XP away", () => {
    const result = checkOneMoreRound(baseContext({ xpToNextLevel: 50 }));
    expect(result?.type).toBe("close_to_level");
  });

  it("does NOT trigger at 51 XP away", () => {
    const result = checkOneMoreRound(baseContext({ xpToNextLevel: 51 }));
    expect(result?.type).not.toBe("close_to_level");
  });
});

// ── Badge near unlock ─────────────────────────────────────────────────────────

describe("checkOneMoreRound — close_to_badge", () => {
  it("triggers when badgesNearUnlock > 0", () => {
    const result = checkOneMoreRound(baseContext({ badgesNearUnlock: 1 }));
    expect(result?.type).toBe("close_to_badge");
  });
});

// ── Streak active ─────────────────────────────────────────────────────────────

describe("checkOneMoreRound — streak_active", () => {
  it("triggers for inSessionStreak >= 5", () => {
    const result = checkOneMoreRound(baseContext({ inSessionStreak: 5 }));
    expect(result?.type).toBe("streak_active");
  });

  it("does NOT trigger for streak < 5", () => {
    const result = checkOneMoreRound(baseContext({ inSessionStreak: 4 }));
    expect(result?.type).not.toBe("streak_active");
  });
});

// ── Daily challenge available ─────────────────────────────────────────────────

describe("checkOneMoreRound — daily_available", () => {
  it("triggers when daily challenge is available", () => {
    const result = checkOneMoreRound(
      baseContext({ dailyChallengeAvailable: true })
    );
    expect(result?.type).toBe("daily_available");
  });
});

// ── Decay alert ───────────────────────────────────────────────────────────────

describe("checkOneMoreRound — decay_alert", () => {
  it("triggers when 2+ topics are decayed", () => {
    const result = checkOneMoreRound(baseContext({ decayedTopicCount: 2 }));
    expect(result?.type).toBe("decay_alert");
  });

  it("does NOT trigger for only 1 decayed topic", () => {
    const result = checkOneMoreRound(baseContext({ decayedTopicCount: 1 }));
    expect(result?.type).not.toBe("decay_alert");
  });
});

// ── Cliffhanger ───────────────────────────────────────────────────────────────

describe("checkOneMoreRound — cliffhanger", () => {
  it("triggers for score >= 90 when nothing else fires", () => {
    const result = checkOneMoreRound(baseContext({ lastQuizScore: 95 }));
    expect(result?.type).toBe("cliffhanger");
  });
});

// ── Returns null when nothing applies ────────────────────────────────────────

describe("checkOneMoreRound — no trigger", () => {
  it("returns null when no conditions are met", () => {
    const result = checkOneMoreRound(baseContext());
    expect(result).toBeNull();
  });
});

// ── Priority ordering ─────────────────────────────────────────────────────────

describe("checkOneMoreRound — priority ordering", () => {
  it("near_miss beats close_to_level", () => {
    const result = checkOneMoreRound(
      baseContext({ lastQuizScore: 80, xpToNextLevel: 20 })
    );
    expect(result?.type).toBe("near_miss");
  });

  it("close_to_level beats close_to_badge", () => {
    const result = checkOneMoreRound(
      baseContext({ xpToNextLevel: 10, badgesNearUnlock: 2 })
    );
    expect(result?.type).toBe("close_to_level");
  });
});
