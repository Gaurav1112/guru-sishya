import { db } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  topicsExplored: number;
  perfectRounds: number;
  cheatSheetsGenerated: number;
  feynmanMastered: number;
  plansCompleted: number;
  decayedTopicsReviewed: number;
  categoriesExplored: number;
  totalQuizzes: number;
  badgeCount: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: "consistency" | "mastery" | "speed" | "exploration" | "social";
  icon: string;
  hint: string;
  check: (stats: UserStats) => boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Badge definitions (30 total)
// ────────────────────────────────────────────────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Consistency (7) ──────────────────────────────────────────────────────
  {
    id: "prathama_jyoti",
    name: "Prathama Jyoti",
    description: "Complete your first lesson",
    category: "consistency",
    icon: "🕯️",
    hint: "Start your first learning session",
    check: (stats) => stats.totalQuizzes >= 1 || stats.topicsExplored >= 1,
  },
  {
    id: "nityam",
    name: "Nityam",
    description: "Maintain a 7-day streak",
    category: "consistency",
    icon: "🔥",
    hint: "Keep learning for 7 days in a row",
    check: (stats) => stats.longestStreak >= 7,
  },
  {
    id: "tapasvi",
    name: "Tapasvi",
    description: "Maintain a 30-day streak",
    category: "consistency",
    icon: "🧘",
    hint: "Keep your streak alive for 30 days",
    check: (stats) => stats.longestStreak >= 30,
  },
  {
    id: "vajra_sankalp",
    name: "Vajra Sankalp",
    description: "Maintain a 100-day streak",
    category: "consistency",
    icon: "⚡",
    hint: "100 days of unbroken discipline",
    check: (stats) => stats.longestStreak >= 100,
  },
  {
    id: "akhand_sadhana",
    name: "Akhand Sadhana",
    description: "Maintain a 365-day streak",
    category: "consistency",
    icon: "♾️",
    hint: "A full year of daily practice",
    check: (stats) => stats.longestStreak >= 365,
  },
  {
    id: "brahma_muhurta",
    name: "Brahma Muhurta",
    description: "Complete a session before 6 AM",
    category: "consistency",
    icon: "🌅",
    hint: "Study in the sacred pre-dawn hours",
    // Tracked externally — unlocked when a session is completed before 6 AM
    check: () => false,
  },
  {
    id: "saptah_veer",
    name: "Saptah Veer",
    description: "Complete all 7 days of the week for 4 consecutive weeks",
    category: "consistency",
    icon: "📅",
    hint: "28 days of perfect weekly practice",
    check: (stats) => stats.longestStreak >= 28,
  },

  // ── Mastery (7) ──────────────────────────────────────────────────────────
  {
    id: "shuddh_gyan",
    name: "Shuddh Gyan",
    description: "Score 100% on a quiz round",
    category: "mastery",
    icon: "🎯",
    hint: "Achieve a perfect quiz score",
    check: (stats) => stats.perfectRounds >= 1,
  },
  {
    id: "pancha_siddhi",
    name: "Pancha Siddhi",
    description: "Score 100% on 5 quiz rounds",
    category: "mastery",
    icon: "⭐",
    hint: "5 perfect quiz rounds",
    check: (stats) => stats.perfectRounds >= 5,
  },
  {
    id: "dwandva_vijay",
    name: "Dwandva Vijay",
    description: "Answer 10 quiz questions correctly in a row",
    category: "mastery",
    icon: "⚔️",
    hint: "10 correct answers without a mistake",
    // Tracked externally per quiz session
    check: () => false,
  },
  {
    id: "smriti_rakshak",
    name: "Smriti Rakshak",
    description: "Review 10 topics before they decay",
    category: "mastery",
    icon: "🛡️",
    hint: "Keep your knowledge fresh",
    check: (stats) => stats.decayedTopicsReviewed >= 10,
  },
  {
    id: "vishwa_vidya",
    name: "Vishwa Vidya",
    description: "Explore topics in 5 different categories",
    category: "mastery",
    icon: "🌐",
    hint: "Broaden your knowledge across domains",
    check: (stats) => stats.categoriesExplored >= 5,
  },
  {
    id: "sutra_dhara",
    name: "Sutra Dhara",
    description: "Generate cheat sheets for 5 topics",
    category: "mastery",
    icon: "📜",
    hint: "Distill knowledge into concise summaries",
    check: (stats) => stats.cheatSheetsGenerated >= 5,
  },
  {
    id: "sutra_lekhak",
    name: "Sutra Lekhak",
    description: "Generate 10 cheat sheets",
    category: "mastery",
    icon: "✍️",
    hint: "Master the art of concise notes",
    check: (stats) => stats.cheatSheetsGenerated >= 10,
  },

  // ── Speed (3) ────────────────────────────────────────────────────────────
  {
    id: "vidyut_gati",
    name: "Vidyut Gati",
    description: "Complete a quiz in under 2 minutes",
    category: "speed",
    icon: "⚡",
    hint: "Lightning-fast knowledge recall",
    // Tracked externally with quiz timing
    check: () => false,
  },
  {
    id: "agni_pareeksha",
    name: "Agni Pareeksha",
    description: "Complete 5 quizzes in a single day",
    category: "speed",
    icon: "🔥",
    hint: "An intense day of practice",
    // Tracked externally per day
    check: () => false,
  },
  {
    id: "ekagra",
    name: "Ekagra",
    description: "Complete a Feynman session without pausing",
    category: "speed",
    icon: "🎯",
    hint: "Undivided focus and flow",
    // Tracked externally
    check: () => false,
  },

  // ── Exploration (5) ──────────────────────────────────────────────────────
  {
    id: "jigyasu",
    name: "Jigyasu",
    description: "Explore 10 different topics",
    category: "exploration",
    icon: "🔍",
    hint: "Curiosity is the beginning of wisdom",
    check: (stats) => stats.topicsExplored >= 10,
  },
  {
    id: "sangam",
    name: "Sangam",
    description: "Connect concepts across 3 different topics",
    category: "exploration",
    icon: "🔗",
    hint: "Find the threads that unite knowledge",
    // Tracked externally
    check: () => false,
  },
  {
    id: "nav_dwar",
    name: "Nav Dwar",
    description: "Explore topics in all 9 categories",
    category: "exploration",
    icon: "🚪",
    hint: "Open every door of knowledge",
    check: (stats) => stats.categoriesExplored >= 9,
  },
  {
    id: "pathik",
    name: "Pathik",
    description: "Complete a full learning plan",
    category: "exploration",
    icon: "🗺️",
    hint: "Follow the path to completion",
    check: (stats) => stats.plansCompleted >= 1,
  },
  {
    id: "feynman_apprentice",
    name: "Feynman Apprentice",
    description: "Complete 5 Feynman technique sessions",
    category: "exploration",
    icon: "🧑‍🏫",
    hint: "Teach to truly understand",
    check: (stats) => stats.feynmanMastered >= 5,
  },

  // ── Social (5) ───────────────────────────────────────────────────────────
  {
    id: "pratham",
    name: "Pratham",
    description: "Join in the early days of Guru Sishya",
    category: "social",
    icon: "🌱",
    hint: "An early adopter and pioneer",
    // Unlocked manually for early users
    check: () => false,
  },
  {
    id: "pareto_master",
    name: "Pareto Master",
    description: "Complete 3 full learning plans",
    category: "social",
    icon: "📊",
    hint: "Master the 80/20 principle across domains",
    check: (stats) => stats.plansCompleted >= 3,
  },
  {
    id: "guru_vakta",
    name: "Guru Vakta",
    description: "Complete 20 Feynman technique sessions",
    category: "social",
    icon: "🎙️",
    hint: "Teach 20 concepts with mastery",
    check: (stats) => stats.feynmanMastered >= 20,
  },
  {
    id: "leaderboard_vijeta",
    name: "Leaderboard Vijeta",
    description: "Reach the top 3 on the leaderboard",
    category: "social",
    icon: "🏆",
    hint: "Rise to the summit",
    // Tracked externally via leaderboard
    check: () => false,
  },
  {
    id: "param_parakrami",
    name: "Param Parakrami",
    description: "Unlock 25 badges",
    category: "social",
    icon: "🦁",
    hint: "A true champion of knowledge",
    check: (stats) => stats.badgeCount >= 25,
  },

  // ── Additional to reach 30 ───────────────────────────────────────────────
  {
    id: "vidya_dhan",
    name: "Vidya Dhan",
    description: "Reach level 5",
    category: "mastery",
    icon: "💎",
    hint: "Knowledge is the greatest wealth",
    check: (stats) => stats.level >= 5,
  },
  {
    id: "maha_vidya",
    name: "Maha Vidya",
    description: "Reach level 10",
    category: "mastery",
    icon: "👑",
    hint: "The path to greatness",
    check: (stats) => stats.level >= 10,
  },
  {
    id: "quiz_samrat",
    name: "Quiz Samrat",
    description: "Complete 50 quizzes",
    category: "mastery",
    icon: "🎓",
    hint: "A true quiz champion",
    check: (stats) => stats.totalQuizzes >= 50,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// getUserStats
// ────────────────────────────────────────────────────────────────────────────

/**
 * Queries Dexie to build a UserStats object reflecting the current user state.
 */
export async function getUserStats(storeState: {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
}): Promise<UserStats> {
  const [
    topics,
    quizAttempts,
    cheatSheets,
    chatSessions,
    learningPlans,
    badges,
  ] = await Promise.all([
    db.topics.toArray(),
    db.quizAttempts.toArray(),
    db.cheatSheets.count(),
    db.chatSessions.toArray(),
    db.learningPlans.toArray(),
    db.badges.count(),
  ]);

  const topicsExplored = topics.length;
  const categories = new Set(topics.map((t) => t.category));
  const categoriesExplored = categories.size;

  const perfectRounds = quizAttempts.filter((q) => q.score >= 100).length;
  const totalQuizzes = quizAttempts.length;

  const feynmanSessions = chatSessions.filter((s) => s.technique === "feynman");
  const feynmanMastered = feynmanSessions.filter((s) => s.completed).length;

  const plansCompleted = learningPlans.filter((p) => p.status === "completed").length;

  // Decayed topics reviewed — approximate: quiz attempts on topics older than their last review
  // For now use a count of quiz attempts on topics that exist in the DB as a proxy
  const decayedTopicsReviewed = quizAttempts.length; // approximate until spaced-rep tracking

  return {
    currentStreak: storeState.currentStreak,
    longestStreak: storeState.longestStreak,
    totalXP: storeState.totalXP,
    level: storeState.level,
    topicsExplored,
    perfectRounds,
    cheatSheetsGenerated: cheatSheets,
    feynmanMastered,
    plansCompleted,
    decayedTopicsReviewed,
    categoriesExplored,
    totalQuizzes,
    badgeCount: badges,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// checkAndUnlockBadges
// ────────────────────────────────────────────────────────────────────────────

/**
 * Checks all badge definitions against current stats,
 * unlocks new ones in Dexie, and returns the newly unlocked badges.
 */
export async function checkAndUnlockBadges(stats: UserStats): Promise<BadgeDefinition[]> {
  // Get already-unlocked badge IDs from Dexie
  const existingBadges = await db.badges.toArray();
  const unlockedIds = new Set(existingBadges.map((b) => b.type));

  const newlyUnlocked: BadgeDefinition[] = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (unlockedIds.has(badge.id)) continue; // already unlocked
    if (badge.check(stats)) {
      await db.badges.add({
        type: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlockedAt: new Date(),
      });
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
}
