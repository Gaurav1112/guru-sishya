"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeDefinition, UserStats } from "@/lib/gamification/badges";
import { ShareButton } from "@/components/share-button";

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

    // First session
    case "prathama_jyoti":
      return { current: Math.max(stats.sessionsCompleted, stats.totalQuizzes), target: 1, label: "sessions" };

    // Perfect rounds
    case "shuddh_gyan":
      return { current: stats.perfectRounds, target: 1, label: "perfect rounds" };
    case "pancha_siddhi":
      return { current: stats.perfectRounds, target: 5, label: "perfect rounds" };

    // High score quizzes
    case "dwandva_vijay":
      return { current: stats.highScoreQuizzes, target: 5, label: "quizzes 80%+" };
    case "score_90":
      return { current: stats.excellentQuizzes, target: 3, label: "quizzes 90%+" };

    // Topics explored
    case "jigyasu":
      return { current: stats.topicsExplored, target: 5, label: "topics explored" };
    case "sangam":
      return { current: stats.topicsExplored, target: 10, label: "topics explored" };

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
    case "pratham":
      return { current: stats.totalQuizzes, target: 1, label: "quizzes" };
    case "smriti_rakshak":
      return { current: stats.totalQuizzes, target: 10, label: "quizzes" };
    case "quiz_samrat":
      return { current: stats.totalQuizzes, target: 50, label: "quizzes" };

    // Daily challenges
    case "dainik_sadhak":
      return { current: stats.dailyChallengesCompleted, target: 5, label: "daily challenges" };

    // Timed tests
    case "vidyut_gati":
      return { current: stats.timedTestsCompleted, target: 1, label: "timed tests" };
    case "ekagra":
      return { current: stats.timedTestsCompleted, target: 3, label: "timed tests" };

    // Speed — quizzes in one day
    case "agni_pareeksha":
      return { current: stats.quizzesInOneDay, target: 3, label: "quizzes in a day" };

    // Badges
    case "param_parakrami":
      return { current: stats.badgeCount, target: 15, label: "badges" };

    // Interview badges
    case "interview_first":
      return { current: stats.interviewsCompleted, target: 1, label: "interviews" };
    case "interview_ace":
      return { current: stats.interviewHighScore, target: 80, label: "% high score" };
    case "interview_veteran":
      return { current: stats.interviewsCompleted, target: 10, label: "interviews" };

    default:
      return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────────────────────────────────

export function BadgeCard({ badge, unlocked, unlockedAt, userStats }: BadgeCardProps) {
  const progress = userStats ? getBadgeProgress(badge, userStats) : null;
  const pct = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200",
        unlocked
          ? "border-saffron/50 bg-saffron/10 shadow-md shadow-saffron/10 scale-[1.02] hover:shadow-lg hover:shadow-saffron/20"
          : "border-border/20 bg-muted/5 opacity-50"
      )}
    >
      <span className={cn("text-3xl", !unlocked && "grayscale opacity-40")}>
        {badge.icon}
      </span>
      <div className="text-center w-full">
        <p
          className={cn(
            "font-heading text-sm font-bold leading-tight",
            unlocked ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {badge.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{badge.description}</p>

        {unlocked ? (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-teal-400">
              <Check className="size-3" />
              Earned!
            </span>
            <ShareButton
              type="badge"
              name={badge.name}
              size="icon"
              iconOnly
              className="size-5 [&_button]:size-5 [&_button]:p-0 [&_svg]:size-2.5"
            />
          </div>
        ) : (
          <div className="mt-2 w-full">
            {progress && pct !== null ? (
              <>
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-saffron/50 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground/60 mt-0.5">
                  <span>{progress.current}/{progress.target} {progress.label}</span>
                  <span>{pct}%</span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {unlocked && unlockedAt && (
          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
            {unlockedAt.toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
