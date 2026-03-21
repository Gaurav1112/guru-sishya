import { describe, it, expect } from "vitest";
import {
  generateSimulatedLeague,
  getLeague,
  getLeagueColor,
  shouldResetLeague,
} from "@/lib/gamification/leaderboard";

// ── getLeague ─────────────────────────────────────────────────────────────────

describe("getLeague", () => {
  it("returns Bronze for 0 XP", () => {
    expect(getLeague(0)).toBe("Bronze");
  });

  it("returns Silver at 500 XP", () => {
    expect(getLeague(500)).toBe("Silver");
  });

  it("returns Gold at 1500 XP", () => {
    expect(getLeague(1500)).toBe("Gold");
  });

  it("returns Sapphire at 3500 XP", () => {
    expect(getLeague(3500)).toBe("Sapphire");
  });

  it("returns Ruby at 7000 XP", () => {
    expect(getLeague(7000)).toBe("Ruby");
  });

  it("returns Emerald at 12000 XP", () => {
    expect(getLeague(12000)).toBe("Emerald");
  });

  it("returns Diamond at 20000 XP", () => {
    expect(getLeague(20000)).toBe("Diamond");
  });

  it("stays in the highest bracket for huge XP", () => {
    expect(getLeague(999999)).toBe("Diamond");
  });
});

// ── getLeagueColor ────────────────────────────────────────────────────────────

describe("getLeagueColor", () => {
  it("returns a non-empty string for every league", () => {
    const leagues = [
      "Bronze", "Silver", "Gold", "Sapphire", "Ruby", "Emerald", "Diamond",
    ];
    for (const league of leagues) {
      const color = getLeagueColor(league);
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback for unknown league", () => {
    expect(getLeagueColor("Unknown")).toBe("#cd7f32");
  });
});

// ── shouldResetLeague ─────────────────────────────────────────────────────────

describe("shouldResetLeague", () => {
  it("returns true when lastResetDate is empty", () => {
    expect(shouldResetLeague("", "2025-03-21")).toBe(true);
  });

  it("returns false when the same date is given", () => {
    expect(shouldResetLeague("2025-03-21", "2025-03-21")).toBe(false);
  });

  it("returns false when both dates are in the same week", () => {
    // Monday and Wednesday of the same week
    expect(shouldResetLeague("2025-03-17", "2025-03-19")).toBe(false);
  });

  it("returns true when dates span different weeks", () => {
    // Different weeks
    expect(shouldResetLeague("2025-03-10", "2025-03-21")).toBe(true);
  });
});

// ── generateSimulatedLeague ───────────────────────────────────────────────────

describe("generateSimulatedLeague", () => {
  it("generates 15-20 users", () => {
    const users = generateSimulatedLeague(300, 5);
    expect(users.length).toBeGreaterThanOrEqual(15);
    expect(users.length).toBeLessThanOrEqual(20);
  });

  it("every user has a non-empty name, weeklyXP > 0, league, archetype", () => {
    const users = generateSimulatedLeague(200, 3);
    for (const user of users) {
      expect(user.name.length).toBeGreaterThan(0);
      expect(user.weeklyXP).toBeGreaterThan(0);
      expect(user.league.length).toBeGreaterThan(0);
      expect(user.archetype).toBeTruthy();
    }
  });

  it("is deterministic — same inputs produce the same names and XP values", () => {
    const first = generateSimulatedLeague(400, 6);
    const second = generateSimulatedLeague(400, 6);
    expect(first.map((u) => u.name)).toEqual(second.map((u) => u.name));
    expect(first.map((u) => u.weeklyXP)).toEqual(second.map((u) => u.weeklyXP));
  });

  it("calibrates XP around the user's weeklyXP", () => {
    const base = 500;
    const users = generateSimulatedLeague(base, 7);
    const xps = users.map((u) => u.weeklyXP);
    const max = Math.max(...xps);
    // At least one user is above the base (the overachiever)
    expect(max).toBeGreaterThan(base);
    // At least one user is below the base
    const min = Math.min(...xps);
    expect(min).toBeLessThan(base);
  });

  it("works when userWeeklyXP is 0", () => {
    const users = generateSimulatedLeague(0, 1);
    expect(users.length).toBeGreaterThanOrEqual(15);
  });
});
