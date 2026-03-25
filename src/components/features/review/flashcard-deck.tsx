"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RotateCcw, Zap, Coins } from "lucide-react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { scheduleReview } from "@/lib/spaced-repetition";
import { Flashcard, type DifficultyRating } from "./flashcard";
import { Button } from "@/components/ui/button";
import type { Flashcard as FlashcardType } from "@/lib/types";

// ── Rating → SM-2 quality mapping ─────────────────────────────────────────────

function ratingToQuality(rating: DifficultyRating): number {
  switch (rating) {
    case "easy":  return 5; // perfect recall
    case "good":  return 4; // correct with hesitation
    case "hard":  return 3; // correct with difficulty
    case "again": return 1; // incorrect
  }
}

// ── Summary screen ────────────────────────────────────────────────────────────

interface SummaryProps {
  total: number;
  ratings: DifficultyRating[];
  xpEarned: number;
  coinsEarned: number;
  nextReviewDate: Date | null;
  onDone: () => void;
}

function DeckSummary({
  total,
  ratings,
  xpEarned,
  coinsEarned,
  nextReviewDate,
  onDone,
}: SummaryProps) {
  const easy  = ratings.filter((r) => r === "easy").length;
  const good  = ratings.filter((r) => r === "good").length;
  const hard  = ratings.filter((r) => r === "hard").length;
  const again = ratings.filter((r) => r === "again").length;
  const pctCorrect = total > 0 ? Math.round(((easy + good) / total) * 100) : 0;

  const nextStr = nextReviewDate
    ? nextReviewDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "Tomorrow";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8 max-w-md mx-auto text-center"
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-teal/10 ring-2 ring-teal/30">
        <CheckCircle2 className="size-10 text-teal" />
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold">Review Complete!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You reviewed {total} card{total !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {[
          { label: "Easy",  count: easy,  color: "text-teal" },
          { label: "Good",  count: good,  color: "text-saffron" },
          { label: "Hard",  count: hard,  color: "text-orange-400" },
          { label: "Again", count: again, color: "text-destructive" },
        ].map(({ label, count, color }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-3">
            <p className={`font-heading text-xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Accuracy */}
      <div className="w-full rounded-xl border border-border bg-surface p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Accuracy</span>
          <span className="font-semibold">{pctCorrect}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-teal transition-all duration-700"
            style={{ width: `${pctCorrect}%` }}
          />
        </div>
      </div>

      {/* Rewards */}
      {(xpEarned > 0 || coinsEarned > 0) && (
        <div className="flex items-center gap-4">
          {xpEarned > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-saffron/40 bg-saffron/10 px-4 py-2">
              <Zap className="size-4 text-saffron" />
              <span className="font-semibold text-saffron text-sm">+{xpEarned} XP</span>
            </div>
          )}
          {coinsEarned > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2">
              <Coins className="size-4 text-gold" />
              <span className="font-semibold text-gold text-sm">+{coinsEarned} coins</span>
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Next review: <span className="font-medium text-foreground">{nextStr}</span>
      </p>

      <Button onClick={onDone} className="w-full max-w-xs" size="lg">
        Done
      </Button>
    </motion.div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  ratings,
}: {
  current: number;
  total: number;
  ratings: DifficultyRating[];
}) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Card {current} of {total}</span>
        <div className="flex gap-2">
          <span className="text-teal">{ratings.filter((r) => r === "easy" || r === "good").length} correct</span>
          <span className="text-destructive">{ratings.filter((r) => r === "again").length} missed</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full bg-saffron transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main deck ─────────────────────────────────────────────────────────────────

interface FlashcardDeckProps {
  cards: FlashcardType[];
  onComplete?: () => void;
}

export function FlashcardDeck({ cards, onComplete }: FlashcardDeckProps) {
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratings, setRatings] = useState<DifficultyRating[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState<Date | null>(null);

  const total = cards.length;
  const currentCard = cards[currentIndex];

  const handleRate = useCallback(
    async (rating: DifficultyRating) => {
      const quality = ratingToQuality(rating);
      const newRatings = [...ratings, rating];
      setRatings(newRatings);

      // Update SM-2 schedule in Dexie
      if (currentCard.id !== undefined) {
        try {
          const updated = scheduleReview(
            {
              easeFactor: currentCard.easeFactor,
              interval: currentCard.interval,
              repetitions: currentCard.repetitions,
              nextReviewAt: currentCard.nextReviewAt,
            },
            quality
          );

          await db.flashcards.update(currentCard.id, {
            easeFactor: updated.easeFactor,
            interval: updated.interval,
            repetitions: updated.repetitions,
            nextReviewAt: updated.nextReviewAt,
          });

          // Track next review date for summary
          if (rating === "again" || rating === "hard") {
            setNextReviewDate(updated.nextReviewAt);
          }
        } catch {
          // Non-critical
        }
      }

      // Advance to next card or finish
      if (currentIndex + 1 >= total) {
        // Award XP + coins on completion
        const xp = Math.max(10, Math.round(total * 5));
        const coins = Math.max(5, Math.round(total * 2));
        addXP(xp);
        addCoins(coins, "flashcard_review");
        setIsDone(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    },
    [currentCard, currentIndex, total, ratings, addXP, addCoins]
  );

  // XP and coins awarded
  const xpEarned = isDone ? Math.max(10, Math.round(total * 5)) : 0;
  const coinsEarned = isDone ? Math.max(5, Math.round(total * 2)) : 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2 className="size-12 text-teal" />
        <p className="font-heading text-xl font-bold">All caught up!</p>
        <p className="text-sm text-muted-foreground">No cards due right now. Come back tomorrow.</p>
      </div>
    );
  }

  if (isDone) {
    return (
      <DeckSummary
        total={total}
        ratings={ratings}
        xpEarned={xpEarned}
        coinsEarned={coinsEarned}
        nextReviewDate={nextReviewDate}
        onDone={onComplete ?? (() => {})}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto w-full">
      <ProgressBar
        current={currentIndex + 1}
        total={total}
        ratings={ratings}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <Flashcard card={currentCard} onRate={handleRate} />
        </motion.div>
      </AnimatePresence>

      {/* Skip button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => handleRate("again")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="size-3" />
          Skip (mark as Again)
        </button>
      </div>
    </div>
  );
}
