import { db } from "@/lib/db";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface WeeklyDigest {
  /** ISO date string of the week start (Monday) */
  weekStart: string;
  /** ISO date string of the week end (Sunday) */
  weekEnd: string;
  /** Topics the user explored this week (names) */
  topicsStudied: string[];
  /** Total quiz questions answered this week */
  questionsAnswered: number;
  /** Average quiz accuracy this week (0-100), null if no quizzes */
  averageAccuracy: number | null;
  /** Accuracy trend compared to previous week: "up" | "down" | "stable" | "new" */
  accuracyTrend: "up" | "down" | "stable" | "new";
  /** Previous week average accuracy for comparison */
  previousWeekAccuracy: number | null;
  /** Current streak length */
  currentStreak: number;
  /** Whether the streak is active (maintained today or yesterday) */
  streakActive: boolean;
  /** Badges earned this week */
  badgesEarned: Array<{ name: string; icon: string; description: string }>;
  /** Topics with < 60% accuracy (weak areas needing review) */
  weakAreas: Array<{ topic: string; accuracy: number; attempts: number }>;
  /** Total XP earned this week */
  xpEarned: number;
  /** Sessions completed this week */
  sessionsCompleted: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Get Monday 00:00 of the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get Sunday 23:59:59 of the week containing the given date. */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

// ────────────────────────────────────────────────────────────────────────────
// Main calculator
// ────────────────────────────────────────────────────────────────────────────

/**
 * Calculates a weekly digest by querying Dexie for the current week's activity.
 * Accepts store state for streak info (stored in Zustand, not Dexie).
 */
export async function calculateWeeklyDigest(storeState: {
  currentStreak: number;
  totalXP: number;
}): Promise<WeeklyDigest> {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setTime(prevWeekEnd.getTime() - 1); // 1ms before this week

  // Parallel Dexie queries
  const [
    allQuizAttempts,
    allTopics,
    allBadges,
    allPlanSessions,
    streakHistory,
    coinTransactions,
  ] = await Promise.all([
    db.quizAttempts.toArray(),
    db.topics.toArray(),
    db.badges.toArray(),
    db.planSessions.toArray(),
    db.streakHistory.toArray(),
    db.coinTransactions.toArray(),
  ]);

  // Build topic ID -> name map
  const topicMap = new Map<number, string>();
  for (const t of allTopics) {
    if (t.id != null) topicMap.set(t.id, t.name);
  }

  // ── This week's quiz attempts ──────────────────────────────────────────
  const thisWeekQuizzes = allQuizAttempts.filter((q) => {
    const d = new Date(q.completedAt);
    return d >= weekStart && d <= weekEnd;
  });

  const questionsAnswered = thisWeekQuizzes.reduce(
    (sum, q) => sum + (q.questions?.length ?? 0),
    0
  );

  const thisWeekScores = thisWeekQuizzes.map((q) => q.score);
  const averageAccuracy =
    thisWeekScores.length > 0
      ? Math.round(
          thisWeekScores.reduce((a, b) => a + b, 0) / thisWeekScores.length
        )
      : null;

  // ── Previous week accuracy (for trend) ─────────────────────────────────
  const prevWeekQuizzes = allQuizAttempts.filter((q) => {
    const d = new Date(q.completedAt);
    return d >= prevWeekStart && d <= prevWeekEnd;
  });

  const prevWeekScores = prevWeekQuizzes.map((q) => q.score);
  const previousWeekAccuracy =
    prevWeekScores.length > 0
      ? Math.round(
          prevWeekScores.reduce((a, b) => a + b, 0) / prevWeekScores.length
        )
      : null;

  let accuracyTrend: WeeklyDigest["accuracyTrend"] = "new";
  if (averageAccuracy !== null && previousWeekAccuracy !== null) {
    const diff = averageAccuracy - previousWeekAccuracy;
    if (diff > 3) accuracyTrend = "up";
    else if (diff < -3) accuracyTrend = "down";
    else accuracyTrend = "stable";
  }

  // ── Topics studied this week ───────────────────────────────────────────
  const topicIds = new Set(thisWeekQuizzes.map((q) => q.topicId));
  // Also include topics from completed plan sessions this week
  const thisWeekSessions = allPlanSessions.filter((ps) => {
    if (!ps.completed || !ps.completedAt) return false;
    const d = new Date(ps.completedAt);
    return d >= weekStart && d <= weekEnd;
  });
  for (const ps of thisWeekSessions) {
    topicIds.add(ps.planId); // planId maps to topicId conceptually
  }
  const topicsStudied = Array.from(topicIds)
    .map((id) => topicMap.get(id))
    .filter((name): name is string => !!name);

  // ── Badges earned this week ────────────────────────────────────────────
  const badgesEarned = allBadges
    .filter((b) => {
      const d = new Date(b.unlockedAt);
      return d >= weekStart && d <= weekEnd;
    })
    .map((b) => ({ name: b.name, icon: b.icon, description: b.description }));

  // ── Weak areas (topics with < 60% average accuracy) ────────────────────
  const topicAccuracy = new Map<
    number,
    { total: number; sum: number; name: string }
  >();
  for (const q of allQuizAttempts) {
    const existing = topicAccuracy.get(q.topicId);
    const name = topicMap.get(q.topicId) ?? `Topic ${q.topicId}`;
    if (existing) {
      existing.total++;
      existing.sum += q.score;
    } else {
      topicAccuracy.set(q.topicId, { total: 1, sum: q.score, name });
    }
  }

  const weakAreas: WeeklyDigest["weakAreas"] = [];
  for (const [, stats] of topicAccuracy) {
    const avg = stats.sum / stats.total;
    if (avg < 60) {
      weakAreas.push({
        topic: stats.name,
        accuracy: Math.round(avg),
        attempts: stats.total,
      });
    }
  }
  weakAreas.sort((a, b) => a.accuracy - b.accuracy); // worst first

  // ── Streak status ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const recentStreak = streakHistory.find(
    (s) => s.date === today || s.date === yesterday
  );
  const streakActive = !!recentStreak?.maintained;

  // ── XP earned this week (from coin transactions as proxy) ──────────────
  const thisWeekCoins = coinTransactions.filter((c) => {
    const d = new Date(c.createdAt);
    return d >= weekStart && d <= weekEnd && c.type === "earn";
  });
  // Use coin earnings as a rough XP proxy (coins are earned alongside XP)
  const xpEarned = thisWeekCoins.reduce((sum, c) => sum + c.amount * 10, 0);

  // ── Sessions completed this week ───────────────────────────────────────
  const sessionsCompleted = thisWeekSessions.length;

  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    topicsStudied,
    questionsAnswered,
    averageAccuracy,
    accuracyTrend,
    previousWeekAccuracy,
    currentStreak: storeState.currentStreak,
    streakActive,
    badgesEarned,
    weakAreas,
    xpEarned,
    sessionsCompleted,
  };
}
