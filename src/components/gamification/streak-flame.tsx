"use client";
import { motion } from "framer-motion";
import { getFlameColor } from "@/lib/gamification/streaks";

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
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

export function StreakFlame({ streak, size = "md" }: StreakFlameProps) {
  const color = getFlameColor(streak);
  const colorClass = FLAME_COLORS[color] ?? FLAME_COLORS.yellow;
  const glowClass = FLAME_GLOW[color] ?? FLAME_GLOW.yellow;
  const { flame: flameSize, count: countSize } = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className={`${flameSize} ${colorClass} ${glowClass}`}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        🔥
      </motion.span>
      <span className={`${countSize} font-bold tabular-nums`}>{streak}</span>
    </div>
  );
}
