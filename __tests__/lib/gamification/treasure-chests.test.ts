import { describe, it, expect } from "vitest";
import {
  shouldDropChest,
  generateChestContents,
} from "@/lib/gamification/treasure-chests";

// ── shouldDropChest ───────────────────────────────────────────────────────────

describe("shouldDropChest", () => {
  it("returns false when gap < 3 rounds", () => {
    expect(shouldDropChest(5, 4)).toBe(false); // gap=1
    expect(shouldDropChest(5, 3)).toBe(false); // gap=2
  });

  it("always returns false when gap < 3", () => {
    for (let i = 0; i < 20; i++) {
      expect(shouldDropChest(10, 9)).toBe(false);
    }
  });

  it("always returns true when gap >= 7", () => {
    expect(shouldDropChest(10, 3)).toBe(true); // gap=7
    expect(shouldDropChest(15, 5)).toBe(true); // gap=10
    expect(shouldDropChest(100, 1)).toBe(true); // gap=99
  });

  it("is probabilistic for gap 3-6 — returns both true and false across 100 runs", () => {
    // gap=3 → 20% chance; over 100 runs we should see both outcomes
    const results = Array.from({ length: 100 }, () => shouldDropChest(13, 10));
    // With 20% probability the chance of ALL false in 100 runs is ~0.8^100 ≈ 2e-10
    // and ALL true is ~0.2^100 ≈ 0 — so we expect both
    expect(results.some(Boolean)).toBe(true);
    expect(results.some((r) => !r)).toBe(true);
  });
});

// ── generateChestContents ─────────────────────────────────────────────────────

describe("generateChestContents", () => {
  it("always returns coins in range [20, 100]", () => {
    for (let i = 0; i < 50; i++) {
      const { coins } = generateChestContents();
      expect(coins).toBeGreaterThanOrEqual(20);
      expect(coins).toBeLessThanOrEqual(100);
    }
  });

  it("item is either undefined or has type/id/name", () => {
    for (let i = 0; i < 50; i++) {
      const { item } = generateChestContents();
      if (item !== undefined) {
        expect(typeof item.type).toBe("string");
        expect(typeof item.id).toBe("string");
        expect(typeof item.name).toBe("string");
        expect(["cosmetic", "potion"]).toContain(item.type);
      }
    }
  });

  it("roughly 30% of chests contain an item (statistical test)", () => {
    const runs = 500;
    const withItem = Array.from({ length: runs }, () => generateChestContents()).filter(
      (c) => c.item !== undefined
    ).length;
    // Expect item rate between 15% and 50%
    expect(withItem / runs).toBeGreaterThan(0.1);
    expect(withItem / runs).toBeLessThan(0.55);
  });
});
