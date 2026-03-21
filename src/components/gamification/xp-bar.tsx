"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { getLevelInfo, xpProgressInLevel } from "@/lib/gamification/xp";

interface XPBarProps {
  totalXP: number;
  level: number;
}

export function XPBar({ totalXP, level }: XPBarProps) {
  const levelInfo = getLevelInfo(level);
  const progress = xpProgressInLevel(totalXP);

  const springValue = useSpring(progress.percentage, { stiffness: 80, damping: 20 });

  useEffect(() => {
    springValue.set(progress.percentage);
  }, [progress.percentage, springValue]);

  // We use the raw percentage for the Progress component since it expects a static value
  // Framer motion's spring is used for any overlay animation if needed in future

  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80 truncate max-w-[100px]">{levelInfo.tier} {levelInfo.subLevel}</span>
        <span className="tabular-nums">{progress.current}/{progress.needed} XP</span>
      </div>
      <div className="relative">
        <Progress value={progress.percentage} className="h-2" />
      </div>
    </div>
  );
}
