"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Flame, BookOpen, ChevronRight, Clock, CalendarCheck, CalendarRange, Trophy, Lock, Bookmark, AlertCircle, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { getDueCards, getReviewHistory } from "@/lib/flashcard-generator";
import { FlashcardDeck } from "@/components/features/review/flashcard-deck";
import { PremiumGate } from "@/components/premium-gate";
import { Button } from "@/components/ui/button";
import { checkStreak, recordDailyActivity } from "@/lib/gamification/streaks";
import { getUserStats, checkAndUnlockBadges } from "@/lib/gamification/badges";
import type { Flashcard } from "@/lib/types";
import type { TimedTestResult } from "@/lib/review/question-selector";

const FREE_FLASHCARD_LIMIT = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
}

// ── Streak calendar ───────────────────────────────────────────────────────────

function StreakCalendar({
  history,
}: {
  history: { date: string; cardsReviewed: number }[];
}) {
  // Show the last 14 days
  const days: { dateStr: string; dayLabel: string; hasReview: boolean }[] = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = getDayOfWeek(dateStr);
    const hasReview = history.some((h) => h.date === dateStr);
    days.push({ dateStr, dayLabel, hasReview });
  }

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="size-4 text-saffron" />
        <h3 className="text-sm font-semibold">Review Streak</h3>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {days.map(({ dateStr, dayLabel, hasReview }) => (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
            <div
              title={dateStr}
              className={`size-7 rounded-md transition-colors ${
                dateStr === todayStr
                  ? hasReview
                    ? "bg-saffron ring-2 ring-saffron/40"
                    : "bg-muted/50 ring-2 ring-saffron/40"
                  : hasReview
                  ? "bg-saffron/70"
                  : "bg-muted/30"
              }`}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        {history.filter((h) => {
          const d = new Date(h.date);
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 7);
          return d >= dayAgo;
        }).length}{" "}
        review days this week
      </p>
    </div>
  );
}

// ── Upcoming reviews widget ────────────────────────────────────────────────────

function UpcomingReviews() {
  const [weeklyCount, setWeeklyCount] = useState<number | null>(null);
  const [monthlyCount, setMonthlyCount] = useState<number | null>(null);

  useEffect(() => {
    db.flashcards.count().then((total) => {
      setMonthlyCount(total);
    }).catch(() => {});

    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    db.flashcards
      .where("nextReviewAt")
      .belowOrEqual(weekFromNow)
      .count()
      .then((c) => setWeeklyCount(c))
      .catch(() => {});
  }, []);

  // Compute approximate next weekly/monthly reset
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sunday
  const daysUntilWeekly = 7 - dayOfWeek;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysUntilMonthly = daysInMonth - today.getDate();

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-teal" />
        <h3 className="text-sm font-semibold">Upcoming</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Weekly Review</span>
          <span className="font-medium">
            in {daysUntilWeekly} day{daysUntilWeekly !== 1 ? "s" : ""}
            {weeklyCount !== null && (
              <span className="text-muted-foreground ml-1">({weeklyCount} cards)</span>
            )}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Monthly Test</span>
          <span className="font-medium">
            in {daysUntilMonthly} day{daysUntilMonthly !== 1 ? "s" : ""}
            {monthlyCount !== null && (
              <span className="text-muted-foreground ml-1">({monthlyCount} total)</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Review history list ────────────────────────────────────────────────────────

function ReviewHistory({
  history,
}: {
  history: { date: string; cardsReviewed: number }[];
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
        No review history yet. Start your first daily review above!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.slice(0, 10).map(({ date, cardsReviewed }) => {
        const d = new Date(date + "T00:00:00");
        const formatted = d.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={date}
            className="flex items-center justify-between rounded-lg border border-border/40 bg-surface px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="size-4 text-muted-foreground" />
              <span className="text-sm">{formatted}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{cardsReviewed} card{cardsReviewed !== 1 ? "s" : ""}</span>
              <BookOpen className="size-3.5 text-muted-foreground" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Timed test cards ──────────────────────────────────────────────────────────

function TimedTestCards() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const dateOfMonth = today.getDate();

  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const isWeeklyDay = dayOfWeek === 0;
  const isMonthlyWeek = dateOfMonth <= 7;

  // Days until first of next month
  const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysToMonthEnd = Math.ceil((firstOfNext.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const testHistory = useLiveQuery(
    () => db.timedTestResults.orderBy("completedAt").reverse().limit(5).toArray(),
    []
  );

  return (
    <div className="space-y-3">
      <h2 className="font-heading text-base font-semibold">Timed Tests</h2>

      {/* Weekly */}
      <Link href="/app/review/weekly" className="group block">
        <div className="rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-teal/30 transition-all p-4 flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal/30 bg-teal/10">
            <CalendarCheck className="size-5 text-teal" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">Weekly Test</span>
              {isWeeklyDay ? (
                <span className="text-[10px] font-semibold rounded-full border border-teal/40 bg-teal/10 text-teal px-2 py-0.5">
                  Available today
                </span>
              ) : (
                <span className="text-[10px] rounded-full border border-border text-muted-foreground px-2 py-0.5">
                  Sunday{daysUntilSunday > 0 ? ` · ${daysUntilSunday}d` : ""}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              15–20 questions · 30 min · +50 XP +20 coins
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </Link>

      {/* Monthly */}
      <Link href="/app/review/monthly" className="group block">
        <div className="rounded-xl border border-border bg-surface hover:bg-surface-hover hover:border-gold/30 transition-all p-4 flex items-center gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10">
            <CalendarRange className="size-5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">Monthly Test</span>
              {isMonthlyWeek ? (
                <span className="text-[10px] font-semibold rounded-full border border-gold/40 bg-gold/10 text-gold px-2 py-0.5">
                  Available this week
                </span>
              ) : (
                <span className="text-[10px] rounded-full border border-border text-muted-foreground px-2 py-0.5">
                  First week · {daysToMonthEnd}d away
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              30–40 questions · 60 min · +100 XP +50 coins · certificate
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
        </div>
      </Link>

      {/* Recent test history */}
      {testHistory && testHistory.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-surface p-4 mt-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Recent Tests
          </h3>
          <div className="space-y-2">
            {testHistory.map((r: TimedTestResult) => {
              const color =
                r.score >= 70 ? "text-teal" : r.score >= 50 ? "text-saffron" : "text-destructive";
              const dateStr = new Date(r.completedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });
              return (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className={`size-3.5 ${r.type === "monthly" ? "text-gold" : "text-saffron"}`} />
                    <span className="capitalize text-muted-foreground">
                      {r.type} · {dateStr}
                    </span>
                  </div>
                  <span className={`font-semibold tabular-nums ${color}`}>
                    {r.score}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Review Bookmarks widget ───────────────────────────────────────────────────

function ReviewBookmarks() {
  const reviewBookmarks = useLiveQuery(
    () => db.questionBookmarks.where("status").equals("review").toArray()
  );

  const count = reviewBookmarks?.length ?? 0;

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Bookmark className="size-4 text-indigo-400" />
        <h3 className="text-sm font-semibold">Marked for Review</h3>
        {count > 0 && (
          <span className="ml-auto text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-400 px-2 py-0.5">
            {count}
          </span>
        )}
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground">
          No questions marked for review yet. Use the Important Questions feature to flag ones you want to revisit.
        </p>
      ) : (
        <div className="space-y-1">
          {reviewBookmarks!.slice(0, 5).map((bm) => (
            <div
              key={bm.id}
              className="flex items-center justify-between rounded-md bg-muted/20 px-3 py-1.5 text-xs"
            >
              <span className="text-muted-foreground">Question #{bm.questionId}</span>
              <span className="text-[10px] text-indigo-400 font-medium">review</span>
            </div>
          ))}
          {count > 5 && (
            <p className="text-xs text-muted-foreground pt-1">+{count - 5} more</p>
          )}
          <Link
            href="/app/questions"
            className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:underline"
          >
            Go to Important Questions <ChevronRight className="size-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Interview Misses widget ───────────────────────────────────────────────────

function InterviewMisses() {
  const [misses, setMisses] = useState<{ question: string; score: number; topic?: string }[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem("gs-interview-history") || "[]");
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recent = history
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((session: any) => new Date(session.completedAt || session.date || 0).getTime() >= sevenDaysAgo)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .flatMap((session: any) => (session.questions || []).map((q: any) => ({ ...q, topic: session.topic })))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => typeof q.score === "number" && q.score < 7)
        .slice(0, 10);
      setMisses(recent);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <button
        type="button"
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <AlertCircle className="size-4 text-destructive/70" />
        <h3 className="text-sm font-semibold flex-1">Recent Interview Misses</h3>
        {misses.length > 0 && (
          <span className="text-xs font-semibold rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
            {misses.length}
          </span>
        )}
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-3 space-y-1">
          {misses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No recent misses in the last 7 days. Great job!
            </p>
          ) : (
            misses.map((m, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md bg-muted/20 px-3 py-2 text-xs">
                <span className="shrink-0 font-semibold text-destructive/80">{m.score}/10</span>
                <span className="text-muted-foreground line-clamp-2 flex-1">{m.question || `Question ${i + 1}`}</span>
              </div>
            ))
          )}
          {misses.length === 0 && (
            <Link
              href="/app/interview"
              className="mt-1 inline-flex items-center gap-1 text-xs text-saffron hover:underline"
            >
              Practice interview questions <ChevronRight className="size-3" />
            </Link>
          )}
        </div>
      )}
      {!expanded && misses.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No misses in the last 7 days.</p>
      )}
    </div>
  );
}

// ── Hub view (not in active review) ──────────────────────────────────────────

interface HubViewProps {
  dueCards: Flashcard[];
  totalDueCount: number;
  isActivePremium: boolean;
  history: { date: string; cardsReviewed: number }[];
  onStartReview: () => void;
}

function HubView({ dueCards, totalDueCount, isActivePremium, history, onStartReview }: HubViewProps) {
  const dueCount = dueCards.length;
  const hour = new Date().getHours();

  const [interviewMissCount, setInterviewMissCount] = useState(0);
  const reviewBookmarks = useLiveQuery(
    () => db.questionBookmarks.where("status").equals("review").toArray()
  );

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("gs-interview-history") || "[]");
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const count = hist
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((s: any) => new Date(s.completedAt || s.date || 0).getTime() >= sevenDaysAgo)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .flatMap((s: any) => s.questions || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((q: any) => typeof q.score === "number" && q.score < 7)
        .length;
      setInterviewMissCount(Math.min(count, 10));
    } catch {
      // ignore
    }
  }, []);

  let greetingMessage: string;
  if (dueCount === 0) {
    greetingMessage = "All caught up! Next review tomorrow.";
  } else if (hour < 12) {
    greetingMessage = "Good morning! Start your day with a quick review.";
  } else {
    greetingMessage = `You have ${dueCount} card${dueCount !== 1 ? "s" : ""} due — let's keep the streak going!`;
  }

  const isLimited = !isActivePremium && totalDueCount > FREE_FLASHCARD_LIMIT;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Hero — compact */}
      <div className="rounded-xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-0.5">
            Daily Review
          </p>
          <h1 className="font-heading text-xl font-bold">
            {dueCount > 0 ? `${dueCount} card${dueCount !== 1 ? "s" : ""} due today` : "You're all caught up!"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">{greetingMessage}</p>
        </div>
        {dueCount > 0 ? (
          <Button onClick={onStartReview} size="sm" className="gap-2 shrink-0">
            <BookOpen className="size-4" />
            Start Review
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Link href="/app/topics">
            <Button variant="outline" size="sm" className="shrink-0">Browse Topics</Button>
          </Link>
        )}
      </div>

      {/* Summary stat bar */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">{dueCount}</span> cards due
        <span className="text-border">·</span>
        <span className="font-medium text-foreground">{reviewBookmarks?.length ?? 0}</span> marked for review
        <span className="text-border">·</span>
        <span className="font-medium text-foreground">{interviewMissCount}</span> interview misses (7d)
      </div>

      {/* Free user flashcard limit banner */}
      {!isActivePremium && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-saffron/30 bg-saffron/5 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="size-4 text-saffron shrink-0" />
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{FREE_FLASHCARD_LIMIT} of 2000+ flashcards</span> available
              {isLimited && ` (${totalDueCount - FREE_FLASHCARD_LIMIT} more locked)`}
            </p>
          </div>
          <Link
            href="/app/pricing"
            className="shrink-0 text-xs font-semibold text-saffron underline whitespace-nowrap"
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak Calendar */}
        <StreakCalendar history={history} />

        {/* Review Bookmarks */}
        <ReviewBookmarks />

        {/* Interview Misses */}
        <InterviewMisses />

        {/* Upcoming */}
        <UpcomingReviews />
      </div>

      {/* Timed tests — full width */}
      <TimedTestCards />

      {/* Flashcard gate for free users with large decks */}
      {isLimited && (
        <PremiumGate feature="full-flashcards" overlay={false} />
      )}

      {/* History */}
      <section>
        <h2 className="font-heading text-base font-semibold mb-3">Flashcard History</h2>
        <ReviewHistory history={history} />
      </section>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [totalDueCount, setTotalDueCount] = useState(0);
  const [history, setHistory] = useState<{ date: string; cardsReviewed: number }[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const isActivePremium = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();
  const currentStreak = useStore((s) => s.currentStreak);
  const longestStreak = useStore((s) => s.longestStreak);
  const streakFreezes = useStore((s) => s.streakFreezes);
  const setStreak = useStore((s) => s.setStreak);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [due, hist] = await Promise.all([getDueCards(), getReviewHistory()]);
        setTotalDueCount(due.length);
        // Limit to FREE_FLASHCARD_LIMIT for free users
        setDueCards(isActivePremium ? due : due.slice(0, FREE_FLASHCARD_LIMIT));
        setHistory(hist);
      } catch {
        setDueCards([]);
        setTotalDueCount(0);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReviewing, isActivePremium]); // Reload after completing a review

  function handleStartReview() {
    setIsReviewing(true);
  }

  function handleReviewComplete() {
    setIsReviewing(false);
    // Update main streak after completing a review session
    const today = new Date().toISOString().slice(0, 10);
    const streakResult = checkStreak(
      {
        currentStreak,
        longestStreak,
        freezesAvailable: streakFreezes,
        lastActivityDate: today,
      },
      today
    );
    setStreak(streakResult.newState.currentStreak, streakResult.newState.longestStreak);
    recordDailyActivity(today).catch(() => {});

    // Check and unlock badges after review session
    const storeState = useStore.getState();
    getUserStats({
      currentStreak: streakResult.newState.currentStreak,
      longestStreak: streakResult.newState.longestStreak,
      totalXP: storeState.totalXP,
      level: storeState.level,
    }).then((stats) => checkAndUnlockBadges(stats)).then((newBadges) => {
      for (const badge of newBadges) {
        storeState.queueCelebration({ type: "badge", data: { badge: { name: badge.name, icon: badge.icon } } });
      }
    }).catch(() => {});

    // History will reload via the useEffect dependency on isReviewing
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-border/30 bg-surface p-6 space-y-3">
          <div className="h-3 w-24 bg-muted/40 rounded" />
          <div className="h-7 w-48 bg-muted/40 rounded" />
          <div className="h-4 w-72 bg-muted/30 rounded" />
          <div className="h-10 w-40 bg-muted/30 rounded-lg mt-2" />
        </div>

        {/* Streak calendar skeleton */}
        <div className="rounded-xl border border-border/30 bg-surface p-4 space-y-3">
          <div className="h-4 w-28 bg-muted/40 rounded" />
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 14 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-2 w-6 bg-muted/30 rounded" />
                <div className="size-7 bg-muted/30 rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* Timed tests skeleton */}
        <div className="space-y-3">
          <div className="h-5 w-24 bg-muted/40 rounded" />
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-surface p-4 flex items-center gap-4">
              <div className="size-10 shrink-0 rounded-xl bg-muted/30" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted/40 rounded" />
                <div className="h-3 w-48 bg-muted/30 rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* History rows skeleton */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/30 bg-surface px-4 py-3 flex items-center justify-between">
              <div className="h-4 w-32 bg-muted/30 rounded" />
              <div className="h-4 w-16 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <AnimatePresence mode="wait">
        {isReviewing ? (
          <motion.div
            key="reviewing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="max-w-lg mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-heading text-lg font-bold">Daily Review</h1>
                <button
                  type="button"
                  onClick={() => setIsReviewing(false)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Exit
                </button>
              </div>
              <FlashcardDeck cards={dueCards} onComplete={handleReviewComplete} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <HubView
              dueCards={dueCards}
              totalDueCount={totalDueCount}
              isActivePremium={isActivePremium}
              history={history}
              onStartReview={handleStartReview}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
