"use client";
import { motion } from "framer-motion";
import { getFlameColor } from "@/lib/gamification/streaks";
import { cn } from "@/lib/utils";

export type StreakStatus = "active" | "at-risk" | "no-freeze";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  freezeCount?: number;
  status?: StreakStatus;
}

const FLAME_COLORS: Record<string, string> = {
  yellow: "text-yellow-400",
  orange: "text-orange-500",
  blue: "text-blue-400",
  purple: "text-purple-400",
  diamond: "text-white",
};

const FLAME_GLOW: Record<string, string> = {
  yellow: "drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]",
  orange: "drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]",
  blue: "drop-shadow-[0_0_6px_rgba(96,165,250,0.7)]",
  purple: "drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]",
  diamond: "drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]",
};

const SIZE_MAP = {
  sm: { flame: "text-lg", count: "text-sm" },
  md: { flame: "text-2xl", count: "text-base" },
  lg: { flame: "text-4xl", count: "text-xl" },
};

const STATUS_DOT: Record<StreakStatus, string> = {
  active: "bg-green-500",
  "at-risk": "bg-yellow-500",
  "no-freeze": "bg-red-500",
};

const STATUS_TITLE: Record<StreakStatus, string> = {
  active: "Active today",
  "at-risk": "At risk \u2014 freeze available",
  "no-freeze": "At risk \u2014 no freeze available",
};

export function StreakFlame({ streak, size = "md", freezeCount, status }: StreakFlameProps) {
  const color = getFlameColor(streak);
  const colorClass = FLAME_COLORS[color] ?? FLAME_COLORS.yellow;
  const glowClass = FLAME_GLOW[color] ?? FLAME_GLOW.yellow;
  const { flame: flameSize, count: countSize } = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-1.5" title={status ? STATUS_TITLE[status] : undefined}>
      <span className="relative inline-flex">
        <motion.span
          className={`${flameSize} ${colorClass} ${glowClass}`}
          animate={streak > 0 ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          🔥
        </motion.span>
        {status && (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-1 ring-background",
              STATUS_DOT[status]
            )}
          />
        )}
      </span>
      <span className={`${countSize} font-bold tabular-nums`}>{streak}</span>
      {freezeCount != null && freezeCount > 0 && (
        <span
          className="flex items-center gap-0.5 text-xs text-cyan-400"
          title={`${freezeCount} streak freeze${freezeCount !== 1 ? "s" : ""} available`}
        >
          <span className="text-sm">&#10052;&#65039;</span>
          <span className="font-semibold tabular-nums">{freezeCount}</span>
        </span>
      )}
    </div>
  );
}
