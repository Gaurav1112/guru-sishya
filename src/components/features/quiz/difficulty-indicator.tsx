"use client";

import { BLOOM_LABELS, type BloomLevel } from "@/lib/quiz/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DifficultyIndicatorProps {
  currentLevel: BloomLevel;
  className?: string;
}

const LEVELS: BloomLevel[] = [1, 2, 3, 4, 5, 6, 7];

export function DifficultyIndicator({
  currentLevel,
  className,
}: DifficultyIndicatorProps) {
  return (
    <TooltipProvider>
      <div
        className={cn("flex items-center gap-1.5", className)}
        aria-label={`Bloom's Level ${currentLevel}: ${BLOOM_LABELS[currentLevel]}`}
      >
        {LEVELS.map((level) => {
          const isActive = level === currentLevel;
          const isFilled = level <= currentLevel;
          return (
            <Tooltip key={level}>
              <TooltipTrigger
                className={cn(
                  "size-2.5 rounded-full transition-all duration-200 cursor-default border-0 bg-transparent p-0",
                  isActive
                    ? "ring-2 ring-saffron ring-offset-1 ring-offset-background scale-125"
                    : "",
                  isFilled ? "!bg-saffron" : "!bg-muted"
                )}
              />
              <TooltipContent side="top">
                <span>
                  Level {level}: {BLOOM_LABELS[level]}
                </span>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <span className="ml-2 text-xs font-medium text-saffron">
          {BLOOM_LABELS[currentLevel]}
        </span>
      </div>
    </TooltipProvider>
  );
}
