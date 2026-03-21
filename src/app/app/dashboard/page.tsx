"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { TopicInput } from "@/components/topic-input";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { useStreak } from "@/hooks/use-streak";

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

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <h2 className="font-heading text-2xl font-bold">Welcome to Guru Sishya</h2>
        <p className="text-muted-foreground">
          Add your Claude API key in{" "}
          <a href="/app/settings" className="text-saffron underline">
            Settings
          </a>{" "}
          to get started.
        </p>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
      </div>

      <StreakStatusIndicator />
      <GamificationWidgets />

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
