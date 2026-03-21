"use client";

import { cn } from "@/lib/utils";
import type { MasteryScores } from "@/lib/types";

interface MasteryDisplayProps {
  scores: MasteryScores;
}

interface DimensionRowProps {
  label: string;
  value: number;
  max: number;
  target: number;
  unit?: string;
}

function DimensionRow({ label, value, max, target, unit = "" }: DimensionRowProps) {
  const percent = Math.round((value / max) * 100);
  const targetPercent = Math.round((target / max) * 100);
  const isNotStarted = value === 0;
  const isMet = value >= target;
  const isClose = !isMet && percent >= targetPercent - 20;

  const barColor = isNotStarted
    ? "bg-muted"
    : isMet
    ? "bg-teal"
    : isClose
    ? "bg-gold"
    : "bg-saffron/60";

  const labelColor = isNotStarted
    ? "text-muted-foreground"
    : isMet
    ? "text-teal"
    : isClose
    ? "text-gold"
    : "text-foreground";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className={cn("font-medium", labelColor)}>{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {value}
          {unit} / {max}
          {unit}
          {isMet && (
            <span className="ml-1 text-teal font-semibold">✓</span>
          )}
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barColor)}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-0 h-full w-px bg-border"
          style={{ left: `${targetPercent}%` }}
        />
      </div>
    </div>
  );
}

export function MasteryDisplay({ scores }: MasteryDisplayProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 flex flex-col gap-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Mastery Scores
      </p>
      <DimensionRow
        label="Completeness"
        value={scores.completeness}
        max={100}
        target={90}
        unit="%"
      />
      <DimensionRow
        label="Accuracy"
        value={scores.accuracy}
        max={10}
        target={8}
      />
      <DimensionRow
        label="Depth"
        value={scores.depth}
        max={10}
        target={7}
      />
      <DimensionRow
        label="Originality"
        value={scores.originality}
        max={1}
        target={1}
        unit=" pt"
      />
    </div>
  );
}
