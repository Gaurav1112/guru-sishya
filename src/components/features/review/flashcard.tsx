"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Flashcard as FlashcardType } from "@/lib/types";

// ── Rating button ─────────────────────────────────────────────────────────────

interface RatingButtonProps {
  label: string;
  sublabel: string;
  onClick: () => void;
  colorClass: string;
}

function RatingButton({ label, sublabel, onClick, colorClass }: RatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl border px-3 py-3 text-center transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]",
        colorClass
      )}
    >
      <p className="font-semibold text-sm">{label}</p>
      <p className="text-[10px] mt-0.5 opacity-70">{sublabel}</p>
    </button>
  );
}

// ── Card face ─────────────────────────────────────────────────────────────────

interface CardFaceProps {
  content: string;
  label: string;
  labelColor: string;
}

function CardFace({ content, label, labelColor }: CardFaceProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
      <span
        className={cn(
          "text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border",
          labelColor
        )}
      >
        {label}
      </span>
      <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed max-w-sm">
        {content}
      </p>
    </div>
  );
}

// ── Main flashcard ────────────────────────────────────────────────────────────

export type DifficultyRating = "easy" | "good" | "hard" | "again";

interface FlashcardProps {
  card: FlashcardType;
  onRate: (rating: DifficultyRating) => void;
}

export function Flashcard({ card, onRate }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRatings, setShowRatings] = useState(false);

  const handleFlip = useCallback(() => {
    if (isFlipped) return;
    setIsFlipped(true);
    // Short delay so user sees the answer before rating buttons appear
    setTimeout(() => setShowRatings(true), 300);
  }, [isFlipped]);

  const handleRate = useCallback(
    (rating: DifficultyRating) => {
      setIsFlipped(false);
      setShowRatings(false);
      onRate(rating);
    },
    [onRate]
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto select-none">
      {/* Card container */}
      <div
        className="relative h-64 cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label={isFlipped ? "Card showing answer" : "Click to reveal answer"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleFlip();
        }}
      >
        {/* Inner wrapper — rotates */}
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 rounded-2xl border border-border bg-surface shadow-md"
            style={{ backfaceVisibility: "hidden" }}
          >
            <CardFace
              content={card.front}
              label="Question"
              labelColor="border-saffron/40 text-saffron bg-saffron/10"
            />
            <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-muted-foreground">
              Tap to reveal answer
            </p>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 rounded-2xl border border-teal/30 bg-teal/5 shadow-md"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardFace
              content={card.back}
              label="Answer"
              labelColor="border-teal/40 text-teal bg-teal/10"
            />
          </div>
        </motion.div>
      </div>

      {/* Rating buttons — slide up after flip */}
      <AnimatePresence>
        {showRatings && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25 }}
            className="space-y-2"
          >
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wider">
              How well did you know this?
            </p>
            <div className="flex gap-2">
              <RatingButton
                label="Again"
                sublabel="Didn't know"
                onClick={() => handleRate("again")}
                colorClass="border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
              />
              <RatingButton
                label="Hard"
                sublabel="Struggled"
                onClick={() => handleRate("hard")}
                colorClass="border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
              />
              <RatingButton
                label="Good"
                sublabel="Got it"
                onClick={() => handleRate("good")}
                colorClass="border-saffron/40 bg-saffron/10 text-saffron hover:bg-saffron/20"
              />
              <RatingButton
                label="Easy"
                sublabel="Perfect"
                onClick={() => handleRate("easy")}
                colorClass="border-teal/40 bg-teal/10 text-teal hover:bg-teal/20"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint when not yet flipped */}
      {!isFlipped && (
        <p className="text-xs text-center text-muted-foreground">
          Swipe left = Again &middot; Swipe right = Easy
        </p>
      )}
    </div>
  );
}
