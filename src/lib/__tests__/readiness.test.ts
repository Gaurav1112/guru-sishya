import { describe, it, expect } from "vitest";
import {
  mapTopicToCategory,
  computeCategoryScores,
  computeOverallReadiness,
  getStudyRecommendations,
  COMPANY_WEIGHTS,
  type InterviewHistoryEntry,
  type CategoryScores,
} from "../readiness";

describe("mapTopicToCategory", () => {
  it("maps Java topics", () => {
    expect(mapTopicToCategory("Java Core")).toBe("java");
    expect(mapTopicToCategory("Spring Boot")).toBe("java");
    expect(mapTopicToCategory("JVM internals")).toBe("java");
    expect(mapTopicToCategory("Concurrency")).toBe("java");
  });

  it("maps System Design topics", () => {
    expect(mapTopicToCategory("System Design")).toBe("systemDesign");
    expect(mapTopicToCategory("HLD patterns")).toBe("systemDesign");
    expect(mapTopicToCategory("LLD parking lot")).toBe("systemDesign");
    expect(mapTopicToCategory("Architecture")).toBe("systemDesign");
  });

  it("maps DSA topics", () => {
    expect(mapTopicToCategory("DSA")).toBe("dsa");
    expect(mapTopicToCategory("Algorithms")).toBe("dsa");
    expect(mapTopicToCategory("Graph BFS")).toBe("dsa");
    expect(mapTopicToCategory("Dynamic Programming")).toBe("dsa");
    expect(mapTopicToCategory("Data Structures")).toBe("dsa");
  });

  it("maps Behavioral topics", () => {
    expect(mapTopicToCategory("Behavioral")).toBe("behavioral");
    expect(mapTopicToCategory("STAR questions")).toBe("behavioral");
    expect(mapTopicToCategory("Leadership Principles")).toBe("behavioral");
  });

  it("returns null for All or unknown", () => {
    expect(mapTopicToCategory("All")).toBeNull();
    expect(mapTopicToCategory("unknown topic")).toBeNull();
  });
});

describe("computeCategoryScores", () => {
  const history: InterviewHistoryEntry[] = [
    { date: "2026-06-15", company: "swiggy", topic: "Java Core", overallScore: 80 },
    { date: "2026-06-16", company: "swiggy", topic: "Java Core", overallScore: 60 },
    { date: "2026-06-17", company: "swiggy", topic: "System Design", overallScore: 70 },
    { date: "2026-06-17", company: "swiggy", topic: "All", overallScore: 50 },
  ];

  it("averages scores per category from filtered history", () => {
    const scores = computeCategoryScores(history);
    // java: (80 + 60 + 50) / 3 = 63 (two Java sessions + one All session)
    // systemDesign: (70 + 50) / 2 = 60 (one System Design session + one All session)
    expect(scores.java).toBe(63);
    expect(scores.systemDesign).toBe(60);
  });

  it("returns zero for categories with no sessions", () => {
    const minimalHistory: InterviewHistoryEntry[] = [
      { date: "2026-06-15", company: "amazon", topic: "Java Core", overallScore: 80 },
    ];
    const scores = computeCategoryScores(minimalHistory);
    expect(scores.dsa).toBe(0);
    expect(scores.behavioral).toBe(0);
  });

  it("returns all zeros for empty history", () => {
    const scores = computeCategoryScores([]);
    expect(scores.java).toBe(0);
    expect(scores.systemDesign).toBe(0);
    expect(scores.dsa).toBe(0);
    expect(scores.behavioral).toBe(0);
  });

  it("spreads All topic score across all four categories", () => {
    const onlyAll: InterviewHistoryEntry[] = [
      { date: "2026-06-15", company: "google", topic: "All", overallScore: 60 },
    ];
    const scores = computeCategoryScores(onlyAll);
    expect(scores.java).toBe(60);
    expect(scores.systemDesign).toBe(60);
    expect(scores.dsa).toBe(60);
    expect(scores.behavioral).toBe(60);
  });
});

describe("computeOverallReadiness", () => {
  it("computes weighted average using company weights", () => {
    const scores: CategoryScores = { java: 80, systemDesign: 70, dsa: 60, behavioral: 50 };
    // amazon: java 0.20, systemDesign 0.25, dsa 0.20, behavioral 0.35
    // = 80*0.20 + 70*0.25 + 60*0.20 + 50*0.35 = 16+17.5+12+17.5 = 63
    const result = computeOverallReadiness(scores, "amazon");
    expect(result).toBe(63);
  });

  it("uses default weights for unknown company", () => {
    const scores: CategoryScores = { java: 80, systemDesign: 80, dsa: 80, behavioral: 80 };
    expect(computeOverallReadiness(scores, "unknown")).toBe(80);
  });

  it("clamps result to 0-100", () => {
    const scores: CategoryScores = { java: 0, systemDesign: 0, dsa: 0, behavioral: 0 };
    expect(computeOverallReadiness(scores, "google")).toBe(0);
  });
});

describe("getStudyRecommendations", () => {
  it("returns recommendations sorted by highest ROI (weight × gap) first", () => {
    const scores: CategoryScores = { java: 80, systemDesign: 70, dsa: 30, behavioral: 75 };
    const recs = getStudyRecommendations(scores, "swiggy");
    expect(recs[0].category).toBe("dsa");
    expect(recs[0].score).toBe(30);
  });

  it("returns at most 3 recommendations", () => {
    const scores: CategoryScores = { java: 50, systemDesign: 40, dsa: 30, behavioral: 20 };
    const recs = getStudyRecommendations(scores, "amazon");
    expect(recs.length).toBeLessThanOrEqual(3);
  });
});

describe("COMPANY_WEIGHTS", () => {
  it("all company weight sets sum to 1", () => {
    for (const [company, weights] of Object.entries(COMPANY_WEIGHTS)) {
      const sum = weights.java + weights.systemDesign + weights.dsa + weights.behavioral;
      expect(sum).toBeCloseTo(1, 5);
    }
  });
});
