"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { number: 1, label: "Prime" },
  { number: 2, label: "Teach" },
  { number: 3, label: "Recall" },
  { number: 4, label: "Probe" },
  { number: 5, label: "Struggle" },
  { number: 6, label: "Re-teach" },
  { number: 7, label: "Verify" },
];

interface PhaseIndicatorProps {
  currentPhase: number;
  round: number;
  maxRounds?: number;
}

export function PhaseIndicator({
  currentPhase,
  round,
  maxRounds = 4,
}: PhaseIndicatorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {PHASES.map((phase, index) => {
          const isCompleted = currentPhase > phase.number;
          const isCurrent = currentPhase === phase.number;

          return (
            <div key={phase.number} className="flex items-center gap-1.5 shrink-0">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isCompleted &&
                      "bg-teal text-white",
                    isCurrent &&
                      "bg-saffron text-white ring-2 ring-saffron/30",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    phase.number
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    isCurrent ? "text-saffron" : "text-muted-foreground"
                  )}
                >
                  {phase.label}
                </span>
              </div>

              {index < PHASES.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 mt-[-12px] shrink-0 transition-colors",
                    currentPhase > phase.number
                      ? "bg-teal"
                      : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {round > 1 && (
        <p className="text-xs text-muted-foreground text-right">
          Round {round} / {maxRounds}
        </p>
      )}
    </div>
  );
}
