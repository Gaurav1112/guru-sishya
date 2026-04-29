"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BarChart3 } from "lucide-react";

interface CategoryStat {
  label: string;
  correct: number;
  incorrect: number;
  total: number;
}

export function QuizBreakdown() {
  const stats = useLiveQuery(async () => {
    try {
      const attempts = await db.quizAttempts.toArray();
      const topics = await db.topics.toArray();
      const topicMap = new Map(topics.map((t) => [t.id!, t.category]));

      const catMap = new Map<string, { scoreSum: number; count: number }>();

      for (const a of attempts) {
        const cat = topicMap.get(a.topicId) ?? "Other";
        const simplified =
          cat.includes("System Design") && cat.includes("Cases")
            ? "Case Studies"
            : cat.includes("System Design")
              ? "System Design"
              : cat.includes("Data Structures") || cat.includes("Algorithm")
                ? "DS & Algo"
                : cat.includes("Programming") || cat.includes("Language")
                  ? "Languages"
                  : "Core CS";

        const entry = catMap.get(simplified) ?? { scoreSum: 0, count: 0 };
        entry.scoreSum += a.score;
        entry.count += 1;
        catMap.set(simplified, entry);
      }

      const result: CategoryStat[] = [];
      for (const [label, s] of catMap) {
        const avg = s.count > 0 ? Math.round(s.scoreSum / s.count) : 0;
        result.push({
          label,
          correct: avg,
          incorrect: 100 - avg,
          total: s.count,
        });
      }
      return result.sort((a, b) => b.total - a.total);
    } catch (err) {
      console.error("[QuizBreakdown] query error:", err);
      return [];
    }
  }, []);

  if (!stats) return null;

  const maxTotal = Math.max(...(stats.map((s) => s.total) ?? [1]), 1);

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="size-4 text-indigo" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Quiz Breakdown by Category
        </p>
      </div>
      {stats.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No quiz data yet
        </p>
      ) : (
        <div className="space-y-3">
          {stats.map((s) => {
            const pct = s.correct; // already a percentage (avg score)
            const barW = (s.total / maxTotal) * 100;
            const correctW = (pct / 100) * barW;
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {s.total} quizzes ({pct}% avg)
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted/20 overflow-hidden">
                  <div className="h-full flex">
                    <div
                      className="h-full bg-teal rounded-l-full transition-all duration-500"
                      style={{ width: `${correctW}%` }}
                    />
                    <div
                      className="h-full bg-red-400/60 transition-all duration-500"
                      style={{ width: `${barW - correctW}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-teal" /> Correct
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400/60" /> Incorrect
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
