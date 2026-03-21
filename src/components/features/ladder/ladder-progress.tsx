"use client";

import { cn } from "@/lib/utils";
import { CheckCircle, Lock, Star } from "lucide-react";

interface LadderProgressProps {
  unlockedLevel: number; // highest level unlocked (1–5)
  currentLevel?: number; // the level the user is currently "at" (1–5)
  masteryEarned?: boolean;
  onSelectLevel?: (level: number) => void;
}

const LEVEL_NAMES = ["Novice", "Adv. Beginner", "Competent", "Proficient", "Expert"];

export function LadderProgress({
  unlockedLevel,
  currentLevel,
  masteryEarned = false,
  onSelectLevel,
}: LadderProgressProps) {
  return (
    <div className="relative flex flex-col items-center gap-0 py-2 select-none">
      {LEVEL_NAMES.map((name, idx) => {
        const level = idx + 1;
        const isCompleted = level < unlockedLevel || (level === 5 && masteryEarned);
        const isCurrent =
          currentLevel !== undefined ? level === currentLevel : level === unlockedLevel;
        const isLocked = level > unlockedLevel;

        return (
          <div key={level} className="flex flex-col items-center">
            {/* Node */}
            <button
              type="button"
              disabled={isLocked}
              onClick={() => onSelectLevel?.(level)}
              className={cn(
                "relative flex size-12 items-center justify-center rounded-full border-2 transition-all duration-200 focus:outline-none",
                isCompleted &&
                  "border-teal bg-teal/20 text-teal hover:bg-teal/30",
                isCurrent && !isCompleted &&
                  "border-saffron bg-saffron/20 text-saffron shadow-[0_0_14px_2px_hsl(16_79%_53%_/_0.35)] animate-pulse",
                isLocked && "border-border bg-card text-muted-foreground cursor-not-allowed opacity-50",
                !isCompleted && !isCurrent && !isLocked &&
                  "border-border bg-card text-muted-foreground hover:border-saffron/50"
              )}
              aria-label={`Level ${level}: ${name}${isLocked ? " (locked)" : ""}`}
            >
              {isCompleted ? (
                <CheckCircle className="size-5" />
              ) : isLocked ? (
                <Lock className="size-4" />
              ) : (
                <span className="text-sm font-bold">{level}</span>
              )}

              {/* Boss battle star */}
              {level === 5 && masteryEarned && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-gold">
                  <Star className="size-2.5 fill-background text-background" />
                </span>
              )}
            </button>

            {/* Label */}
            <span
              className={cn(
                "mt-1 text-[10px] font-medium leading-tight text-center",
                isCompleted && "text-teal",
                isCurrent && !isCompleted && "text-saffron",
                (isLocked || (!isCompleted && !isCurrent)) && "text-muted-foreground"
              )}
            >
              {name}
            </span>

            {/* Connector line (not after last) */}
            {level < 5 && (
              <div
                className={cn(
                  "my-1 w-0.5 h-5 rounded-full",
                  level < unlockedLevel ? "bg-teal/50" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
