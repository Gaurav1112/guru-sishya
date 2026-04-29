// ────────────────────────────────────────────────────────────────────────────
// XP level system with logarithmic scaling (SM-inspired)
// ────────────────────────────────────────────────────────────────────────────

const MAX_LEVEL = 20;

/**
 * XP required to complete a specific level (i.e. move from level N to N+1).
 * Formula: round(100 * (1.22 ^ (level - 1)) / 10) * 10
 */
export function xpForLevel(level: number): number {
  return Math.round((100 * Math.pow(1.22, level - 1)) / 10) * 10;
}

/**
 * Total cumulative XP needed to REACH a given level (sum of all prior levels).
 * cumulativeXPForLevel(1) === 0 — you start at level 1 with 0 XP.
 */
export function cumulativeXPForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += xpForLevel(l);
  }
  return total;
}

/**
 * Derive the current level from a total XP value.
 * Level is capped at MAX_LEVEL (20).
 */
export function levelFromXP(totalXP: number): number {
  let level = 1;
  while (level < MAX_LEVEL) {
    const threshold = cumulativeXPForLevel(level + 1);
    if (totalXP < threshold) break;
    level++;
  }
  return level;
}

export interface XPProgress {
  /** XP earned within the current level */
  current: number;
  /** XP needed to complete the current level */
  needed: number;
  /** Percentage complete [0–100] */
  percentage: number;
}

/**
 * Returns progress within the current level.
 */
export function xpProgressInLevel(totalXP: number): XPProgress {
  const level = levelFromXP(totalXP);
  if (level >= MAX_LEVEL) {
    const needed = xpForLevel(MAX_LEVEL);
    return { current: needed, needed, percentage: 100 };
  }
  const levelStart = cumulativeXPForLevel(level);
  const needed = xpForLevel(level);
  const current = totalXP - levelStart;
  const percentage = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percentage };
}

// ────────────────────────────────────────────────────────────────────────────
// Tier system
// ────────────────────────────────────────────────────────────────────────────

export interface LevelInfo {
  tier: string;
  tierDescription: string;
  subLevel: "I" | "II" | "III";
  title: string;
}

const TIERS: Array<{
  name: string;
  description: string;
  levels: number[];
  subLevels: Array<"I" | "II" | "III">;
}> = [
  {
    name: "Beginner",
    description: "Student",
    levels: [1, 2, 3],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Apprentice",
    description: "Learner",
    levels: [4, 5, 6],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Scholar",
    description: "Intermediate",
    levels: [7, 8, 9],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Expert",
    description: "Advanced",
    levels: [10, 11, 12],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Master",
    description: "Proficient",
    levels: [13, 14, 15],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Legend",
    description: "Elite",
    levels: [16, 17, 18],
    subLevels: ["I", "II", "III"],
  },
  {
    name: "Grandmaster",
    description: "Pinnacle",
    levels: [19, 20],
    subLevels: ["I", "II"],
  },
];

/**
 * Returns tier name, sub-level, and full title for a given level (1–20).
 */
export function getLevelInfo(level: number): LevelInfo {
  const clampedLevel = Math.max(1, Math.min(MAX_LEVEL, level));

  for (const tier of TIERS) {
    const idx = tier.levels.indexOf(clampedLevel);
    if (idx !== -1) {
      const subLevel = tier.subLevels[idx];
      return {
        tier: tier.name,
        tierDescription: tier.description,
        subLevel,
        title: `${tier.name} ${subLevel} (${tier.description})`,
      };
    }
  }

  // Fallback — should never happen with valid input
  return {
    tier: "Beginner",
    tierDescription: "Student",
    subLevel: "I",
    title: "Beginner I (Student)",
  };
}
