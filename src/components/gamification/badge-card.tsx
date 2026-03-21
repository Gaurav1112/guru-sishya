"use client";
import type { BadgeDefinition, UserStats } from "@/lib/gamification/badges";

interface BadgeCardProps {
  badge: BadgeDefinition;
  unlocked: boolean;
  unlockedAt?: Date;
  userStats?: UserStats;
}

// ────────────────────────────────────────────────────────────────────────────
// Progress inference
// Maps badge ids to their stat field and threshold so we can show a progress bar
// ────────────────────────────────────────────────────────────────────────────

interface ProgressInfo {
  current: number;
  target: number;
  label: string;
}

function getBadgeProgress(badge: BadgeDefinition, stats: UserStats): ProgressInfo | null {
  switch (badge.id) {
    // Streak-based
    case "nityam":
      return { current: stats.longestStreak, target: 7, label: "day streak" };
    case "tapasvi":
      return { current: stats.longestStreak, target: 30, label: "day streak" };
    case "saptah_veer":
      return { current: stats.longestStreak, target: 28, label: "day streak" };
    case "vajra_sankalp":
      return { current: stats.longestStreak, target: 100, label: "day streak" };
    case "akhand_sadhana":
      return { current: stats.longestStreak, target: 365, label: "day streak" };

    // Perfect rounds
    case "shuddh_gyan":
      return { current: stats.perfectRounds, target: 1, label: "perfect rounds" };
    case "pancha_siddhi":
      return { current: stats.perfectRounds, target: 5, label: "perfect rounds" };

    // Topics explored
    case "jigyasu":
      return { current: stats.topicsExplored, target: 10, label: "topics explored" };
    case "prathama_jyoti":
      return { current: Math.max(stats.totalQuizzes, stats.topicsExplored), target: 1, label: "sessions" };

    // Categories
    case "vishwa_vidya":
      return { current: stats.categoriesExplored, target: 5, label: "categories" };
    case "nav_dwar":
      return { current: stats.categoriesExplored, target: 9, label: "categories" };

    // Cheat sheets
    case "sutra_dhara":
      return { current: stats.cheatSheetsGenerated, target: 5, label: "cheat sheets" };
    case "sutra_lekhak":
      return { current: stats.cheatSheetsGenerated, target: 10, label: "cheat sheets" };

    // Feynman sessions
    case "feynman_apprentice":
      return { current: stats.feynmanMastered, target: 5, label: "Feynman sessions" };
    case "guru_vakta":
      return { current: stats.feynmanMastered, target: 20, label: "Feynman sessions" };

    // Plans
    case "pathik":
      return { current: stats.plansCompleted, target: 1, label: "plans completed" };
    case "pareto_master":
      return { current: stats.plansCompleted, target: 3, label: "plans completed" };

    // Level
    case "vidya_dhan":
      return { current: stats.level, target: 5, label: "level" };
    case "maha_vidya":
      return { current: stats.level, target: 10, label: "level" };

    // Quizzes
    case "quiz_samrat":
      return { current: stats.totalQuizzes, target: 50, label: "quizzes" };

    // Decayed topics reviewed
    case "smriti_rakshak":
      return { current: stats.decayedTopicsReviewed, target: 10, label: "reviews" };

    // Badges
    case "param_parakrami":
      return { current: stats.badgeCount, target: 25, label: "badges" };

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

export function BadgeCard({ badge, unlocked, unlockedAt, userStats }: BadgeCardProps) {
  if (unlocked) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/30 bg-surface p-4 shadow-[0_0_12px_rgba(234,179,8,0.12)] transition-shadow hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]">
        <span className="text-3xl">{badge.icon}</span>
        <div className="text-center">
          <p className="font-heading text-sm font-bold text-gold leading-tight">{badge.name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
          {unlockedAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {unlockedAt.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  const progress = userStats ? getBadgeProgress(badge, userStats) : null;
  const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : null;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-surface/50 p-4 opacity-60">
      <span className="text-3xl grayscale">{badge.icon}</span>
      <div className="text-center w-full">
        <p className="font-heading text-sm font-bold text-muted-foreground leading-tight">???</p>
        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 italic">{badge.hint}</p>

        {progress && pct !== null && (
          <div className="mt-2 w-full">
            <div className="flex justify-between text-[10px] text-muted-foreground/60 mb-1">
              <span>{progress.current}/{progress.target} {progress.label}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold/50 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
