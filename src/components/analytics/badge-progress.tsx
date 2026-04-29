"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BADGE_DEFINITIONS } from "@/lib/gamification/badges";
import { Award } from "lucide-react";

export function BadgeProgress() {
  const earnedBadges = useLiveQuery(async () => {
    try {
      return await db.badges.toArray();
    } catch (err) {
      console.error("[BadgeProgress] query error:", err);
      return [];
    }
  }, []);

  if (!earnedBadges) return null;

  const earnedIds = new Set(earnedBadges.map((b) => b.type));
  const total = BADGE_DEFINITIONS.length;
  const earned = earnedBadges.length;
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  const categories = ["consistency", "mastery", "speed", "exploration", "social"] as const;

  const catStats = categories.map((cat) => {
    const defs = BADGE_DEFINITIONS.filter((b) => b.category === cat);
    const earnedCount = defs.filter((b) => earnedIds.has(b.id)).length;
    return { cat, total: defs.length, earned: earnedCount };
  });

  const catLabels: Record<string, string> = {
    consistency: "Consistency",
    mastery: "Mastery",
    speed: "Speed",
    exploration: "Exploration",
    social: "Social",
  };

  const catColors: Record<string, string> = {
    consistency: "bg-saffron",
    mastery: "bg-teal",
    speed: "bg-gold",
    exploration: "bg-indigo",
    social: "bg-pink-400",
  };

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-gold" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Badge Collection
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {earned}/{total}{" "}
          <span className="text-xs text-muted-foreground font-normal">({pct}%)</span>
        </p>
      </div>

      <div className="h-2 w-full rounded-full bg-muted/20 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-2">
        {catStats.map((cs) => {
          const catPct = cs.total > 0 ? Math.round((cs.earned / cs.total) * 100) : 0;
          return (
            <div key={cs.cat}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs">{catLabels[cs.cat]}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {cs.earned}/{cs.total}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/20 overflow-hidden">
                <div
                  className={`h-full rounded-full ${catColors[cs.cat]} transition-all duration-500`}
                  style={{ width: `${catPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
