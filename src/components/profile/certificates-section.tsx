"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, ChevronRight, Lock } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { findTopicContent } from "@/lib/content/loader";
import type { Topic, QuizAttempt } from "@/lib/types";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface TopicCertStatus {
  topic: Topic;
  accuracy: number;
  questionsAnswered: number;
  eligible: boolean;
  category: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function CertificatesSection() {
  const topics = useLiveQuery(() => db.topics.toArray(), []);
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const isPremium = useStore((s) => s.isPremium);

  const [certStatuses, setCertStatuses] = useState<TopicCertStatus[]>([]);

  useEffect(() => {
    if (!topics || !quizAttempts) return;

    // Group quiz attempts by topicId
    const attemptsByTopic = new Map<number, QuizAttempt[]>();
    for (const attempt of quizAttempts) {
      const existing = attemptsByTopic.get(attempt.topicId) ?? [];
      existing.push(attempt);
      attemptsByTopic.set(attempt.topicId, existing);
    }

    // Calculate cert status for each topic
    const statusPromises = topics.map(async (topic) => {
      const attempts = attemptsByTopic.get(topic.id!) ?? [];
      const attemptCount = attempts.length;
      const totalScore = attempts.reduce((acc, q) => acc + q.score, 0);
      const accuracy =
        attemptCount > 0 ? Math.round(totalScore / attemptCount) : 0;
      const questionsAnswered = attempts.reduce(
        (acc, q) => acc + (q.questions?.length ?? 0),
        0
      );
      const eligible = attemptCount > 0 && accuracy >= 70;

      // Try to get category from content
      let category = topic.category;
      try {
        const content = await findTopicContent(topic.name);
        if (content?.category) category = content.category;
      } catch {
        // Fallback to topic.category
      }

      return { topic, accuracy, questionsAnswered, eligible, category };
    });

    Promise.all(statusPromises).then((statuses) => {
      // Sort: eligible first, then by accuracy descending
      statuses.sort((a, b) => {
        if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
        return b.accuracy - a.accuracy;
      });
      setCertStatuses(statuses);
    });
  }, [topics, quizAttempts]);

  if (!topics || topics.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-surface p-6 text-center">
        <Award className="size-10 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">
          Start exploring topics and take quizzes to earn certificates.
        </p>
      </div>
    );
  }

  const eligibleCount = certStatuses.filter((s) => s.eligible).length;

  return (
    <div className="space-y-3">
      {eligibleCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {eligibleCount} certificate{eligibleCount !== 1 ? "s" : ""} earned
          {!isPremium && (
            <span className="text-saffron ml-1">(Pro feature)</span>
          )}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {certStatuses.map(({ topic, accuracy, questionsAnswered, eligible }) => (
          <Link
            key={topic.id}
            href={
              eligible
                ? `/app/profile/certificate?topicId=${topic.id}`
                : `/app/topic/${topic.id}/quiz`
            }
            className="group flex items-center gap-3 rounded-xl border border-border/50 bg-surface p-4 transition-colors hover:border-saffron/30 hover:bg-saffron/5"
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                eligible
                  ? "bg-[#FDB813]/10 text-[#FDB813]"
                  : "bg-muted/50 text-muted-foreground/40"
              }`}
            >
              {eligible ? (
                <Award className="size-5" />
              ) : (
                <Lock className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{topic.name}</p>
              <p className="text-xs text-muted-foreground">
                {eligible ? (
                  <span className="text-green-400">
                    Earned &middot; {accuracy}% accuracy &middot;{" "}
                    {questionsAnswered} questions
                  </span>
                ) : accuracy > 0 ? (
                  <span>
                    {accuracy}% accuracy (need 70%) &middot;{" "}
                    {questionsAnswered} questions
                  </span>
                ) : (
                  <span>Not attempted yet</span>
                )}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-saffron transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {certStatuses.length === 0 && topics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
          {Array.from({ length: Math.min(4, topics.length) }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface p-4">
              <div className="size-10 shrink-0 rounded-lg bg-muted/30" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-muted/30" />
                <div className="h-3 w-24 rounded bg-muted/20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
