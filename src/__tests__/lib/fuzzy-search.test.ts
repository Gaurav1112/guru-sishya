import { describe, it, expect } from "vitest";
import { fuzzyMatch, didYouMean } from "@/lib/fuzzy-search";

describe("fuzzyMatch", () => {
  it("returns empty array for empty query", () => {
    expect(fuzzyMatch("", ["react", "vue"])).toEqual([]);
    expect(fuzzyMatch("  ", ["react"])).toEqual([]);
  });

  it("returns exact substring matches", () => {
    const result = fuzzyMatch("react", ["React NextJS", "vue", "react-dom"]);
    expect(result).toContain("React NextJS");
    expect(result).toContain("react-dom");
    expect(result).not.toContain("vue");
  });

  it("returns word-start matches", () => {
    const result = fuzzyMatch("sy", ["System Design", "Vue", "Systems"]);
    expect(result).toContain("System Design");
    expect(result).toContain("Systems");
    expect(result).not.toContain("Vue");
  });

  it("matches typos within ~40% edit distance", () => {
    expect(fuzzyMatch("dyanmic", ["dynamic programming"])).toContain("dynamic programming");
    expect(fuzzyMatch("javascrip", ["JavaScript"])).toContain("JavaScript");
  });

  it("does not match completely unrelated strings", () => {
    const result = fuzzyMatch("xyz999", ["React", "Vue", "Angular"]);
    expect(result).toHaveLength(0);
  });

  it("respects the limit parameter", () => {
    const items = ["item1", "item2", "item3", "item4", "item5", "item6"];
    expect(fuzzyMatch("item", items, 3)).toHaveLength(3);
    expect(fuzzyMatch("item", items, 1)).toHaveLength(1);
  });

  it("returns at most limit results by default (5)", () => {
    const items = Array.from({ length: 20 }, (_, i) => `topic ${i}`);
    expect(fuzzyMatch("topic", items).length).toBeLessThanOrEqual(5);
  });

  it("ranks exact substring matches above fuzzy matches", () => {
    const items = ["react", "reach", "rezct"];
    const result = fuzzyMatch("react", items);
    expect(result[0]).toBe("react"); // exact wins
  });

  it("handles multi-word queries matching all words", () => {
    const result = fuzzyMatch("data structure", ["Data Structures & Algorithms", "Vue"]);
    expect(result).toContain("Data Structures & Algorithms");
    expect(result).not.toContain("Vue");
  });

  it("is case-insensitive", () => {
    expect(fuzzyMatch("REACT", ["React NextJS"])).toContain("React NextJS");
    expect(fuzzyMatch("react", ["REACT"])).toContain("REACT");
  });
});

describe("didYouMean", () => {
  it("returns null for empty query", () => {
    expect(didYouMean("", ["react"])).toBeNull();
    expect(didYouMean("  ", ["react"])).toBeNull();
  });

  it("returns null when exact substring match exists", () => {
    const result = didYouMean("react", ["React NextJS", "Vue"]);
    expect(result).toBeNull();
  });

  it("suggests best match for close typos (transposition, no substring overlap)", () => {
    // "raect" has no substring overlap with "react" so hasExact stays false
    const result = didYouMean("raect", ["React", "Vue", "Angular"]);
    expect(result).toBe("React");
  });

  it("returns null when best match is too far away", () => {
    const result = didYouMean("xyzabc", ["React", "Vue", "Angular"]);
    expect(result).toBeNull();
  });

  it("suggests best from multiple candidates", () => {
    const result = didYouMean("kafkka", ["Kafka", "Kubernetes", "AWS"]);
    expect(result).toBe("Kafka");
  });
});
