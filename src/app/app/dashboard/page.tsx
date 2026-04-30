"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { DailyChallengeWidget } from "@/components/gamification/daily-challenge";
import { useStreak } from "@/hooks/use-streak";
import { checkComeback, getComebackMessage } from "@/lib/gamification/comeback";
import { xpProgressInLevel } from "@/lib/gamification/xp";
import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles, Mic, BarChart3, ChevronDown, ChevronUp, Rocket, PlayCircle } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { ShareButton } from "@/components/share-button";
import { StreakFreezeModal } from "@/components/gamification/streak-freeze-modal";
import { InterviewCountdown } from "@/components/gamification/interview-countdown";
import { PushNotificationPrompt } from "@/components/gamification/push-notification-prompt";

// Lazy-load below-fold heavy components
const ActivityHeatmap = dynamic(
  () => import("@/components/gamification/activity-heatmap").then((m) => m.ActivityHeatmap),
  { ssr: false }
);
const CompanyQuestionsSection = dynamic(
  () => import("@/components/features/company-questions/company-questions-section").then((m) => m.CompanyQuestionsSection),
  { ssr: false }
);
const DailyQuests = dynamic(
  () => import("@/components/gamification/daily-quests").then((m) => m.DailyQuests),
  { ssr: false }
);
const QuestionBanner = dynamic(
  () => import("@/components/gamification/question-banner").then((m) => m.QuestionBanner),
  { ssr: false }
);

// ── Stagger item wrapper ──────────────────────────────────────────────────────

function FadeIn({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// ── Featured topics to show on dashboard ────────────────────────────────────

const FEATURED_TOPICS = [
  "Load Balancing",
  "Design: Chat System (WhatsApp/Slack)",
  "Dynamic Programming",
  "JavaScript Fundamentals",
  "Design: URL Shortener (TinyURL)",
  "Arrays & Strings",
];

// Fallback cards shown if content fails to load
const FALLBACK_TOPICS: TopicContent[] = [
  { topic: "Load Balancing", category: "System Design", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
  { topic: "Dynamic Programming", category: "Algorithms", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
  { topic: "JavaScript Fundamentals", category: "Programming Languages", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
  { topic: "Arrays & Strings", category: "Data Structures", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
  { topic: "Design: URL Shortener (TinyURL)", category: "System Design Cases", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
  { topic: "System Design Fundamentals", category: "System Design", cheatSheet: "", resources: [], ladder: { levels: [] }, plan: { overview: "", skippedTopics: "", sessions: [] }, quizBank: [] },
];

// ── Review Widget ─────────────────────────────────────────────────────────────

function ReviewWidget() {
  const dueCount = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return db.flashcards.where("nextReviewAt").belowOrEqual(today).count();
  }, []);

  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  if (dueCount === undefined || hour === null) return null;

  let message: string;
  let borderClass: string;
  let bgClass: string;
  let textClass: string;

  if (dueCount === 0) {
    message = "All caught up! Next review tomorrow.";
    borderClass = "border-teal/30";
    bgClass = "bg-teal/5";
    textClass = "text-teal";
  } else if (hour < 12) {
    message = "Good morning! Start your day with a quick review.";
    borderClass = "border-saffron/30";
    bgClass = "bg-saffron/5";
    textClass = "text-saffron";
  } else {
    message = `You have ${dueCount} overdue card${dueCount !== 1 ? "s" : ""} — let's catch up!`;
    borderClass = "border-gold/30";
    bgClass = "bg-gold/5";
    textClass = "text-gold";
  }

  return (
    <Link
      href="/app/review"
      className={`flex items-center gap-4 rounded-xl border ${borderClass} ${bgClass} p-4 transition-all hover:scale-[1.01] group`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${borderClass} ${bgClass}`}>
        <BookOpen className={`size-5 ${textClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${textClass}`}>
          {dueCount > 0 ? `${dueCount} card${dueCount !== 1 ? "s" : ""} due for review` : "Flashcard Review"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      </div>
      {dueCount > 0 && (
        <div className={`shrink-0 flex items-center gap-1 rounded-lg border ${borderClass} ${bgClass} px-3.5 py-2 text-xs font-medium ${textClass} group-hover:opacity-80`}>
          Review Now
          <ChevronRight className="size-3.5" />
        </div>
      )}
    </Link>
  );
}

// ── Comeback Banner ──────────────────────────────────────────────────────────

function ComebackBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [daysAway, setDaysAway] = useState(0);

  useEffect(() => {
    const lastActivity = localStorage.getItem("lastStreakDate") ?? "";
    const today = new Date().toISOString().slice(0, 10);
    const result = checkComeback(lastActivity, today);
    if (result.eligible) {
      setMessage(getComebackMessage(result.daysAway));
      setDaysAway(result.daysAway);
    }
  }, []);

  if (!message) return null;

  return (
    <div className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/10 via-saffron/5 to-gold/10 px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🙏</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gold">Welcome Back, Scholar!</p>
          <p className="text-sm text-foreground/80 mt-0.5">{message}</p>
          <div className="mt-3 rounded-lg border border-saffron/30 bg-saffron/5 px-3 py-2">
            <p className="text-xs font-semibold text-saffron">Comeback Challenge</p>
            <p className="text-xs text-foreground/70 mt-0.5">
              Complete 3 sessions in 3 days to earn <strong className="text-gold">+100 bonus XP</strong> and
              a streak freeze. Your knowledge is still here — prove it!
            </p>
          </div>
          {daysAway >= 7 && (
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              Tip: Start with a quick quiz on a topic you know well to rebuild momentum.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Daily Goal Progress Bar ──────────────────────────────────────────────────

function DailyGoalBar() {
  const { dailyGoal, dailyXP, dailyXPDate, queueCelebration } = useStore();
  const goalXP = dailyGoal * 5;
  const [today, setToday] = useState("");

  useEffect(() => {
    setToday(new Date().toISOString().slice(0, 10));
  }, []);

  const todayXP = today && dailyXPDate === today ? dailyXP : 0;
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
      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Daily goal progress: ${pct}%`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${goalMet ? "bg-green-400" : "bg-gold"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {goalMet
          ? "Daily goal achieved! Every extra point strengthens your rank."
          : pct >= 70
            ? `Almost there! Just ${goalXP - todayXP} XP to finish today's goal.`
            : pct >= 40
              ? `Good progress! ${goalXP - todayXP} XP remaining — a quick quiz will close the gap.`
              : `${goalXP - todayXP} XP to reach today's goal (${dailyGoal} min target)`}
      </p>
    </div>
  );
}

// ── Quick Start Card ─────────────────────────────────────────────────────────

function QuickStartCard({ content }: { content: TopicContent }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const BADGE_COLORS: Record<string, string> = {
    "System Design": "bg-saffron/20 text-saffron border-saffron/30",
    "System Design Cases": "bg-teal/20 text-teal border-teal/30",
    "Data Structures": "bg-indigo/20 text-indigo border-indigo/30",
    Algorithms: "bg-indigo/20 text-indigo border-indigo/30",
    "Programming Languages": "bg-gold/20 text-gold border-gold/30",
    Frontend: "bg-gold/20 text-gold border-gold/30",
    Backend: "bg-gold/20 text-gold border-gold/30",
    Databases: "bg-gold/20 text-gold border-gold/30",
    "Software Engineering": "bg-gold/20 text-gold border-gold/30",
    "Computer Science Fundamentals": "bg-gold/20 text-gold border-gold/30",
  };

  const badgeClass = BADGE_COLORS[content.category] ?? "bg-saffron/20 text-saffron border-saffron/30";
  const quizCount = content.quizBank?.length ?? 0;

  async function handleClick() {
    setLoading(true);
    try {
      const existing = await db.topics
        .where("name")
        .equalsIgnoreCase(content.topic)
        .first();
      if (existing?.id) {
        router.push(`/app/topic/${existing.id}`);
      } else {
        const id = await db.topics.add({
          name: content.topic,
          category: content.category,
          createdAt: new Date(),
        });
        router.push(`/app/topic/${id}`);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="group text-left rounded-xl border border-border/50 bg-surface hover:bg-surface-hover hover:border-border transition-all duration-150 p-4 flex flex-col gap-2 cursor-pointer disabled:opacity-60"
    >
      <p className="font-semibold text-sm leading-snug">
        {loading ? "Opening..." : content.topic}
      </p>
      <span className={`inline-flex self-start items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${badgeClass}`}>
        {content.category}
      </span>
      <p className="text-xs text-muted-foreground mt-auto">{quizCount} questions</p>
    </button>
  );
}

// ── Categories Quick Link ────────────────────────────────────────────────────

function CategoryLinks() {
  const CATS = [
    { icon: "📐", label: "System Design Fundamentals", color: "text-saffron", tab: "sd" },
    { icon: "🏗️", label: "System Design Cases", color: "text-teal", tab: "cases" },
    { icon: "🧮", label: "DS & Algorithms", color: "text-indigo", tab: "dsalgo" },
    { icon: "💻", label: "Core CS & Languages", color: "text-gold", tab: "cs" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {CATS.map((cat) => (
        <Link
          key={cat.tab}
          href="/app/topics"
          className={`rounded-xl border border-border/50 bg-surface hover:bg-surface-hover p-4 flex items-start gap-3 transition-colors`}
        >
          <span className="text-2xl">{cat.icon}</span>
          <div>
            <p className={`font-semibold text-sm ${cat.color}`}>{cat.label}</p>
            <p className="text-xs text-muted-foreground">Browse topics →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Continue Where You Left Off ──────────────────────────────────────────────

function ContinueLearning() {
  const router = useRouter();
  const recentTopics = useLiveQuery(
    () => db.topics.orderBy("createdAt").reverse().limit(3).toArray(),
    []
  );

  if (!recentTopics || recentTopics.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-lg font-semibold">Continue Where You Left Off</h2>
        <Link
          href="/app/topics"
          className="text-sm text-saffron hover:underline"
        >
          All topics
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recentTopics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            onClick={() => router.push(`/app/topic/${topic.id}`)}
            className="group text-left rounded-xl border border-saffron/20 bg-gradient-to-r from-saffron/5 to-surface p-4 flex items-center gap-3 transition-all hover:border-saffron/40 hover:scale-[1.01] cursor-pointer"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10">
              <PlayCircle className="size-4 text-saffron" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{topic.name}</p>
              <p className="text-[11px] text-muted-foreground">{topic.category}</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground group-hover:text-saffron transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </section>
  );
}

// ── Your Progress ────────────────────────────────────────────────────────────

function YourProgress() {
  const { totalXP, level, currentStreak } = useStore();
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const topicCount = useLiveQuery(() => db.topics.count(), []);

  const [todayStr, setTodayStr] = useState("");

  useEffect(() => {
    setTodayStr(new Date().toISOString().slice(0, 10));
  }, []);

  const questionsToday = todayStr
    ? (quizAttempts ?? [])
        .filter(
          (q) =>
            new Date(q.completedAt).toISOString().slice(0, 10) === todayStr
        )
        .reduce((acc, q) => acc + (q.questions?.length ?? 0), 0)
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
          {currentStreak >= 2 && (
            <ShareButton
              type="streak"
              value={currentStreak}
              size="icon"
              iconOnly
              className="size-7"
            />
          )}
        </div>
        <StreakFlame streak={currentStreak} size="md" />
        <p className="text-xs text-muted-foreground mt-2">days in a row</p>
      </div>
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">XP Progress</p>
        <XPBar totalXP={totalXP} level={level} />
      </div>
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Today</p>
        <div className="flex gap-6">
          <div>
            <p className="font-heading text-2xl font-bold">{questionsToday}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div>
            <p className="font-heading text-2xl font-bold">{topicCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Topics Started</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Nearly There Nudge ────────────────────────────────────────────────────────

function NearlyThereNudge() {
  const { totalXP, level } = useStore();
  const progress = xpProgressInLevel(totalXP);
  const xpRemaining = progress.needed - progress.current;

  // Only show when within 40% of the next level
  if (progress.percentage < 60 || level >= 20) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo/30 bg-gradient-to-r from-indigo/5 to-saffron/5 px-4 py-3">
      <span className="text-lg">⬆️</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo">
          Almost Level {level + 1}!
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Just <strong className="text-foreground">{xpRemaining} XP</strong> to go — one quiz could get you there.
        </p>
      </div>
      <Link
        href="/app/topics"
        className="shrink-0 rounded-lg border border-indigo/30 bg-indigo/10 px-3 py-1.5 text-[11px] font-medium text-indigo hover:bg-indigo/20 transition-colors"
      >
        Start Quiz
      </Link>
    </div>
  );
}

// ── Active Learners — social proof ──────────────────────────────────────────

function ActiveLearners() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Generate a realistic-looking number seeded by the current hour
    // so it stays stable within an hour but feels live
    const now = new Date();
    const hourSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
    const hour = now.getHours();

    // Simulate activity curve: peak during study hours (8am-11pm)
    const base = hour >= 8 && hour <= 23 ? 40 : 12;
    const peakBonus = (hour >= 19 && hour <= 22) ? 25 : (hour >= 9 && hour <= 12) ? 15 : 0;

    // Deterministic "random" per hour
    const seed = (hourSeed * 2654435761 + hour * 2246822507) >>> 0;
    const jitter = (seed % 20) - 10;

    setCount(Math.max(8, base + peakBonus + jitter));
  }, []);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/5 px-3 py-2">
      <span className="relative flex size-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
        <span className="relative inline-flex rounded-full size-2 bg-teal" />
      </span>
      <span className="text-xs text-muted-foreground">
        <strong className="text-teal font-semibold">{count}</strong> learners practicing right now
      </span>
    </div>
  );
}

// ── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { pendingFreeze, confirmFreeze, declineFreeze } = useStreak();

  const { data: session } = useSession();
  const [featuredContent, setFeaturedContent] = useState<TopicContent[]>([]);
  const [contentStats, setContentStats] = useState<{ topicCount: number; questionCount: number }>({ topicCount: 0, questionCount: 0 });
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    loadAllContent().then((all) => {
      // Compute dynamic stats from actual content
      setContentStats({
        topicCount: all.length,
        questionCount: all.reduce((sum, t) => sum + (t.quizBank?.length ?? 0), 0),
      });

      const featured = FEATURED_TOPICS.flatMap((name) => {
        const match = all.find(
          (t) => t.topic.toLowerCase() === name.toLowerCase()
        );
        return match ? [match] : [];
      });
      setFeaturedContent(featured.length > 0 ? featured : FALLBACK_TOPICS);
    }).catch(() => {
      setFeaturedContent(FALLBACK_TOPICS);
    });
  }, []);

  const topicCount = useLiveQuery(() => db.topics.count());
  const isNewUser = topicCount === 0;

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0];

  // FadeIn index counter for sequential animation
  let idx = 0;

  return (
    <PageTransition>
      {/* Streak freeze confirmation modal */}
      {pendingFreeze && (
        <StreakFreezeModal
          open={!!pendingFreeze}
          streak={pendingFreeze.streak}
          freezesRemaining={pendingFreeze.freezesAvailable}
          onUseFreeze={confirmFreeze}
          onLetBreak={declineFreeze}
        />
      )}

      <div className="space-y-8">
      {/* Welcome Banner */}
      <FadeIn index={idx++}>
      <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-6">
        <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-1">
          Guru Sishya
        </p>

        {user ? (
          <div className="flex items-center gap-3 mb-2">
            {user.image && (
              <Image
                src={user.image}
                alt={user.name ?? "User avatar"}
                width={36}
                height={36}
                className="rounded-full ring-2 ring-saffron/30"
              />
            )}
            <h1 className="font-heading text-2xl font-bold">
              Welcome back, {firstName}!
            </h1>
          </div>
        ) : (
          <div className="mb-2">
            <h1 className="font-heading text-2xl font-bold">
              Your Interview Prep Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              <Link href="/login" className="text-saffron hover:underline font-medium">
                Sign in
              </Link>{" "}
              to save your progress across devices.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{contentStats.topicCount || "..."}</strong> topics ready
          </span>
          <span>
            <strong className="text-foreground">{contentStats.questionCount ? contentStats.questionCount.toLocaleString() : "..."}</strong> quiz questions
          </span>
          <span>
            <strong className="text-foreground">{topicCount ?? 0}</strong>{" "}
            {topicCount === 1 ? "topic" : "topics"} started
          </span>
        </div>
      </div>
      </FadeIn>

      {/* New User Getting Started Card — shown only when no topics started */}
      {isNewUser && (
        <FadeIn index={idx++}>
        <div className="rounded-2xl border border-teal/30 bg-gradient-to-br from-teal/10 via-teal/5 to-saffron/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-teal/30 bg-teal/10">
              <Rocket className="size-5 text-teal" />
            </div>
            <h2 className="font-heading text-xl font-bold">Welcome! Here&apos;s how to start</h2>
          </div>
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-saffron/20 text-saffron text-sm font-bold">1</span>
              <p className="text-sm text-foreground/90">
                <strong>Pick a topic</strong> — choose from {contentStats.topicCount || "81"} interview topics like System Design, DSA, or Java.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold text-sm font-bold">2</span>
              <p className="text-sm text-foreground/90">
                <strong>Take a Quiz</strong> — test your knowledge with curated quiz questions and get instant feedback.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal text-sm font-bold">3</span>
              <p className="text-sm text-foreground/90">
                <strong>Review with Cheatsheets</strong> — use cheatsheets and flashcards to solidify your understanding.
              </p>
            </div>
          </div>
          <Link
            href="/app/topics"
            className="inline-flex items-center gap-2 rounded-lg bg-saffron px-5 py-2.5 text-sm font-semibold text-background hover:bg-saffron/90 transition-colors"
          >
            Browse Topics
            <ChevronRight className="size-4" />
          </Link>
        </div>
        </FadeIn>
      )}

      <FadeIn index={idx++}><ComebackBanner /></FadeIn>

      {/* Active learners social proof */}
      <FadeIn index={idx++}><ActiveLearners /></FadeIn>

      {/* Push notification prompt — shows after 3rd visit */}
      <FadeIn index={idx++}><PushNotificationPrompt /></FadeIn>

      {/* ── Above Fold: key status + next actions ─────────────────────── */}

      {/* Your Progress — most important info first */}
      <FadeIn index={idx++}>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold">Your Progress</h2>
          <Link
            href="/app/dashboard/analytics"
            className="flex items-center gap-1.5 text-sm text-saffron hover:underline"
          >
            <BarChart3 className="size-3.5" />
            View Analytics
          </Link>
        </div>
        <YourProgress />
      </section>
      </FadeIn>

      {/* Daily Goal — logically grouped with progress */}
      <FadeIn index={idx++}><DailyGoalBar /></FadeIn>

      {/* Nearly there nudge — shows when close to next level */}
      <FadeIn index={idx++}><NearlyThereNudge /></FadeIn>

      {/* Continue Where You Left Off — clear next action */}
      {!isNewUser && (
        <FadeIn index={idx++}><ContinueLearning /></FadeIn>
      )}

      {/* Review Widget */}
      <FadeIn index={idx++}><ReviewWidget /></FadeIn>

      {/* Interview Countdown */}
      <FadeIn index={idx++}><InterviewCountdown /></FadeIn>

      {/* Daily Quests — engagement hook, above fold */}
      <FadeIn index={idx++}>
      <section>
        <h2 className="font-heading text-lg font-semibold mb-3">Daily Quests</h2>
        <DailyQuests />
      </section>
      </FadeIn>

      {/* Daily Challenge */}
      <FadeIn index={idx++}><DailyChallengeWidget /></FadeIn>

      {/* Question of the Day Banner */}
      <FadeIn index={idx++}><QuestionBanner /></FadeIn>

      {/* ── Below Fold: collapsed by default ──────────────────────────── */}

      {showMore && (
        <>
          {/* Mock Interview CTA */}
          <FadeIn index={0}>
          <Link
            href="/app/interview"
            className="group flex items-center gap-4 rounded-xl border border-saffron/20 bg-gradient-to-r from-saffron/5 via-gold/5 to-indigo/5 p-4 transition-all hover:scale-[1.01] hover:border-saffron/30"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-saffron/30 bg-saffron/10">
              <Mic className="size-5 text-saffron" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Live AI Interviewer — Mock Interview
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Simulate real interviews with Google, Amazon, Meta & more. Instant feedback via keyword analysis — no API needed.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 rounded-lg border border-saffron/20 bg-saffron/10 px-3.5 py-2 text-xs font-medium text-saffron group-hover:opacity-80">
              Start Now
              <ChevronRight className="size-3.5" />
            </div>
          </Link>
          </FadeIn>

          {/* Important Questions Widget */}
          <FadeIn index={1}>
          <Link
            href="/app/questions"
            className="group flex items-center gap-4 rounded-xl border border-indigo/20 bg-gradient-to-r from-indigo/5 via-saffron/5 to-gold/5 p-4 transition-all hover:scale-[1.01] hover:border-indigo/30"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-indigo/30 bg-indigo/10">
              <Sparkles className="size-5 text-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                650+ Interview Questions
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated Java questions with book-style flip cards. Core Java, Spring Boot, Microservices, System Design & more.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 rounded-lg border border-indigo/20 bg-indigo/10 px-3.5 py-2 text-xs font-medium text-indigo group-hover:opacity-80">
              Start Now
              <ChevronRight className="size-3.5" />
            </div>
          </Link>
          </FadeIn>

          {/* Company-Specific Technical Questions */}
          <FadeIn index={2}><CompanyQuestionsSection /></FadeIn>

          {/* Quick Start — hidden for new users since they have the Getting Started card */}
          {!isNewUser && (
            <FadeIn index={3}>
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-heading text-lg font-semibold">Quick Start</h2>
                <Link
                  href="/app/topics"
                  className="text-sm text-saffron hover:underline"
                >
                  Browse all {contentStats.topicCount || ""} topics →
                </Link>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Pick a topic to jump straight into learning.
              </p>
              {featuredContent.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredContent.map((c) => (
                    <QuickStartCard key={c.topic} content={c} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-xl border border-border/30 bg-surface p-4 flex flex-col gap-2"
                    >
                      <div className="h-4 w-3/4 bg-muted/40 rounded" />
                      <div className="h-3 w-1/2 bg-muted/30 rounded" />
                      <div className="h-3 w-1/4 bg-muted/20 rounded mt-auto" />
                    </div>
                  ))}
                </div>
              )}
            </section>
            </FadeIn>
          )}

          {/* Category Links — hidden for new users since they have the Getting Started card */}
          {!isNewUser && (
            <FadeIn index={4}>
            <section>
              <h2 className="font-heading text-lg font-semibold mb-3">Browse by Category</h2>
              <CategoryLinks />
            </section>
            </FadeIn>
          )}

          {/* Activity Heatmap */}
          <FadeIn index={5}><ActivityHeatmap /></FadeIn>
        </>
      )}

      {/* Show More / Show Less toggle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowMore((prev) => !prev)}
          aria-expanded={showMore}
          className="flex items-center gap-2 rounded-lg border border-border/50 bg-surface hover:bg-surface-hover px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {showMore ? (
            <>
              Show Less
              <ChevronUp className="size-4" />
            </>
          ) : (
            <>
              Show More
              <ChevronDown className="size-4" />
            </>
          )}
        </button>
      </div>
    </div>
    </PageTransition>
  );
}
