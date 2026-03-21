"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import Link from "next/link";
import { db } from "@/lib/db";
import { calculateRetention, getDecayState } from "@/lib/spaced-repetition";
import { cn } from "@/lib/utils";
import type { DecayState } from "@/lib/spaced-repetition";
import type { Topic } from "@/lib/types";

// ── Decay state → display config ─────────────────────────────────────────────

const DECAY_CONFIG: Record<
  DecayState,
  { label: string; dot: string; border: string; bg: string; text: string }
> = {
  mastered: {
    label: "Mastered",
    dot: "bg-gold",
    border: "border-gold/40",
    bg: "bg-gold/5",
    text: "text-gold",
  },
  strong: {
    label: "Strong",
    dot: "bg-teal",
    border: "border-teal/40",
    bg: "bg-teal/5",
    text: "text-teal",
  },
  fading: {
    label: "Fading",
    dot: "bg-yellow-400",
    border: "border-yellow-400/40",
    bg: "bg-yellow-400/5",
    text: "text-yellow-400",
  },
  needs_review: {
    label: "Needs Review",
    dot: "bg-saffron",
    border: "border-saffron/40",
    bg: "bg-saffron/5",
    text: "text-saffron",
  },
  forgotten: {
    label: "Forgotten",
    dot: "bg-muted-foreground",
    border: "border-border",
    bg: "bg-muted/30",
    text: "text-muted-foreground",
  },
};

// ── Dreyfus level label ───────────────────────────────────────────────────────

const DREYFUS_LABEL: Record<number, string> = {
  1: "Novice",
  2: "Adv. Beginner",
  3: "Competent",
  4: "Proficient",
  5: "Expert",
};

// ── Per-topic data hook ───────────────────────────────────────────────────────

interface TopicCardData {
  topic: Topic;
  decayState: DecayState;
  highestDreyfusLevel: number;
  retention: number;
}

async function buildTopicData(topic: Topic): Promise<TopicCardData> {
  const id = topic.id!;

  // Get all flashcards for this topic to compute average retention
  const flashcards = await db.flashcards.where("topicId").equals(id).toArray();

  let decayState: DecayState = "forgotten";
  let retention = 0;

  if (flashcards.length > 0) {
    const now = Date.now();
    const retentions = flashcards.map((fc) => {
      const daysSince =
        (now - new Date(fc.nextReviewAt).getTime()) / 86_400_000 +
        fc.interval;
      return calculateRetention(
        Math.max(0, (now - new Date(fc.nextReviewAt).getTime()) / 86_400_000),
        fc.interval,
        fc.easeFactor
      );
    });
    retention =
      retentions.reduce((s, r) => s + r, 0) / retentions.length;
    decayState = retention >= 0.9
      ? "mastered"
      : retention >= 0.7
        ? "strong"
        : retention >= 0.5
          ? "fading"
          : retention >= 0.3
            ? "needs_review"
            : "forgotten";
  } else {
    // No flashcards — check if topic has any quiz attempts as proxy
    const attempts = await db.quizAttempts.where("topicId").equals(id).count();
    if (attempts > 0) {
      decayState = "needs_review";
      retention = 0.35;
    }
  }

  // Highest Dreyfus level from levelProgress
  const progress = await db.levelProgress.where("topicId").equals(id).first();
  const highestDreyfusLevel = progress?.unlockedLevel ?? 1;

  return { topic, decayState, highestDreyfusLevel, retention };
}

// ── Main component ────────────────────────────────────────────────────────────

export function TopicSkillMap() {
  const topics = useLiveQuery(() =>
    db.topics.orderBy("createdAt").reverse().toArray()
  );

  const topicDataList = useLiveQuery(async () => {
    if (!topics) return [];
    return Promise.all(topics.map(buildTopicData));
  }, [topics]);

  if (!topics || !topicDataList) {
    return (
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-muted/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No topics yet. Add a topic to see your Knowledge Map.
      </p>
    );
  }

  // Legend
  const legendItems = Object.entries(DECAY_CONFIG) as [
    DecayState,
    (typeof DECAY_CONFIG)[DecayState],
  ][];

  return (
    <div className="space-y-5">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {legendItems.map(([state, cfg]) => (
          <span key={state} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {topicDataList.map((data, i) => {
          const cfg = DECAY_CONFIG[data.decayState];
          return (
            <motion.div
              key={data.topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <Link href={`/app/topic/${data.topic.id}/ladder`}>
                <div
                  className={cn(
                    "rounded-xl border p-4 transition-colors cursor-pointer",
                    cfg.border,
                    cfg.bg,
                    "hover:brightness-110"
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{data.topic.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {data.topic.category}
                      </p>
                    </div>
                    {/* Decay indicator */}
                    <span
                      className={cn(
                        "shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium",
                        cfg.text,
                        "bg-current/10"
                      )}
                      style={{ backgroundColor: "transparent" }}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                          data.decayState === "mastered" && "bg-gold/15 text-gold",
                          data.decayState === "strong" && "bg-teal/15 text-teal",
                          data.decayState === "fading" && "bg-yellow-400/15 text-yellow-400",
                          data.decayState === "needs_review" && "bg-saffron/15 text-saffron",
                          data.decayState === "forgotten" && "bg-muted text-muted-foreground",
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                      </span>
                    </span>
                  </div>

                  {/* Dreyfus level */}
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                        Dreyfus Level
                      </p>
                      <p className="text-sm font-semibold mt-0.5">
                        {data.highestDreyfusLevel} —{" "}
                        <span className="font-normal text-muted-foreground">
                          {DREYFUS_LABEL[data.highestDreyfusLevel]}
                        </span>
                      </p>
                    </div>

                    {/* Mini progress pips */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((l) => (
                        <div
                          key={l}
                          className={cn(
                            "size-2 rounded-full transition-colors",
                            l < data.highestDreyfusLevel
                              ? "bg-teal"
                              : l === data.highestDreyfusLevel
                                ? "bg-saffron"
                                : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Retention bar (only if we have data) */}
                  {data.retention > 0 && (
                    <div className="mt-2">
                      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            data.retention >= 0.9
                              ? "bg-gold"
                              : data.retention >= 0.7
                                ? "bg-teal"
                                : data.retention >= 0.5
                                  ? "bg-yellow-400"
                                  : data.retention >= 0.3
                                    ? "bg-saffron"
                                    : "bg-muted-foreground"
                          )}
                          style={{ width: `${Math.round(data.retention * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                        {Math.round(data.retention * 100)}% retention
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
