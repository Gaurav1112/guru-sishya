"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuestionTileStatus {
  index: number;
  questionId: number;
  status: "unseen" | "known" | "review";
  bookmarked: boolean;
}

interface QuestionGalleryProps {
  questions: QuestionTileStatus[];
  currentIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

export function QuestionGallery({
  questions,
  currentIndex,
  onSelect,
  className,
}: QuestionGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to keep current question visible
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentIndex]);

  return (
    <div
      className={cn(
        "bg-surface/80 backdrop-blur-sm border border-border/30 rounded-2xl shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Questions
          </span>
          <span className="text-xs font-semibold text-saffron">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* Scrollable grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto p-2 max-h-[60vh]"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="grid grid-cols-5 gap-1.5">
          {questions.map((q) => (
            <motion.button
              key={q.index}
              ref={q.index === currentIndex ? activeRef : undefined}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onSelect(q.index)}
              className={cn(
                "size-9 rounded-lg text-[11px] font-bold transition-all",
                "flex items-center justify-center",
                // Current question
                q.index === currentIndex &&
                  "ring-2 ring-saffron bg-saffron/20 text-saffron",
                // Status colors (when not current)
                q.index !== currentIndex &&
                  q.status === "unseen" &&
                  "bg-muted/50 text-muted-foreground hover:bg-muted",
                q.index !== currentIndex &&
                  q.status === "known" &&
                  "bg-emerald-500/15 text-emerald-400",
                q.index !== currentIndex &&
                  q.status === "review" &&
                  "bg-amber-500/15 text-amber-400",
                // Bookmarked
                q.bookmarked && "ring-1 ring-gold/50"
              )}
            >
              {q.index + 1}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-2 border-t border-border/30 flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-muted" /> Unseen
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-emerald-500/30" /> Known
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-amber-500/30" /> Review
        </span>
      </div>
    </div>
  );
}
