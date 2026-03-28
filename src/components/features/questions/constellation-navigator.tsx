"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ConstellationNavigatorProps {
  categories: { name: string; count: number }[];
  activeCategory: string;
  questions: {
    index: number;
    questionText?: string;
    status: "unseen" | "known" | "review";
    bookmarked: boolean;
  }[];
  currentIndex: number;
  onSelectCategory: (cat: string) => void;
  onSelectQuestion: (index: number) => void;
  className?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a 2-letter abbreviation from a category name. */
function abbrev(name: string): string {
  if (name === "All Questions") return "All";
  const words = name.replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Completion ratio for a set of questions. */
function completionRatio(
  questions: ConstellationNavigatorProps["questions"]
): number {
  if (questions.length === 0) return 0;
  const done = questions.filter((q) => q.status === "known").length;
  return done / questions.length;
}

// Window size for question nodes (max DOM nodes)
const WINDOW_SIZE = 50;
const NODE_HEIGHT = 44; // height of each question row (fits number + truncated text)

// ── Component ────────────────────────────────────────────────────────────────

export function ConstellationNavigator({
  categories,
  activeCategory,
  questions,
  currentIndex,
  onSelectCategory,
  onSelectQuestion,
  className,
}: ConstellationNavigatorProps) {
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<HTMLInputElement>(null);

  // When activeCategory changes externally, reset drill view
  useEffect(() => {
    setDrillCategory(null);
  }, [activeCategory]);

  // ── Windowed question list ───────────────────────────────────────────────

  const { windowStart, windowEnd, windowedQuestions } = useMemo(() => {
    if (questions.length <= WINDOW_SIZE) {
      return {
        windowStart: 0,
        windowEnd: questions.length,
        windowedQuestions: questions,
      };
    }
    const half = Math.floor(WINDOW_SIZE / 2);
    let start = Math.max(0, currentIndex - half);
    let end = start + WINDOW_SIZE;
    if (end > questions.length) {
      end = questions.length;
      start = Math.max(0, end - WINDOW_SIZE);
    }
    return {
      windowStart: start,
      windowEnd: end,
      windowedQuestions: questions.slice(start, end),
    };
  }, [questions, currentIndex]);

  // Auto-scroll to keep the current question visible
  useEffect(() => {
    if (!drillCategory || !scrollRef.current) return;
    const container = scrollRef.current;
    const relativeIndex = currentIndex - windowStart;
    const targetTop = relativeIndex * NODE_HEIGHT;
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;

    if (
      targetTop < scrollTop + NODE_HEIGHT ||
      targetTop > scrollTop + containerHeight - NODE_HEIGHT * 2
    ) {
      container.scrollTo({
        top: Math.max(0, targetTop - containerHeight / 2 + NODE_HEIGHT),
        behavior: "smooth",
      });
    }
  }, [currentIndex, drillCategory, windowStart]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCategoryClick = useCallback(
    (catName: string) => {
      onSelectCategory(catName);
      // Small delay so the parent updates questions, then drill in
      requestAnimationFrame(() => setDrillCategory(catName));
    },
    [onSelectCategory]
  );

  const handleBack = useCallback(() => {
    setDrillCategory(null);
  }, []);

  const handleJump = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const val = parseInt((e.target as HTMLInputElement).value, 10);
        if (!isNaN(val) && val >= 1 && val <= questions.length) {
          onSelectQuestion(val - 1);
        }
        (e.target as HTMLInputElement).value = "";
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === "Escape") {
        (e.target as HTMLInputElement).blur();
      }
    },
    [onSelectQuestion, questions.length]
  );

  // ── Stats ────────────────────────────────────────────────────────────────

  const knownCount = useMemo(
    () => questions.filter((q) => q.status === "known").length,
    [questions]
  );
  const reviewCount = useMemo(
    () => questions.filter((q) => q.status === "review").length,
    [questions]
  );

  // ── Render ───────────────────────────────────────────────────────────────

  const showArc = drillCategory !== null;

  return (
    <div
      className={cn(
        "select-none rounded-2xl border border-border/30 bg-surface/80 backdrop-blur-sm shadow-xl overflow-hidden",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {showArc ? (
          /* ── Level 2: Question Arc ──────────────────────────────── */
          <motion.div
            key="arc"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Back button + counter */}
            <div className="px-3 py-2 border-b border-border/30">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
              >
                <ChevronLeft className="size-3" />
                Categories
              </button>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-saffron">
                  Q{currentIndex + 1}{" "}
                  <span className="text-muted-foreground font-normal">
                    of {questions.length}
                  </span>
                </span>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-teal">{knownCount} done</span>
                  <span className="text-gold">{reviewCount} rev</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {drillCategory}
              </p>
            </div>

            {/* Scrollable question nodes */}
            <div
              ref={scrollRef}
              className="overflow-y-auto overscroll-contain"
              style={{
                maxHeight: 9 * NODE_HEIGHT,
                scrollbarWidth: "none",
              }}
            >
              {/* Top spacer for windowed rendering */}
              {windowStart > 0 && (
                <div style={{ height: windowStart * NODE_HEIGHT }} />
              )}

              {windowedQuestions.map((q, i) => {
                const globalIndex = windowStart + i;
                const isCurrent = globalIndex === currentIndex;

                return (
                  <motion.button
                    key={globalIndex}
                    type="button"
                    onClick={() => onSelectQuestion(globalIndex)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: Math.min(i * 0.012, 0.4),
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 transition-colors duration-150",
                      isCurrent && "bg-saffron/15",
                      !isCurrent && "hover:bg-muted/20"
                    )}
                    style={{ height: NODE_HEIGHT }}
                  >
                    {/* Node circle */}
                    <span
                      className={cn(
                        "shrink-0 inline-flex items-center justify-center rounded-full font-mono text-[11px] font-semibold transition-all duration-200",
                        isCurrent
                          ? "size-9 bg-saffron/20 text-saffron ring-2 ring-saffron constellation-active"
                          : "size-7",
                        !isCurrent &&
                          q.status === "unseen" &&
                          "bg-muted/30 text-muted-foreground",
                        !isCurrent &&
                          q.status === "known" &&
                          "bg-teal/20 text-teal",
                        !isCurrent &&
                          q.status === "review" &&
                          "bg-gold/20 text-gold",
                        q.bookmarked &&
                          !isCurrent &&
                          "ring-1 ring-indigo/40"
                      )}
                    >
                      {globalIndex + 1}
                    </span>

                    {/* Question text */}
                    <span className={cn(
                      "flex-1 text-[11px] leading-tight truncate",
                      isCurrent ? "text-saffron font-medium" : "text-muted-foreground"
                    )}>
                      {q.questionText || `Question ${globalIndex + 1}`}
                    </span>

                    {/* Status badge */}
                    {q.status !== "unseen" && (
                      <span className={cn(
                        "shrink-0 text-[9px] px-1.5 py-0.5 rounded-full",
                        q.status === "known" && "bg-teal/10 text-teal",
                        q.status === "review" && "bg-gold/10 text-gold",
                      )}>
                        {q.status === "known" ? "✓" : "⟳"}
                      </span>
                    )}
                    {q.bookmarked && q.status === "unseen" && (
                      <span className="shrink-0 text-[9px] text-indigo">★</span>
                    )}
                  </motion.button>
                );
              })}

              {/* Bottom spacer for windowed rendering */}
              {windowEnd < questions.length && (
                <div
                  style={{
                    height: (questions.length - windowEnd) * NODE_HEIGHT,
                  }}
                />
              )}
            </div>

            {/* Quick-jump input */}
            <div className="px-3 py-2 border-t border-border/30 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                Jump to:
              </span>
              <input
                ref={jumpRef}
                type="number"
                min={1}
                max={questions.length}
                placeholder="#"
                onKeyDown={handleJump}
                className="w-14 rounded border border-border/50 bg-background px-1.5 py-1 text-xs text-center placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-saffron/40 focus:border-saffron/40"
              />
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-3 px-3 py-1.5 border-t border-border/30">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="size-2 rounded-full bg-teal/40" /> Known
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="size-2 rounded-full bg-gold/40" /> Review
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="size-2 rounded-full bg-indigo/40" /> Saved
              </span>
            </div>
          </motion.div>
        ) : (
          /* ── Level 1: Category Ring ─────────────────────────────── */
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-border/30">
              <span className="text-xs font-semibold text-foreground">
                Categories
              </span>
              <p className="text-[10px] text-muted-foreground">
                {categories.length} topics — tap to explore
              </p>
            </div>

            {/* Category list */}
            <div
              className="overflow-y-auto overscroll-contain py-1"
              style={{ maxHeight: 10 * 48, scrollbarWidth: "none" }}
            >
              {categories.map((cat, i) => {
                const isActive = cat.name === activeCategory;
                // Compute per-category completion (rough: uses proportion of all questions)
                const ratio = cat.count > 0 ? Math.min(1, completionRatio(questions) * (questions.length / cat.count)) : 0;
                // Determine color by ratio
                const ringColor =
                  ratio >= 0.8
                    ? "ring-teal"
                    : ratio > 0
                      ? "ring-gold"
                      : "ring-muted/40";

                return (
                  <motion.button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat.name)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.03,
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 transition-colors duration-150",
                      isActive
                        ? "bg-saffron/10"
                        : "hover:bg-muted/20"
                    )}
                  >
                    {/* Circle node */}
                    <span
                      className={cn(
                        "shrink-0 size-10 rounded-full inline-flex items-center justify-center text-[11px] font-bold ring-2 transition-all duration-200",
                        isActive
                          ? "bg-saffron/20 text-saffron ring-saffron constellation-active"
                          : cn("bg-muted/20 text-muted-foreground", ringColor)
                      )}
                    >
                      {abbrev(cat.name)}
                    </span>

                    {/* Name + count + progress bar */}
                    <div className="flex-1 min-w-0 text-left">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isActive
                            ? "text-saffron"
                            : "text-foreground/80"
                        )}
                      >
                        {cat.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {cat.count}q
                        </span>
                        {/* Mini progress bar */}
                        <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              ratio >= 0.8
                                ? "bg-teal"
                                : ratio > 0
                                  ? "bg-gold"
                                  : "bg-muted/50"
                            )}
                            style={{
                              width: `${Math.max(ratio > 0 ? 4 : 0, ratio * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
