import { describe, it, expect } from "vitest";
import { createSeededRng, shuffle, shuffleOptions } from "@/lib/quiz/shuffle";

describe("createSeededRng", () => {
  it("produces deterministic output for the same seed", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    const vals1 = Array.from({ length: 10 }, () => rng1());
    const vals2 = Array.from({ length: 10 }, () => rng2());
    expect(vals1).toEqual(vals2);
  });

  it("produces different output for different seeds", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(99);
    expect(Array.from({ length: 10 }, () => rng1())).not.toEqual(
      Array.from({ length: 10 }, () => rng2())
    );
  });

  it("produces values in [0, 1)", () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("shuffle", () => {
  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffle(copy);
    expect(copy.sort()).toEqual(arr.sort());
  });

  it("produces roughly uniform distribution over 1000 runs", () => {
    const positionCounts: number[][] = Array.from({ length: 4 }, () => Array(4).fill(0));
    for (let run = 0; run < 1000; run++) {
      const arr = [0, 1, 2, 3];
      shuffle(arr);
      arr.forEach((val, pos) => { positionCounts[val][pos]++; });
    }
    for (let val = 0; val < 4; val++) {
      for (let pos = 0; pos < 4; pos++) {
        expect(positionCounts[val][pos]).toBeGreaterThan(150);
        expect(positionCounts[val][pos]).toBeLessThan(350);
      }
    }
  });
});

describe("shuffleOptions", () => {
  it("shuffles MCQ options and updates correct answer", () => {
    const options = ["A) HashMap", "B) TreeMap", "C) LinkedHashMap", "D) ConcurrentHashMap"];
    const rng = createSeededRng(42);
    const result = shuffleOptions(options, "B", rng);
    expect(result.shuffledOptions).toHaveLength(4);
    const correctIdx = "ABCD".indexOf(result.newCorrectAnswer);
    expect(result.shuffledOptions[correctIdx]).toContain("TreeMap");
  });

  it("handles empty options gracefully", () => {
    const result = shuffleOptions([], "A");
    expect(result.shuffledOptions).toEqual([]);
    expect(result.newCorrectAnswer).toBe("A");
  });

  it("returns unshuffled if correct answer not found", () => {
    const options = ["A) One", "B) Two"];
    const result = shuffleOptions(options, "Z");
    expect(result.shuffledOptions).toEqual(options);
  });
});
