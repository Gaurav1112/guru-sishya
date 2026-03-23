"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Flame, BookOpen, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getDueCards, getReviewHistory } from "@/lib/flashcard-generator";
import { FlashcardDeck } from "@/components/features/review/flashcard-deck";
import { Button } from "@/components/ui/button";
import type { Flashcard } from "@/lib/types";

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

// ── Hub view (not in active review) ──────────────────────────────────────────

interface HubViewProps {
  dueCards: Flashcard[];
  history: { date: string; cardsReviewed: number }[];
  onStartReview: () => void;
}

function HubView({ dueCards, history, onStartReview }: HubViewProps) {
  const dueCount = dueCards.length;
  const hour = new Date().getHours();

  let greetingMessage: string;
  if (dueCount === 0) {
    greetingMessage = "All caught up! Next review tomorrow.";
  } else if (hour < 12) {
    greetingMessage = "Good morning! Start your day with a quick review.";
  } else {
    greetingMessage = `You have ${dueCount} card${dueCount !== 1 ? "s" : ""} due — let's keep the streak going!`;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-6">
        <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-1">
          Daily Review
        </p>
        <h1 className="font-heading text-2xl font-bold mb-2">
          {dueCount > 0 ? `${dueCount} card${dueCount !== 1 ? "s" : ""} due today` : "You're all caught up!"}
        </h1>
        <p className="text-sm text-muted-foreground mb-4">{greetingMessage}</p>

        {dueCount > 0 ? (
          <Button onClick={onStartReview} size="lg" className="gap-2">
            <BookOpen className="size-4" />
            Start Daily Review
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <div className="flex gap-3">
            <Link href="/app/topics">
              <Button variant="outline" size="sm">Browse Topics</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Streak Calendar */}
      <StreakCalendar history={history} />

      {/* Upcoming */}
      <UpcomingReviews />

      {/* History */}
      <section>
        <h2 className="font-heading text-base font-semibold mb-3">Review History</h2>
        <ReviewHistory history={history} />
      </section>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [history, setHistory] = useState<{ date: string; cardsReviewed: number }[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [due, hist] = await Promise.all([getDueCards(), getReviewHistory()]);
        setDueCards(due);
        setHistory(hist);
      } catch {
        setDueCards([]);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isReviewing]); // Reload after completing a review

  function handleStartReview() {
    setIsReviewing(true);
  }

  function handleReviewComplete() {
    setIsReviewing(false);
    // History will reload via the useEffect dependency on isReviewing
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="size-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
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
              history={history}
              onStartReview={handleStartReview}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
