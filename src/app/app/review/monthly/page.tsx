"use client";

import { useEffect, useState } from "react";
import { Loader2, Award, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import {
  getMonthlyTestQuestions,
  computeTopicBreakdown,
  type TopicScoreBreakdown,
} from "@/lib/review/question-selector";
import { TimedTest, type TestAnswer } from "@/components/features/review/timed-test";
import { Button } from "@/components/ui/button";
import type { QuizBankQuestion } from "@/lib/content/loader";

const MONTHLY_DURATION_SECONDS = 60 * 60; // 60 minutes
const MONTHLY_XP = 100;
const MONTHLY_COINS = 50;
const QUESTION_COUNT = 40;

// ── Certificate card ──────────────────────────────────────────────────────────

function CertificateCard({
  score,
  correctCount,
  totalCount,
  timeTakenSeconds,
  breakdown,
}: {
  score: number;
  correctCount: number;
  totalCount: number;
  timeTakenSeconds: number;
  breakdown: TopicScoreBreakdown[];
}) {
  const monthName = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const mins = Math.floor(timeTakenSeconds / 60);
  const secs = timeTakenSeconds % 60;

  const grade =
    score >= 90
      ? { label: "Distinction", color: "text-teal", badge: "🏆" }
      : score >= 70
        ? { label: "Merit", color: "text-saffron", badge: "🥇" }
        : score >= 50
          ? { label: "Pass", color: "text-gold", badge: "🎖️" }
          : { label: "Attempted", color: "text-muted-foreground", badge: "📜" };

  function handleShare() {
    const text = `I scored ${score}% on the Guru Sishya Monthly Test (${monthName})! Grade: ${grade.label} ${grade.badge}`;
    if (navigator.share) {
      navigator.share({ text, title: "Guru Sishya Monthly Test Result" }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      alert("Result copied to clipboard!");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto"
    >
      {/* Certificate */}
      <div className="relative rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/5 via-saffron/5 to-teal/5 p-8 text-center overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-3 left-3 size-6 border-t-2 border-l-2 border-gold/40 rounded-tl-lg" />
        <div className="absolute top-3 right-3 size-6 border-t-2 border-r-2 border-gold/40 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 size-6 border-b-2 border-l-2 border-gold/40 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 size-6 border-b-2 border-r-2 border-gold/40 rounded-br-lg" />

        <Award className="size-12 text-gold mx-auto mb-3" />
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase mb-1">
          Certificate of Completion
        </p>
        <h2 className="font-heading text-2xl font-bold mb-1">
          Monthly Test — {monthName}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Guru Sishya</p>

        <div className="flex flex-col items-center gap-1 mb-6">
          <span className="text-5xl">{grade.badge}</span>
          <span className={`font-heading text-3xl font-bold ${grade.color}`}>
            {score}%
          </span>
          <span className={`font-semibold text-sm ${grade.color}`}>
            {grade.label}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="rounded-xl border border-border bg-surface/60 p-2">
            <p className="font-bold">{correctCount}/{totalCount}</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div className="rounded-xl border border-border bg-surface/60 p-2">
            <p className="font-bold">
              {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
            </p>
            <p className="text-xs text-muted-foreground">Time</p>
          </div>
          <div className="rounded-xl border border-border bg-surface/60 p-2">
            <p className="font-bold">{breakdown.length}</p>
            <p className="text-xs text-muted-foreground">Topics</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="gap-1.5"
        >
          <Share2 className="size-3.5" />
          Share Result
        </Button>
      </div>

      {/* Topic breakdown */}
      {breakdown.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <h3 className="font-semibold text-sm mb-3">Score by Topic</h3>
          <div className="space-y-2">
            {breakdown.map((item) => (
              <div key={item.topicName}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground truncate max-w-[60%]">
                    {item.topicName}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {item.correct}/{item.total} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.percentage >= 70
                        ? "bg-teal"
                        : item.percentage >= 50
                          ? "bg-saffron"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MonthlyTestPage() {
  const router = useRouter();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);

  const [questions, setQuestions] = useState<QuizBankQuestion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Result state (shown after completion)
  const [completedData, setCompletedData] = useState<{
    score: number;
    correctCount: number;
    totalCount: number;
    timeTakenSeconds: number;
    breakdown: TopicScoreBreakdown[];
  } | null>(null);

  useEffect(() => {
    getMonthlyTestQuestions(QUESTION_COUNT)
      .then((qs) => {
        if (qs.length === 0) {
          setLoadError("No questions found. Study some topics first, then come back!");
        } else {
          setQuestions(qs);
        }
      })
      .catch(() => {
        setLoadError("Failed to load questions. Please try again.");
      });
  }, []);

  async function handleComplete(answers: TestAnswer[], timeTakenSeconds: number) {
    if (!questions) return;

    const correct = answers.filter((a) => a.isCorrect).length;
    const total = questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Build a question→topic map from the quiz bank
    // (We don't store per-question topic metadata in the bank, so we use a
    // fallback empty map; the breakdown will group everything under one bucket)
    const questionTopicMap = new Map<number, string>();
    const breakdown = computeTopicBreakdown(questions, answers, questionTopicMap);

    // Save result
    try {
      await db.timedTestResults.add({
        type: "monthly",
        score,
        questionsTotal: total,
        questionsCorrect: correct,
        timeTakenSeconds,
        completedAt: new Date(),
        topicBreakdown: breakdown,
      });
    } catch {
      // Non-critical
    }

    // Award
    addXP(MONTHLY_XP);
    addCoins(MONTHLY_COINS, "monthly_test");

    setCompletedData({ score, correctCount: correct, totalCount: total, timeTakenSeconds, breakdown });
  }

  // ── Completed: show certificate ────────────────────────────────────────────

  if (completedData) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-saffron/5 to-teal/5 px-5 py-4">
          <p className="text-xs font-medium tracking-widest text-gold uppercase mb-0.5">
            Monthly Review
          </p>
          <h1 className="font-heading text-xl font-bold">Test Complete!</h1>
        </div>

        <CertificateCard {...completedData} />

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/app/review")}
            className="text-sm text-saffron hover:underline"
          >
            Back to Review Hub
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!questions && !loadError) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-gold" />
        <p className="text-sm text-muted-foreground">
          Building your monthly review questions…
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (loadError || !questions) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center max-w-md mx-auto">
        <p className="text-2xl">📚</p>
        <h2 className="font-heading text-lg font-bold">No Questions Available</h2>
        <p className="text-sm text-muted-foreground">
          {loadError ?? "No questions found."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/app/review")}
          className="text-sm text-saffron hover:underline"
        >
          Back to Review Hub
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 via-saffron/5 to-teal/5 px-5 py-4">
        <p className="text-xs font-medium tracking-widest text-gold uppercase mb-0.5">
          Monthly Review
        </p>
        <h1 className="font-heading text-xl font-bold">Monthly Test</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {questions.length} questions from all topics studied this month
        </p>
      </div>

      <TimedTest
        questions={questions}
        durationSeconds={MONTHLY_DURATION_SECONDS}
        xpReward={MONTHLY_XP}
        coinReward={MONTHLY_COINS}
        title="Monthly Test"
        subtitle={`${questions.length} questions · 60 minutes`}
        onComplete={handleComplete}
      />
    </div>
  );
}
