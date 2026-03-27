"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface QuestionTileStatus {
  index: number;
  questionId: number;
  status: "unseen" | "known" | "review";
  bookmarked: boolean;
}

interface QuestionGridProps {
  questions: QuestionTileStatus[];
  currentIndex: number;
  onSelect: (index: number) => void;
  totalAll?: number; // total before filtering
  categoryName?: string;
  className?: string;
}

export function QuestionGrid({
  questions,
  currentIndex,
  onSelect,
  totalAll,
  categoryName,
  className,
}: QuestionGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentIndex]);

  const known = questions.filter((q) => q.status === "known").length;
  const review = questions.filter((q) => q.status === "review").length;

  return (
    <div className={cn("bg-surface/80 backdrop-blur-sm border border-border/30 rounded-2xl shadow-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/30 space-y-1">
        {categoryName && (
          <div className="text-[11px] text-muted-foreground truncate">{categoryName}</div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-saffron">
            Q{currentIndex + 1} <span className="text-muted-foreground font-normal">of {questions.length}</span>
          </span>
          <div className="flex gap-2 text-[10px]">
            <span className="text-teal">{known} done</span>
            <span className="text-gold">{review} review</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div ref={scrollRef} className="overflow-y-auto p-2" style={{ maxHeight: "55vh", scrollbarWidth: "thin" }}>
        <div className="grid grid-cols-6 gap-1">
          {questions.map((q) => (
            <button
              key={q.index}
              ref={q.index === currentIndex ? activeRef : undefined}
              onClick={() => onSelect(q.index)}
              className={cn(
                "size-8 rounded-lg text-[11px] font-semibold",
                "flex items-center justify-center",
                "transition-transform duration-100 hover:scale-110",
                // Current
                q.index === currentIndex && "ring-2 ring-saffron bg-saffron/20 text-saffron",
                // Status
                q.index !== currentIndex && q.status === "unseen" && "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                q.index !== currentIndex && q.status === "known" && "bg-teal/15 text-teal",
                q.index !== currentIndex && q.status === "review" && "bg-gold/15 text-gold",
                // Bookmarked
                q.bookmarked && q.index !== currentIndex && "ring-1 ring-indigo/40",
              )}
            >
              {q.index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-3 py-1.5 border-t border-border/30 flex gap-3">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-muted/60" /> Unseen
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-teal/30" /> Known
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-gold/30" /> Review
        </span>
      </div>
    </div>
  );
}

// Keep backward-compatible alias so any other file that imports QuestionGallery still compiles.
export { QuestionGrid as QuestionGallery };
