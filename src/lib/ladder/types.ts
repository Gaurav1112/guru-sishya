// ────────────────────────────────────────────────────────────────────────────
// Learning Ladder — domain types (Dreyfus Skill Acquisition Model)
// ────────────────────────────────────────────────────────────────────────────

export interface LadderLevel {
  level: number; // 1–5
  name: string; // Novice, Advanced Beginner, Competent, Proficient, Expert
  dreyfusLabel: string;
  description: string;
  observableSkills: string[];
  milestoneProject: {
    title: string;
    description: string;
    estimatedHours: number;
  };
  commonPlateaus: string[];
  estimatedHours: number;
  prerequisites: string[];
}

export interface GeneratedLadder {
  topic: string;
  levels: LadderLevel[];
}

export type LadderStatus = "loading" | "generating" | "ready" | "error";

// ── Graduation test result stored in Dexie ───────────────────────────────────

export interface GraduationTestResult {
  id?: number;
  topicId: number;
  level: number; // Dreyfus level 1–5
  passed: boolean;
  score: number; // 0–5 (or 0–10 for boss battle)
  totalQuestions: number;
  attemptedAt: Date;
}

// ── Level progress stored in Dexie ───────────────────────────────────────────

export interface LevelProgress {
  id?: number;
  topicId: number;
  unlockedLevel: number; // highest level unlocked (1 = always unlocked)
  masteryBadgeEarned: boolean; // true after passing boss battle
  updatedAt: Date;
}
