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
  // Extended stats
  sessionsCompleted: number;
  highScoreQuizzes: number;     // quizzes scored >= 80%
  excellentQuizzes: number;     // quizzes scored >= 90%
  dailyChallengesCompleted: number;
  timedTestsCompleted: number;
  quizzesInOneDay: number;      // max quizzes attempted on a single calendar day
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
    description: "Complete your first learning session",
    category: "consistency",
    icon: "🕯️",
    hint: "Mark any plan session as complete",
    check: (stats) => stats.sessionsCompleted >= 1 || stats.totalQuizzes >= 1,
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
    id: "saptah_veer",
    name: "Saptah Veer",
    description: "Reach a 28-day streak",
    category: "consistency",
    icon: "📅",
    hint: "28 consecutive days of practice",
    check: (stats) => stats.longestStreak >= 28,
  },
  {
    id: "dainik_sadhak",
    name: "Dainik Sadhak",
    description: "Complete the daily challenge 5 times",
    category: "consistency",
    icon: "☀️",
    hint: "Answer the Guru's question of the day consistently",
    check: (stats) => stats.dailyChallengesCompleted >= 5,
  },

  // ── Mastery (9) ──────────────────────────────────────────────────────────
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
    description: "Score 80%+ on 5 quizzes",
    category: "mastery",
    icon: "⚔️",
    hint: "Consistently strong quiz performance",
    check: (stats) => stats.highScoreQuizzes >= 5,
  },
  {
    id: "smriti_rakshak",
    name: "Smriti Rakshak",
    description: "Complete 10 quiz rounds",
    category: "mastery",
    icon: "🛡️",
    hint: "Build and maintain your knowledge",
    check: (stats) => stats.totalQuizzes >= 10,
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

  // ── Speed (4) ────────────────────────────────────────────────────────────
  {
    id: "vidyut_gati",
    name: "Vidyut Gati",
    description: "Complete a timed test",
    category: "speed",
    icon: "⚡",
    hint: "Finish a weekly or monthly timed test",
    check: (stats) => stats.timedTestsCompleted >= 1,
  },
  {
    id: "agni_pareeksha",
    name: "Agni Pareeksha",
    description: "Attempt 3 quizzes in a single day",
    category: "speed",
    icon: "🔥",
    hint: "An intense day of practice",
    check: (stats) => stats.quizzesInOneDay >= 3,
  },
  {
    id: "ekagra",
    name: "Ekagra",
    description: "Complete 3 timed tests",
    category: "speed",
    icon: "🎯",
    hint: "Consistent timed practice builds focus",
    check: (stats) => stats.timedTestsCompleted >= 3,
  },
  {
    id: "quiz_samrat",
    name: "Quiz Samrat",
    description: "Complete 50 quizzes",
    category: "speed",
    icon: "🎓",
    hint: "A true quiz champion",
    check: (stats) => stats.totalQuizzes >= 50,
  },

  // ── Exploration (5) ──────────────────────────────────────────────────────
  {
    id: "jigyasu",
    name: "Jigyasu",
    description: "Explore 5 different topics",
    category: "exploration",
    icon: "🔍",
    hint: "Curiosity is the beginning of wisdom",
    check: (stats) => stats.topicsExplored >= 5,
  },
  {
    id: "sangam",
    name: "Sangam",
    description: "Explore 10 different topics",
    category: "exploration",
    icon: "🔗",
    hint: "Connect knowledge across many domains",
    check: (stats) => stats.topicsExplored >= 10,
  },
  {
    id: "nav_dwar",
    name: "Nav Dwar",
    description: "Explore topics in all available categories",
    category: "exploration",
    icon: "🚪",
    hint: "Open every door of knowledge",
    check: (stats) => stats.categoriesExplored >= 9,
  },
  {
    id: "pathik",
    name: "Pathik",
    description: "Complete all sessions in a learning plan",
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
    description: "Complete your very first quiz",
    category: "social",
    icon: "🌱",
    hint: "Every journey starts with one step",
    check: (stats) => stats.totalQuizzes >= 1,
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
    id: "score_90",
    name: "Shreshtha",
    description: "Score 90%+ on 3 quizzes",
    category: "social",
    icon: "🏆",
    hint: "Excellence across multiple quizzes",
    check: (stats) => stats.excellentQuizzes >= 3,
  },
  {
    id: "param_parakrami",
    name: "Param Parakrami",
    description: "Unlock 15 badges",
    category: "social",
    icon: "🦁",
    hint: "A true champion of knowledge",
    check: (stats) => stats.badgeCount >= 15,
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
    planSessions,
    dailyChallenges,
    timedTests,
  ] = await Promise.all([
    db.topics.toArray(),
    db.quizAttempts.toArray(),
    db.cheatSheets.count(),
    db.chatSessions.toArray(),
    db.learningPlans.toArray(),
    db.badges.count(),
    db.planSessions.toArray(),
    db.dailyChallenges.toArray(),
    db.timedTestResults.toArray(),
  ]);

  const topicsExplored = topics.length;
  const categories = new Set(topics.map((t) => t.category));
  const categoriesExplored = categories.size;

  // Score is stored as 0–100 integer in quizAttempts
  const perfectRounds = quizAttempts.filter((q) => q.score >= 100).length;
  const highScoreQuizzes = quizAttempts.filter((q) => q.score >= 80).length;
  const excellentQuizzes = quizAttempts.filter((q) => q.score >= 90).length;
  const totalQuizzes = quizAttempts.length;

  // Count quizzes attempted on a single day (max across all days)
  const quizzesByDay: Record<string, number> = {};
  for (const q of quizAttempts) {
    const day = q.completedAt
      ? new Date(q.completedAt).toISOString().slice(0, 10)
      : "unknown";
    quizzesByDay[day] = (quizzesByDay[day] ?? 0) + 1;
  }
  const quizzesInOneDay = Object.values(quizzesByDay).reduce(
    (max, v) => Math.max(max, v),
    0
  );

  const feynmanSessions = chatSessions.filter((s) => s.technique === "feynman");
  const feynmanMastered = feynmanSessions.filter((s) => s.completed).length;

  // A plan is "completed" if all its sessions are marked complete in planSessions.
  // Fallback: also count plans with status === "completed" for backward compat.
  const plansCompletedByStatus = learningPlans.filter(
    (p) => p.status === "completed"
  ).length;

  // Group planSessions by planId and check if all sessions for each plan are done
  const sessionsByPlan: Record<number, { total: number; done: number }> = {};
  for (const ps of planSessions) {
    if (!sessionsByPlan[ps.planId]) {
      sessionsByPlan[ps.planId] = { total: 0, done: 0 };
    }
    sessionsByPlan[ps.planId].total++;
    if (ps.completed) sessionsByPlan[ps.planId].done++;
  }
  const plansCompletedBySessions = Object.values(sessionsByPlan).filter(
    (g) => g.total > 0 && g.total === g.done
  ).length;

  const plansCompleted = Math.max(plansCompletedByStatus, plansCompletedBySessions);

  // Sessions completed across all plans
  const sessionsCompleted = planSessions.filter((ps) => ps.completed).length;

  // Daily challenges answered correctly or attempted
  const dailyChallengesCompleted = dailyChallenges.filter(
    (c) => c.answered
  ).length;

  // Timed tests completed (weekly + monthly)
  const timedTestsCompleted = timedTests.length;

  // Decayed topics reviewed — use totalQuizzes as a reasonable proxy
  const decayedTopicsReviewed = totalQuizzes;

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
    sessionsCompleted,
    highScoreQuizzes,
    excellentQuizzes,
    dailyChallengesCompleted,
    timedTestsCompleted,
    quizzesInOneDay,
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
      try {
        await db.badges.add({
          type: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          unlockedAt: new Date(),
        });
        newlyUnlocked.push(badge);
      } catch {
        try {
          await db.badges.add({
            type: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            unlockedAt: new Date(),
          });
          newlyUnlocked.push(badge);
        } catch {
          // Silently skip — will retry next check
        }
      }
    }
  }

  return newlyUnlocked;
}
