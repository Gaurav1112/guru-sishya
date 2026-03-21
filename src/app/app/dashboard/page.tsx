"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { TopicInput } from "@/components/topic-input";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { DailyChallengeWidget } from "@/components/gamification/daily-challenge";
import { useStreak } from "@/hooks/use-streak";
import { checkComeback, getComebackMessage } from "@/lib/gamification/comeback";

const SUGGESTED_TOPICS = ["System Design", "Machine Learning", "Guitar", "Data Structures"];

// ────────────────────────────────────────────────────────────────────────────
// Comeback banner — shown if user has been away 3+ days
// ────────────────────────────────────────────────────────────────────────────

function ComebackBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const lastActivity = localStorage.getItem("lastStreakDate") ?? "";
    const today = new Date().toISOString().slice(0, 10);
    const { eligible, daysAway } = checkComeback(lastActivity, today);
    if (eligible) {
      setMessage(getComebackMessage(daysAway));
    }
  }, []);

  if (!message) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
      <span className="text-xl">🙏</span>
      <div>
        <p className="text-sm font-semibold text-gold">Welcome Back!</p>
        <p className="text-sm text-foreground/80 mt-0.5">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete 3 sessions in 3 days to earn a special comeback badge.
        </p>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Daily Goal Progress Bar
// ────────────────────────────────────────────────────────────────────────────

function DailyGoalBar() {
  const { dailyGoal, dailyXP, dailyXPDate, queueCelebration } = useStore();
  const goalXP = dailyGoal * 5; // 1 min target ≈ 5 XP
  const today = new Date().toISOString().slice(0, 10);
  const todayXP = dailyXPDate === today ? dailyXP : 0;
  const pct = Math.min(100, goalXP > 0 ? Math.round((todayXP / goalXP) * 100) : 0);
  const goalMet = todayXP >= goalXP && goalXP > 0;

  const [celebrated, setCelebrated] = useState(false);
  useEffect(() => {
    if (goalMet && !celebrated) {
      setCelebrated(true);
      queueCelebration({ type: "perfect_round", data: {} });
    }
  }, [goalMet, celebrated, queueCelebration]);

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Daily Goal</p>
        <div className="flex items-center gap-1.5">
          {goalMet && <span className="text-green-400 text-sm">✓</span>}
          <span className="text-xs font-semibold tabular-nums">
            {todayXP} / {goalXP} XP
          </span>
        </div>
      </div>
      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            goalMet ? "bg-green-400" : "bg-gold"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        {goalMet
          ? "Daily goal achieved! Keep going."
          : `${goalXP - todayXP} XP to reach today's goal (${dailyGoal} min target)`}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Today's streak status indicator
// ────────────────────────────────────────────────────────────────────────────

function StreakStatusIndicator() {
  const lastDate = typeof window !== "undefined"
    ? localStorage.getItem("lastStreakDate") ?? ""
    : "";
  const today = new Date().toISOString().slice(0, 10);
  const donToday = lastDate === today;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        donToday
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-orange-500/30 bg-orange-500/10 text-orange-400"
      }`}
    >
      <span>{donToday ? "✅" : "⏳"}</span>
      <span>{donToday ? "Today's streak recorded" : "Start learning to maintain your streak"}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Gamification widgets shown when user has topics
// ────────────────────────────────────────────────────────────────────────────

function GamificationWidgets() {
  const { totalXP, level, currentStreak } = useStore();
  const quizAttempts = useLiveQuery(
    () => db.quizAttempts.toArray(),
    []
  );

  // Count today's quiz attempts
  const todayStr = new Date().toISOString().slice(0, 10);
  const questionsToday = (quizAttempts ?? []).filter(
    (q) => q.completedAt.toISOString?.().slice(0, 10) === todayStr ||
           new Date(q.completedAt).toISOString().slice(0, 10) === todayStr
  ).reduce((acc, q) => acc + (q.questions?.length ?? 0), 0);

  const topicCount = useLiveQuery(() => db.topics.count(), []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Streak widget */}
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Sadhana Streak
        </p>
        <StreakFlame streak={currentStreak} size="md" />
        <p className="text-xs text-muted-foreground mt-2">days in a row</p>
      </div>

      {/* XP progress */}
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          XP Progress
        </p>
        <XPBar totalXP={totalXP} level={level} />
      </div>

      {/* Quick stats */}
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Today
        </p>
        <div className="flex gap-6">
          <div>
            <p className="font-heading text-2xl font-bold">{questionsToday}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold">{topicCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Topics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard Page
// ────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Run streak check on mount
  useStreak();

  const topicCount = useLiveQuery(() => db.topics.count());
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);

  if (!apiKey && aiProvider !== "ollama") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="font-heading text-2xl font-bold">Welcome to Guru Sishya</h2>
        <p className="text-muted-foreground">
          Set your API key in{" "}
          <a href="/app/settings" className="text-saffron underline">
            Settings
          </a>{" "}
          to get started, or select Ollama for a free, local AI.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {SUGGESTED_TOPICS.map((t) => (
            <span key={t} className="rounded-full border border-border/60 bg-surface px-3 py-1 text-sm text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (!topicCount || topicCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <h2 className="font-heading text-2xl font-bold">What do you want to learn today?</h2>
        <p className="text-muted-foreground">
          Enter any topic and Guru Sishya will create your personalized learning journey.
        </p>
        <TopicInput />
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={async () => {
                const id = await db.topics.add({ name: t, category: "General", createdAt: new Date() });
                window.location.href = `/app/topic/${id}`;
              }}
              className="rounded-full border border-saffron/30 bg-saffron/10 px-3 py-1 text-sm text-saffron hover:bg-saffron/20 transition-colors cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      </div>

      <ComebackBanner />

      {/* Daily Challenge — most prominent, shown first */}
      <DailyChallengeWidget />

      <StreakStatusIndicator />
      <GamificationWidgets />

      {/* Daily Goal Progress */}
      <DailyGoalBar />

      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">Add a Topic</h2>
        <TopicInput />
        <p className="mt-4 text-sm text-muted-foreground">
          You have {topicCount} topic{topicCount !== 1 ? "s" : ""}. Select one from the sidebar.
        </p>
      </div>
    </div>
  );
}
