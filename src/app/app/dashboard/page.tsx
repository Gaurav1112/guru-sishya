"use client";

import { QuestionBanner } from "@/components/gamification/question-banner";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { DailyChallengeWidget } from "@/components/gamification/daily-challenge";
import { useStreak } from "@/hooks/use-streak";
import { checkComeback, getComebackMessage } from "@/lib/gamification/comeback";
import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { StarSection } from "@/components/features/star/star-section";

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

  const hour = new Date().getHours();

  if (dueCount === undefined) return null;

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
        <div className={`shrink-0 flex items-center gap-1 rounded-lg border ${borderClass} ${bgClass} px-3 py-1.5 text-xs font-medium ${textClass} group-hover:opacity-80`}>
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

  useEffect(() => {
    const lastActivity = localStorage.getItem("lastStreakDate") ?? "";
    const today = new Date().toISOString().slice(0, 10);
    const { eligible, daysAway } = checkComeback(lastActivity, today);
    if (eligible) setMessage(getComebackMessage(daysAway));
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

// ── Daily Goal Progress Bar ──────────────────────────────────────────────────

function DailyGoalBar() {
  const { dailyGoal, dailyXP, dailyXPDate, queueCelebration } = useStore();
  const goalXP = dailyGoal * 5;
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
          className={`h-full rounded-full transition-all duration-500 ${goalMet ? "bg-green-400" : "bg-gold"}`}
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

// ── Your Progress ────────────────────────────────────────────────────────────

function YourProgress() {
  const { totalXP, level, currentStreak } = useStore();
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const topicCount = useLiveQuery(() => db.topics.count(), []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const questionsToday = (quizAttempts ?? [])
    .filter(
      (q) =>
        new Date(q.completedAt).toISOString().slice(0, 10) === todayStr
    )
    .reduce((acc, q) => acc + (q.questions?.length ?? 0), 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Streak</p>
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

// ── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  useStreak();

  const { data: session } = useSession();
  const [featuredContent, setFeaturedContent] = useState<TopicContent[]>([]);

  useEffect(() => {
    loadAllContent().then((all) => {
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

  const user = session?.user;
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
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
            <strong className="text-foreground">54</strong> topics ready
          </span>
          <span>
            <strong className="text-foreground">1,301</strong> quiz questions
          </span>
          <span>
            <strong className="text-foreground">{topicCount ?? 0}</strong>{" "}
            {topicCount === 1 ? "topic" : "topics"} started
          </span>
        </div>
      </div>

      <ComebackBanner />

      {/* Review Widget */}
      <ReviewWidget />

      {/* Important Questions Widget */}
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
        <div className="shrink-0 flex items-center gap-1 rounded-lg border border-indigo/20 bg-indigo/10 px-3 py-1.5 text-xs font-medium text-indigo group-hover:opacity-80">
          Start Now
          <ChevronRight className="size-3.5" />
        </div>
      </Link>

      {/* Daily Challenge */}
      <DailyChallengeWidget />

      {/* Question of the Day Banner */}
      <QuestionBanner />

      {/* STAR Interview Prep */}
      <StarSection />

      {/* Your Progress */}
      <section>
        <h2 className="font-heading text-lg font-semibold mb-3">Your Progress</h2>
        <YourProgress />
      </section>

      {/* Daily Goal */}
      <DailyGoalBar />

      {/* Activity Heatmap */}
      <ActivityHeatmap />

      {/* Quick Start */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold">Quick Start</h2>
          <Link
            href="/app/topics"
            className="text-sm text-saffron hover:underline"
          >
            Browse all 54 topics →
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
          <div className="h-32 rounded-xl border border-dashed border-border/50 flex items-center justify-center text-sm text-muted-foreground">
            Loading topics...
          </div>
        )}
      </section>

      {/* Category Links */}
      <section>
        <h2 className="font-heading text-lg font-semibold mb-3">Browse by Category</h2>
        <CategoryLinks />
      </section>
    </div>
  );
}
