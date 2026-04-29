"use client";

import { cn } from "@/lib/utils";

interface QuestionStatus {
  index: number;
  answered: boolean;
  correct: boolean | null;
  bookmarked: boolean;
}

interface QuestionNavigatorProps {
  questions: QuestionStatus[];
  currentIndex: number;
  onJump: (index: number) => void;
}

export function QuestionNavigator({ questions, currentIndex, onJump }: QuestionNavigatorProps) {
  return (
    <nav aria-label="Question navigator" className="flex items-center gap-1.5 flex-wrap px-2 py-2 bg-surface/50 rounded-lg border border-border/30">
      {questions.map((q) => (
        <button
          key={q.index}
          onClick={() => onJump(q.index)}
          className={cn(
            "size-7 rounded-full text-[10px] font-bold transition-all flex items-center justify-center",
            q.index === currentIndex && "ring-2 ring-saffron ring-offset-1 ring-offset-background",
            q.bookmarked && "ring-2 ring-gold",
            !q.answered && "bg-muted text-muted-foreground",
            q.answered && q.correct === true && "bg-emerald-500/20 text-emerald-400",
            q.answered && q.correct === false && "bg-red-500/20 text-red-400",
          )}
          aria-label={`Question ${q.index + 1}${q.answered ? (q.correct ? ", answered correctly" : ", answered incorrectly") : ", not yet answered"}${q.bookmarked ? ", bookmarked" : ""}${q.index === currentIndex ? ", current question" : ""}`}
          aria-current={q.index === currentIndex ? "step" : undefined}
        >
          {q.index + 1}
        </button>
      ))}
      <input
        type="number"
        min={1}
        max={questions.length}
        placeholder="#"
        aria-label="Jump to question number"
        className="w-10 h-7 text-[10px] text-center bg-muted rounded border border-border/50 text-foreground"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const val = parseInt((e.target as HTMLInputElement).value, 10);
            if (val >= 1 && val <= questions.length) {
              onJump(val - 1);
              (e.target as HTMLInputElement).value = "";
            }
          }
        }}
      />
    </nav>
  );
}
