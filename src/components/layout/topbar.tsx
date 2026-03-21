"use client";
import { useStore } from "@/lib/store";
import { getLevelInfo, xpProgressInLevel } from "@/lib/gamification/xp";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function Topbar() {
  const { totalXP, level, coins, currentStreak } = useStore();
  const levelInfo = getLevelInfo(level);
  const xpProgress = xpProgressInLevel(totalXP);
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <Link href="/app/dashboard" className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</Link>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-sm"><span className="text-gold">🔥</span><span className="font-medium">{currentStreak}</span></div>
        <div className="flex items-center gap-2"><div className="w-24"><Progress value={xpProgress.percentage} className="h-2" /></div><span className="text-xs text-muted-foreground">{xpProgress.current}/{xpProgress.needed} XP</span></div>
        <div className="flex items-center gap-1.5 text-sm"><span className="text-gold">🪙</span><span className="font-medium">{coins}</span></div>
        <Badge variant="outline" className="border-saffron/30 text-saffron text-xs">{levelInfo.title}</Badge>
      </div>
    </header>
  );
}
