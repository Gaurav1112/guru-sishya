"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Zap } from "lucide-react";

interface Props {
  days: number;
}

export function LearningVelocity({ days }: Props) {
  const data = useLiveQuery(async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const attempts = await db.quizAttempts
        .where("completedAt")
        .above(cutoff)
        .toArray();

      const sessions = await db.planSessions
        .where("completedAt")
        .above(cutoff)
        .toArray();

      const byDate = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDate.set(d.toISOString().slice(0, 10), 0);
      }

      for (const a of attempts) {
        const d = new Date(a.completedAt).toISOString().slice(0, 10);
        if (byDate.has(d)) byDate.set(d, (byDate.get(d) ?? 0) + 1);
      }
      for (const s of sessions) {
        if (!s.completedAt) continue;
        const d = new Date(s.completedAt).toISOString().slice(0, 10);
        if (byDate.has(d)) byDate.set(d, (byDate.get(d) ?? 0) + 1);
      }

      return Array.from(byDate.entries()).map(([date, count]) => ({ date, count }));
    } catch (err) {
      console.error("[LearningVelocity] query error:", err);
      return [];
    }
  }, [days]);

  if (!data) return null;

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-gold" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Learning Velocity
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="tabular-nums font-semibold">{total}</span>
          <span className="text-muted-foreground">activities</span>
          <span className="tabular-nums font-semibold">{activeDays}</span>
          <span className="text-muted-foreground">active days</span>
        </div>
      </div>
      <div className="flex items-end gap-[2px] h-20">
        {data.map((d) => {
          const h = d.count > 0 ? Math.max(8, (d.count / maxCount) * 100) : 4;
          return (
            <div
              key={d.date}
              className="flex-1 rounded-t transition-all duration-300"
              style={{
                height: `${h}%`,
                backgroundColor:
                  d.count === 0
                    ? "var(--color-muted)"
                    : d.count >= maxCount * 0.75
                      ? "#1DD1A1"
                      : d.count >= maxCount * 0.4
                        ? "#FDB813"
                        : "#E85D26",
                opacity: d.count === 0 ? 0.15 : 0.8,
              }}
              title={`${d.date}: ${d.count} activities`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
