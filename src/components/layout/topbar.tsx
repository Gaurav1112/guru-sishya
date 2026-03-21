"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { CoinDisplay } from "@/components/gamification/coin-display";
import { LevelBadge } from "@/components/gamification/level-badge";

export function Topbar() {
  const { totalXP, level, coins, currentStreak } = useStore();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <Link
        href="/app/dashboard"
        className="font-heading text-lg font-bold text-saffron tracking-wider shrink-0"
      >
        GURU SISHYA
      </Link>

      <div className="flex items-center gap-5">
        <StreakFlame streak={currentStreak} size="sm" />
        <div className="hidden sm:block">
          <XPBar totalXP={totalXP} level={level} />
        </div>
        <CoinDisplay coins={coins} />
        <LevelBadge level={level} size="sm" />
      </div>
    </header>
  );
}
