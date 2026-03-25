"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { getWeeklyTestQuestions } from "@/lib/review/question-selector";
import { TimedTest, type TestAnswer } from "@/components/features/review/timed-test";
import type { QuizBankQuestion } from "@/lib/content/loader";

const WEEKLY_DURATION_SECONDS = 30 * 60; // 30 minutes
const WEEKLY_XP = 50;
const WEEKLY_COINS = 10;
const QUESTION_COUNT = 20;

export default function WeeklyTestPage() {
  const router = useRouter();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);

  const [questions, setQuestions] = useState<QuizBankQuestion[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getWeeklyTestQuestions(QUESTION_COUNT)
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
    if (done) return;
    setDone(true);

    const correct = answers.filter((a) => a.isCorrect).length;
    const total = questions?.length ?? QUESTION_COUNT;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Save result to Dexie
    try {
      await db.timedTestResults.add({
        type: "weekly",
        score,
        questionsTotal: total,
        questionsCorrect: correct,
        timeTakenSeconds,
        completedAt: new Date(),
      });
    } catch {
      // Non-critical
    }

    // Award XP + coins
    addXP(WEEKLY_XP);
    addCoins(WEEKLY_COINS, "weekly_test");
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (!questions && !loadError) {
    return (
      <div className="flex flex-col items-center gap-4 py-24">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">
          Selecting questions from your recent topics…
        </p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

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
      <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 px-5 py-4">
        <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-0.5">
          Weekly Review
        </p>
        <h1 className="font-heading text-xl font-bold">Weekly Test</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {questions.length} questions from topics you studied this week
        </p>
      </div>

      <TimedTest
        questions={questions}
        durationSeconds={WEEKLY_DURATION_SECONDS}
        xpReward={WEEKLY_XP}
        coinReward={WEEKLY_COINS}
        title="Weekly Test"
        subtitle={`${questions.length} questions · 30 minutes`}
        onComplete={handleComplete}
      />
    </div>
  );
}
