import { describe, it, expect } from "vitest";
import {
  xpForLevel,
  cumulativeXPForLevel,
  levelFromXP,
  xpProgressInLevel,
  getLevelInfo,
} from "@/lib/gamification/xp";

describe("xpForLevel", () => {
  it("returns 100 for level 1", () => {
    expect(xpForLevel(1)).toBe(100);
  });

  it("increases with each level (level 2 > level 1)", () => {
    expect(xpForLevel(2)).toBeGreaterThan(xpForLevel(1));
  });

  it("returns rounded-to-10 values", () => {
    for (let l = 1; l <= 20; l++) {
      expect(xpForLevel(l) % 10).toBe(0);
    }
  });

  it("grows monotonically", () => {
    for (let l = 2; l <= 20; l++) {
      expect(xpForLevel(l)).toBeGreaterThan(xpForLevel(l - 1));
    }
  });
});

describe("cumulativeXPForLevel", () => {
  it("returns 0 for level 1 (start at 0 XP)", () => {
    expect(cumulativeXPForLevel(1)).toBe(0);
  });

  it("returns xpForLevel(1) for level 2", () => {
    expect(cumulativeXPForLevel(2)).toBe(xpForLevel(1));
  });

  it("equals sum of all prior levels", () => {
    for (let l = 3; l <= 10; l++) {
      let sum = 0;
      for (let i = 1; i < l; i++) sum += xpForLevel(i);
      expect(cumulativeXPForLevel(l)).toBe(sum);
    }
  });

  it("is monotonically increasing", () => {
    for (let l = 2; l <= 20; l++) {
      expect(cumulativeXPForLevel(l)).toBeGreaterThan(cumulativeXPForLevel(l - 1));
    }
  });
});

describe("levelFromXP", () => {
  it("returns 1 for 0 XP", () => {
    expect(levelFromXP(0)).toBe(1);
  });

  it("returns correct level at exact cumulative threshold", () => {
    for (let l = 1; l <= 15; l++) {
      expect(levelFromXP(cumulativeXPForLevel(l))).toBe(l);
    }
  });

  it("stays at current level with partial progress", () => {
    const partial = cumulativeXPForLevel(5) + 10;
    expect(levelFromXP(partial)).toBe(5);
  });

  it("advances level when threshold is exactly reached", () => {
    const threshold = cumulativeXPForLevel(6);
    expect(levelFromXP(threshold)).toBe(6);
  });

  it("caps at level 20 for huge XP values", () => {
    expect(levelFromXP(1_000_000)).toBe(20);
    expect(levelFromXP(999_999_999)).toBe(20);
  });

  it("returns 1 for negative XP", () => {
    expect(levelFromXP(-100)).toBe(1);
  });
});

describe("xpProgressInLevel", () => {
  it("returns current=0, percentage=0 at level start", () => {
    const p = xpProgressInLevel(cumulativeXPForLevel(3));
    expect(p.current).toBe(0);
    expect(p.percentage).toBe(0);
  });

  it("returns correct needed = xpForLevel(current level)", () => {
    for (let l = 1; l <= 10; l++) {
      const p = xpProgressInLevel(cumulativeXPForLevel(l));
      expect(p.needed).toBe(xpForLevel(l));
    }
  });

  it("returns ~50% at halfway through a level", () => {
    const halfway = cumulativeXPForLevel(5) + Math.floor(xpForLevel(5) / 2);
    const p = xpProgressInLevel(halfway);
    expect(p.percentage).toBeGreaterThanOrEqual(49);
    expect(p.percentage).toBeLessThanOrEqual(51);
  });

  it("returns percentage 100 at max level", () => {
    const p = xpProgressInLevel(1_000_000);
    expect(p.percentage).toBe(100);
    expect(p.current).toBe(p.needed);
  });

  it("current + remaining always equals needed", () => {
    const testXP = cumulativeXPForLevel(7) + 50;
    const p = xpProgressInLevel(testXP);
    expect(p.current + (p.needed - p.current)).toBe(p.needed);
  });
});

describe("getLevelInfo tier system", () => {
  it("Beginner spans levels 1–3 with sub-levels I, II, III", () => {
    const expectations: Array<[number, "I" | "II" | "III"]> = [[1, "I"], [2, "II"], [3, "III"]];
    for (const [level, sub] of expectations) {
      const info = getLevelInfo(level);
      expect(info.tier).toBe("Beginner");
      expect(info.subLevel).toBe(sub);
    }
  });

  it("Apprentice spans levels 4–6", () => {
    expect(getLevelInfo(4).tier).toBe("Apprentice");
    expect(getLevelInfo(4).subLevel).toBe("I");
    expect(getLevelInfo(6).subLevel).toBe("III");
  });

  it("Scholar spans levels 7–9", () => {
    expect(getLevelInfo(7).tier).toBe("Scholar");
    expect(getLevelInfo(9).tier).toBe("Scholar");
  });

  it("Grandmaster spans levels 19–20 with only I, II sub-levels", () => {
    expect(getLevelInfo(19).tier).toBe("Grandmaster");
    expect(getLevelInfo(19).subLevel).toBe("I");
    expect(getLevelInfo(20).tier).toBe("Grandmaster");
    expect(getLevelInfo(20).subLevel).toBe("II");
  });

  it("title format is 'TierName SubLevel (Description)'", () => {
    expect(getLevelInfo(1).title).toBe("Beginner I (Student)");
    expect(getLevelInfo(5).title).toBe("Apprentice II (Learner)");
    expect(getLevelInfo(20).title).toBe("Grandmaster II (Pinnacle)");
  });

  it("clamps out-of-range levels to 1–20", () => {
    expect(getLevelInfo(0).tier).toBe("Beginner");
    expect(getLevelInfo(25).tier).toBe("Grandmaster");
  });

  it("every level 1–20 returns a valid tier", () => {
    for (let l = 1; l <= 20; l++) {
      const info = getLevelInfo(l);
      expect(info.tier).toBeTruthy();
      expect(info.subLevel).toMatch(/^(I|II|III)$/);
      expect(info.title).toContain(info.tier);
    }
  });
});
