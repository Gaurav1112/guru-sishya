"use client";
import { motion } from "framer-motion";
import { getLevelInfo, xpProgressInLevel } from "@/lib/gamification/xp";

interface XPBarProps {
  totalXP: number;
  level: number;
}

export function XPBar({ totalXP, level }: XPBarProps) {
  const levelInfo = getLevelInfo(level);
  const progress = xpProgressInLevel(totalXP);

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80 truncate max-w-[100px]">
          {levelInfo.tier} {levelInfo.subLevel}
        </span>
        <span className="tabular-nums">{progress.current}/{progress.needed} XP</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-saffron"
          initial={false}
          animate={{ width: `${progress.percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}
