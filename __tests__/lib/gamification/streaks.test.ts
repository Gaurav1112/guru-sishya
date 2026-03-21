import { describe, it, expect } from "vitest";
import {
  checkStreak,
  getFlameColor,
  STREAK_MILESTONES,
  type StreakState,
} from "@/lib/gamification/streaks";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<StreakState> = {}): StreakState {
  return {
    currentStreak: 0,
    longestStreak: 0,
    freezesAvailable: 0,
    lastActivityDate: "",
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// checkStreak
// ────────────────────────────────────────────────────────────────────────────

describe("checkStreak", () => {
  it("returns 'maintained' when last activity was yesterday and increments streak", () => {
    const state = makeState({ currentStreak: 3, longestStreak: 3, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.status).toBe("maintained");
    expect(result.newState.currentStreak).toBe(4);
    expect(result.newState.longestStreak).toBe(4);
    expect(result.newState.lastActivityDate).toBe("2024-01-02");
  });

  it("returns 'already_done' when last activity was today", () => {
    const state = makeState({ currentStreak: 5, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-01");
    expect(result.status).toBe("already_done");
    expect(result.newState).toBe(state);
  });

  it("returns 'frozen' when gap is exactly 2 days and freeze available, uses freeze", () => {
    const state = makeState({
      currentStreak: 10,
      longestStreak: 10,
      freezesAvailable: 1,
      lastActivityDate: "2024-01-01",
    });
    const result = checkStreak(state, "2024-01-03"); // 2-day gap
    expect(result.status).toBe("frozen");
    expect(result.newState.currentStreak).toBe(10); // streak unchanged
    expect(result.newState.freezesAvailable).toBe(0); // used one freeze
    expect(result.newState.lastActivityDate).toBe("2024-01-03");
  });

  it("returns 'broken' when gap > 1 and no freeze available, resets streak to 1", () => {
    const state = makeState({
      currentStreak: 15,
      longestStreak: 15,
      freezesAvailable: 0,
      lastActivityDate: "2024-01-01",
    });
    const result = checkStreak(state, "2024-01-04"); // 3-day gap
    expect(result.status).toBe("broken");
    expect(result.newState.currentStreak).toBe(1);
    expect(result.newState.longestStreak).toBe(15); // longest preserved
    expect(result.newState.lastActivityDate).toBe("2024-01-04");
  });

  it("returns 'broken' when gap is 2 and no freeze available", () => {
    const state = makeState({
      currentStreak: 5,
      longestStreak: 5,
      freezesAvailable: 0,
      lastActivityDate: "2024-01-01",
    });
    const result = checkStreak(state, "2024-01-03"); // 2-day gap, no freeze
    expect(result.status).toBe("broken");
    expect(result.newState.currentStreak).toBe(1);
  });

  it("starts a new streak when no prior activity", () => {
    const state = makeState({ lastActivityDate: "" });
    const result = checkStreak(state, "2024-01-01");
    expect(result.status).toBe("maintained");
    expect(result.newState.currentStreak).toBe(1);
  });

  it("updates longestStreak when current exceeds it", () => {
    const state = makeState({ currentStreak: 7, longestStreak: 7, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.newState.longestStreak).toBe(8);
  });

  it("does not reduce longestStreak when streak breaks", () => {
    const state = makeState({ currentStreak: 20, longestStreak: 20, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-05"); // large gap
    expect(result.newState.longestStreak).toBe(20);
    expect(result.newState.currentStreak).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Milestone detection
// ────────────────────────────────────────────────────────────────────────────

describe("milestone detection", () => {
  it("returns the 7-day milestone when streak hits 7", () => {
    const state = makeState({ currentStreak: 6, longestStreak: 6, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.milestone).toBeDefined();
    expect(result.milestone?.day).toBe(7);
    expect(result.milestone?.badge).toBe("nityam");
    expect(result.milestone?.xp).toBe(50);
  });

  it("returns the 30-day milestone when streak hits 30", () => {
    const state = makeState({ currentStreak: 29, longestStreak: 29, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.milestone?.day).toBe(30);
    expect(result.milestone?.badge).toBe("tapasvi");
  });

  it("returns the 3-day freeze milestone", () => {
    const state = makeState({ currentStreak: 2, longestStreak: 2, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.milestone?.day).toBe(3);
    expect(result.milestone?.freeze).toBe(1);
  });

  it("returns no milestone for non-milestone streaks", () => {
    const state = makeState({ currentStreak: 4, longestStreak: 4, lastActivityDate: "2024-01-01" });
    const result = checkStreak(state, "2024-01-02");
    expect(result.milestone).toBeUndefined();
  });

  it("STREAK_MILESTONES has all expected milestone days", () => {
    const days = STREAK_MILESTONES.map((m) => m.day);
    expect(days).toContain(3);
    expect(days).toContain(7);
    expect(days).toContain(14);
    expect(days).toContain(30);
    expect(days).toContain(100);
    expect(days).toContain(365);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getFlameColor
// ────────────────────────────────────────────────────────────────────────────

describe("getFlameColor", () => {
  it("returns yellow for streaks below 7", () => {
    expect(getFlameColor(0)).toBe("yellow");
    expect(getFlameColor(1)).toBe("yellow");
    expect(getFlameColor(6)).toBe("yellow");
  });

  it("returns orange for streaks 7–29", () => {
    expect(getFlameColor(7)).toBe("orange");
    expect(getFlameColor(15)).toBe("orange");
    expect(getFlameColor(29)).toBe("orange");
  });

  it("returns blue for streaks 30–99", () => {
    expect(getFlameColor(30)).toBe("blue");
    expect(getFlameColor(50)).toBe("blue");
    expect(getFlameColor(99)).toBe("blue");
  });

  it("returns purple for streaks 100–364", () => {
    expect(getFlameColor(100)).toBe("purple");
    expect(getFlameColor(200)).toBe("purple");
    expect(getFlameColor(364)).toBe("purple");
  });

  it("returns diamond for streaks 365+", () => {
    expect(getFlameColor(365)).toBe("diamond");
    expect(getFlameColor(1000)).toBe("diamond");
  });
});
