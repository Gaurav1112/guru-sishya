export type ReadinessCategory = "java" | "systemDesign" | "dsa" | "behavioral";

export interface CategoryScores {
  java: number;
  systemDesign: number;
  dsa: number;
  behavioral: number;
}

export interface CategoryWeights {
  java: number;
  systemDesign: number;
  dsa: number;
  behavioral: number;
}

export interface InterviewHistoryEntry {
  date: string;
  company: string;
  topic: string;
  overallScore: number;
}

export interface StudyRecommendation {
  category: ReadinessCategory;
  label: string;
  score: number;
  href: string;
}

export const COMPANY_WEIGHTS: Record<string, CategoryWeights> = {
  amazon:   { java: 0.20, systemDesign: 0.25, dsa: 0.20, behavioral: 0.35 },
  google:   { java: 0.15, systemDesign: 0.25, dsa: 0.40, behavioral: 0.20 },
  flipkart: { java: 0.30, systemDesign: 0.30, dsa: 0.25, behavioral: 0.15 },
  swiggy:   { java: 0.30, systemDesign: 0.30, dsa: 0.25, behavioral: 0.15 },
  uber:     { java: 0.25, systemDesign: 0.35, dsa: 0.25, behavioral: 0.15 },
  microsoft: { java: 0.25, systemDesign: 0.25, dsa: 0.35, behavioral: 0.15 },
  default:  { java: 0.25, systemDesign: 0.25, dsa: 0.25, behavioral: 0.25 },
};

const CATEGORY_LABELS: Record<ReadinessCategory, string> = {
  java: "Java / Spring",
  systemDesign: "System Design",
  dsa: "DSA",
  behavioral: "Behavioral",
};

const CATEGORY_HREFS: Record<ReadinessCategory, string> = {
  java: "/app/interview?topic=Java+Core",
  systemDesign: "/app/interview?topic=System+Design",
  dsa: "/app/interview?topic=DSA",
  behavioral: "/app/interview?topic=Behavioral",
};

export function mapTopicToCategory(topic: string): ReadinessCategory | null {
  const t = topic.toLowerCase();
  if (
    t.includes("java") || t.includes("spring") || t.includes("jvm") ||
    t.includes("concurrency") || t.includes("hibernate") || t.includes("jdbc")
  ) return "java";
  if (
    t.includes("system design") || t.includes("lld") || t.includes("hld") ||
    t.includes("architecture") || t.includes("kafka") || t.includes("redis") ||
    t.includes("database") || t.includes("distributed")
  ) return "systemDesign";
  if (
    t.includes("dsa") || t.includes("algorithm") || t.includes("data structure") ||
    t.includes("graph") || t.includes("tree") || t.includes("dynamic programming") ||
    t.includes("dp") || t.includes("array") || t.includes("string") ||
    t.includes("sorting") || t.includes("greedy")
  ) return "dsa";
  if (
    t.includes("behavioral") || t.includes("star") || t.includes("leadership") ||
    t.includes("soft skill") || t.includes("situational")
  ) return "behavioral";
  return null;
}

export function computeCategoryScores(history: InterviewHistoryEntry[]): CategoryScores {
  const sums: Record<ReadinessCategory, number> = { java: 0, systemDesign: 0, dsa: 0, behavioral: 0 };
  const counts: Record<ReadinessCategory, number> = { java: 0, systemDesign: 0, dsa: 0, behavioral: 0 };

  for (const entry of history) {
    const cat = mapTopicToCategory(entry.topic);
    if (cat) {
      sums[cat] += entry.overallScore;
      counts[cat]++;
    } else {
      // "All" or unmapped — spread equally across all categories
      for (const c of ["java", "systemDesign", "dsa", "behavioral"] as ReadinessCategory[]) {
        sums[c] += entry.overallScore;
        counts[c]++;
      }
    }
  }

  return {
    java: counts.java > 0 ? Math.round(sums.java / counts.java) : 0,
    systemDesign: counts.systemDesign > 0 ? Math.round(sums.systemDesign / counts.systemDesign) : 0,
    dsa: counts.dsa > 0 ? Math.round(sums.dsa / counts.dsa) : 0,
    behavioral: counts.behavioral > 0 ? Math.round(sums.behavioral / counts.behavioral) : 0,
  };
}

export function computeOverallReadiness(scores: CategoryScores, company: string): number {
  const weights = COMPANY_WEIGHTS[company.toLowerCase()] ?? COMPANY_WEIGHTS.default;
  const raw =
    scores.java * weights.java +
    scores.systemDesign * weights.systemDesign +
    scores.dsa * weights.dsa +
    scores.behavioral * weights.behavioral;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

export function getReadinessLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "STRONG", color: "text-green-400" };
  if (score >= 60) return { label: "GOOD", color: "text-yellow-400" };
  if (score >= 40) return { label: "BUILDING", color: "text-orange-400" };
  return { label: "EARLY", color: "text-red-400" };
}

export function getStudyRecommendations(
  scores: CategoryScores,
  company: string
): StudyRecommendation[] {
  const weights = COMPANY_WEIGHTS[company.toLowerCase()] ?? COMPANY_WEIGHTS.default;
  const categories: ReadinessCategory[] = ["java", "systemDesign", "dsa", "behavioral"];

  return categories
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      score: scores[cat],
      href: CATEGORY_HREFS[cat],
      priority: weights[cat] * (100 - scores[cat]),
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map(({ category, label, score, href }) => ({ category, label, score, href }));
}

export function loadInterviewHistory(): InterviewHistoryEntry[] {
  try {
    const raw = localStorage.getItem("gs-interview-history");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<{
      date?: string;
      company?: string;
      topic?: string;
      overallScore?: number;
    }>;
    return parsed
      .filter((e) => typeof e.overallScore === "number" && typeof e.topic === "string")
      .map((e) => ({
        date: e.date ?? "",
        company: e.company ?? "",
        topic: e.topic ?? "All",
        overallScore: e.overallScore as number,
      }));
  } catch {
    return [];
  }
}
