"use client";
import type { BadgeDefinition } from "@/lib/gamification/badges";

interface BadgeCardProps {
  badge: BadgeDefinition;
  unlocked: boolean;
  unlockedAt?: Date;
}

export function BadgeCard({ badge, unlocked, unlockedAt }: BadgeCardProps) {
  if (unlocked) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-gold/30 bg-surface p-4 shadow-[0_0_12px_rgba(234,179,8,0.12)] transition-shadow hover:shadow-[0_0_20px_rgba(234,179,8,0.25)]">
        <span className="text-3xl">{badge.icon}</span>
        <div className="text-center">
          <p className="font-heading text-sm font-bold text-gold leading-tight">{badge.name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
          {unlockedAt && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              {unlockedAt.toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-surface/50 p-4 opacity-50">
      <span className="text-3xl grayscale">{badge.icon}</span>
      <div className="text-center">
        <p className="font-heading text-sm font-bold text-muted-foreground leading-tight">???</p>
        <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 italic">{badge.hint}</p>
      </div>
    </div>
  );
}
