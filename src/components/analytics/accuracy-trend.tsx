"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { TrendingUp } from "lucide-react";

interface Props {
  days: number;
}

interface DayPoint {
  date: string;
  accuracy: number;
  total: number;
}

export function AccuracyTrend({ days }: Props) {
  const points = useLiveQuery(async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const attempts = await db.quizAttempts
        .where("completedAt")
        .above(cutoff)
        .toArray();

      const byDate = new Map<string, { scoreSum: number; count: number }>();

      for (const a of attempts) {
        const d = new Date(a.completedAt).toISOString().slice(0, 10);
        const entry = byDate.get(d) ?? { scoreSum: 0, count: 0 };
        entry.scoreSum += a.score;
        entry.count += 1;
        byDate.set(d, entry);
      }

      const result: DayPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const entry = byDate.get(key);
        result.push({
          date: key,
          accuracy: entry && entry.count > 0
            ? Math.round(entry.scoreSum / entry.count)
            : -1,
          total: entry?.count ?? 0,
        });
      }
      return result;
    } catch (err) {
      console.error("[AccuracyTrend] query error:", err);
      return [];
    }
  }, [days]);

  if (!points) return <ChartSkeleton />;

  const valid = points.filter((p) => p.accuracy >= 0);
  if (valid.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="size-4 text-teal" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Accuracy Trend
          </p>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          Complete some quizzes to see your accuracy trend
        </p>
      </div>
    );
  }

  const W = 400;
  const H = 160;
  const PAD = 24;
  const maxAcc = 100;

  const xStep = valid.length > 1 ? (W - PAD * 2) / (valid.length - 1) : 0;
  const coords = valid.map((p, i) => ({
    x: PAD + i * xStep,
    y: PAD + ((maxAcc - p.accuracy) / maxAcc) * (H - PAD * 2),
    ...p,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const areaPoints = `${coords[0].x},${H - PAD} ${linePoints} ${coords[coords.length - 1].x},${H - PAD}`;

  const avg = Math.round(valid.reduce((s, p) => s + p.accuracy, 0) / valid.length);

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-teal" />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Accuracy Trend
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums">
          {avg}% <span className="text-xs text-muted-foreground font-normal">avg</span>
        </p>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1DD1A1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#1DD1A1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((v) => {
          const y = PAD + ((100 - v) / 100) * (H - PAD * 2);
          return (
            <g key={v}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="currentColor" strokeOpacity={0.08} />
              <text x={PAD - 4} y={y + 3} textAnchor="end" fill="currentColor" fillOpacity={0.3} fontSize={9}>
                {v}%
              </text>
            </g>
          );
        })}
        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline points={linePoints} fill="none" stroke="#1DD1A1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={3} fill="#1DD1A1" stroke="#0C0A15" strokeWidth={1.5} />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
        <span>{valid[0].date.slice(5)}</span>
        <span>{valid[valid.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="h-4 w-32 bg-muted/30 rounded mb-3" />
      <div className="h-32 bg-muted/10 rounded animate-pulse" />
    </div>
  );
}
