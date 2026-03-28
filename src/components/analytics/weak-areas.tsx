"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";

interface WeakTopic {
  topicId: number;
  name: string;
  accuracy: number;
  totalQuestions: number; // number of quiz attempts
}

export function WeakAreas() {
  const weakTopics = useLiveQuery(async () => {
    const attempts = await db.quizAttempts.toArray();
    const topics = await db.topics.toArray();
    const topicMap = new Map(topics.map((t) => [t.id!, t.name]));

    const byTopic = new Map<number, { scoreSum: number; count: number }>();

    for (const a of attempts) {
      const entry = byTopic.get(a.topicId) ?? { scoreSum: 0, count: 0 };
      entry.scoreSum += a.score;
      entry.count += 1;
      byTopic.set(a.topicId, entry);
    }

    const result: WeakTopic[] = [];
    for (const [topicId, stats] of byTopic) {
      if (stats.count < 2) continue;
      const accuracy = Math.round(stats.scoreSum / stats.count);
      if (accuracy < 60) {
        result.push({
          topicId,
          name: topicMap.get(topicId) ?? `Topic ${topicId}`,
          accuracy,
          totalQuestions: stats.count,
        });
      }
    }

    return result.sort((a, b) => a.accuracy - b.accuracy);
  }, []);

  if (!weakTopics) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="size-4 text-gold" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Weak Areas
        </p>
      </div>
      {weakTopics.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No weak areas detected — keep going!
        </p>
      ) : (
        <div className="space-y-2">
          {weakTopics.slice(0, 8).map((t) => (
            <Link
              key={t.topicId}
              href={`/app/topic/${t.topicId}/quiz`}
              className="flex items-center gap-3 rounded-lg border border-border/30 px-3 py-2 hover:bg-surface-hover transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {t.totalQuestions} quiz attempts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold tabular-nums ${
                    t.accuracy < 30
                      ? "text-red-400"
                      : t.accuracy < 50
                        ? "text-gold"
                        : "text-saffron"
                  }`}
                >
                  {t.accuracy}%
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-saffron transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
