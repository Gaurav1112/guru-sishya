"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Swords,
  Trophy,
  BarChart3,
  Star,
  Target,
  Zap,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShareButtons } from "@/components/share-buttons";
import { findTopicContent, type QuizBankQuestion } from "@/lib/content/loader";
import { gradeStaticQuestion } from "@/lib/quiz/static-quiz";
import { AnswerInput } from "@/components/features/quiz/answer-input";
import { QuestionCard } from "@/components/features/quiz/question-card";
import { GradeResult } from "@/components/features/quiz/grade-result";
import { cn } from "@/lib/utils";
import type { GeneratedQuestion, AnsweredQuestion } from "@/lib/quiz/types";

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────
// A pure-JS seeded PRNG so we can reproduce the same question order from a seed.

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shuffle array in-place using a seeded random
function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CHALLENGE_QUESTION_COUNT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(pct: number) {
  if (pct >= 80) return "text-teal";
  if (pct >= 50) return "text-gold";
  return "text-destructive";
}

function outcomeEmoji(mine: number, theirs: number) {
  if (mine > theirs) return "You won!";
  if (mine === theirs) return "It's a tie!";
  return "Keep practicing!";
}

function buildChallengeUrl(topic: string, seed: number, score: number): string {
  if (typeof window === "undefined") return "";
  const base = `${window.location.protocol}//${window.location.host}`;
  const params = new URLSearchParams({
    topic,
    seed: String(seed),
    score: String(score),
  });
  return `${base}/app/challenge?${params.toString()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ScoreComparisonCard({
  myScore,
  friendScore,
  topic,
  seed,
}: {
  myScore: number;
  friendScore: number;
  topic: string;
  seed: number;
}) {
  const myPct = Math.round(myScore * 10);
  const friendPct = Math.round(friendScore * 10);
  const outcome = outcomeEmoji(myPct, friendPct);
  const challengeUrl = buildChallengeUrl(topic, seed, myScore);
  const shareText = `I scored ${myPct}% on the ${topic} quiz on Guru Sishya! Can you beat me?`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col gap-5"
    >
      {/* Outcome header */}
      <div className="text-center">
        <Trophy className="mx-auto mb-2 size-10 text-gold" />
        <h2 className="text-2xl font-heading font-bold">{outcome}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Challenge complete on <span className="font-medium text-foreground">{topic}</span>
        </p>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-saffron/30 bg-saffron/5">
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">You</p>
            <p className={cn("text-4xl font-heading font-bold", scoreColor(myPct))}>
              {myPct}%
            </p>
            <p className="text-xs text-muted-foreground">{myScore.toFixed(1)} avg / 10</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-5 pb-4 flex flex-col items-center gap-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Friend</p>
            <p className={cn("text-4xl font-heading font-bold", scoreColor(friendPct))}>
              {friendPct}%
            </p>
            <p className="text-xs text-muted-foreground">{friendScore.toFixed(1)} avg / 10</p>
          </CardContent>
        </Card>
      </div>

      {/* VS divider label */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          {myPct > friendPct ? "You beat them!" : myPct === friendPct ? "Dead even" : "They beat you"}
        </span>
        <div className="flex-1 h-px bg-border/40" />
      </div>

      {/* Challenge a friend again */}
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        <p className="text-sm font-medium mb-1">Challenge your friends</p>
        <p className="text-xs text-muted-foreground mb-3">
          Share your score and dare them to beat you on{" "}
          <span className="font-medium text-foreground">{topic}</span>.
        </p>
        <ShareButtons shareUrl={challengeUrl} shareText={shareText} />
      </div>
    </motion.div>
  );
}

// ── Phase types ───────────────────────────────────────────────────────────────

type Phase =
  | "landing"
  | "loading"
  | "answering"
  | "grading"
  | "result"
  | "error";

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ChallengePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const topic = searchParams.get("topic") ?? "";
  const seedParam = parseInt(searchParams.get("seed") ?? "0", 10);
  const friendScoreParam = parseFloat(searchParams.get("score") ?? "0");

  // Derive a percent for display on the landing card
  const friendPct = Math.round(friendScoreParam * 10);

  // Quiz state
  const [phase, setPhase] = useState<Phase>("landing");
  const [questions, setQuestions] = useState<QuizBankQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<AnsweredQuestion | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Derived average score (out of 10)
  const averageScore =
    answers.length > 0
      ? answers.reduce((s, a) => s + a.score, 0) / answers.length
      : 0;

  // Validate params
  const isValidParams = topic.length > 0 && seedParam > 0;

  // ── Load questions ───────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    try {
      const content = await findTopicContent(topic);
      if (!content || content.quizBank.length === 0) {
        setErrorMsg(`No quiz questions found for "${topic}". The topic may not be available.`);
        setPhase("error");
        return;
      }

      // Reproduce the same selection as the challenger using the seed
      const rand = mulberry32(seedParam);
      const shuffled = seededShuffle(content.quizBank, rand);
      const picked = shuffled.slice(0, CHALLENGE_QUESTION_COUNT);

      setQuestions(picked);
      setCurrentIndex(0);
      setAnswers([]);
      setCurrentAnswer(null);
      setPhase("answering");
    } catch {
      setErrorMsg("Failed to load quiz questions. Please try again.");
      setPhase("error");
    }
  }, [topic, seedParam]);

  // ── Submit answer ─────────────────────────────────────────────────────────

  function handleAnswer(userAnswer: string) {
    const q = questions[currentIndex];
    if (!q) return;

    const graded = gradeStaticQuestion(q, userAnswer);
    const answered: AnsweredQuestion = {
      question: q.question,
      format: q.format as GeneratedQuestion["format"],
      difficulty: q.difficulty as GeneratedQuestion["difficulty"],
      bloomLabel: q.bloomLabel,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer,
      ...graded,
    };

    setCurrentAnswer(answered);
    setAnswers((prev) => [...prev, answered]);
    setPhase("grading");
  }

  // ── Advance to next question or result ────────────────────────────────────

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setPhase("result");
    } else {
      setCurrentIndex((i) => i + 1);
      setCurrentAnswer(null);
      setPhase("answering");
    }
  }

  // ── Computed helpers ──────────────────────────────────────────────────────

  const currentQuestion: GeneratedQuestion | null = questions[currentIndex]
    ? {
        question: questions[currentIndex].question,
        format: questions[currentIndex].format as GeneratedQuestion["format"],
        difficulty: questions[currentIndex].difficulty as GeneratedQuestion["difficulty"],
        bloomLabel: questions[currentIndex].bloomLabel,
        options: questions[currentIndex].options,
        correctAnswer: questions[currentIndex].correctAnswer,
      }
    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isValidParams) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <Swords className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="font-heading text-2xl font-bold mb-2">Invalid Challenge Link</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This challenge link appears to be missing required parameters.
          Ask your friend to share a fresh challenge link.
        </p>
        <Button onClick={() => router.push("/app/dashboard")}>
          <ArrowLeft className="size-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ── Landing ───────────────────────────────────────────────────────────────

  if (phase === "landing") {
    return (
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col gap-5"
        >
          {/* Header */}
          <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-6 text-center">
            <Swords className="mx-auto mb-3 size-12 text-saffron" />
            <h1 className="font-heading text-2xl font-bold mb-2">You've been challenged!</h1>
            <p className="text-muted-foreground text-sm">
              Your friend scored{" "}
              <span className={cn("font-bold text-lg", scoreColor(friendPct))}>
                {friendPct}%
              </span>{" "}
              on the{" "}
              <span className="font-semibold text-foreground">{topic}</span>{" "}
              quiz on Guru Sishya.
            </p>
            <p className="text-muted-foreground text-sm mt-1 font-medium">
              Can you beat them?
            </p>
          </div>

          {/* Challenge details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="size-4 text-saffron" />
                Challenge Details
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/40 p-3">
                  <BarChart3 className="size-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-bold text-sm">{topic}</p>
                  <p className="text-xs text-muted-foreground">Topic</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <Zap className="size-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="font-bold text-sm">{CHALLENGE_QUESTION_COUNT}</p>
                  <p className="text-xs text-muted-foreground">Questions</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <Star className="size-4 mx-auto mb-1 text-gold fill-gold" />
                  <p className={cn("font-bold text-sm", scoreColor(friendPct))}>
                    {friendPct}%
                  </p>
                  <p className="text-xs text-muted-foreground">To beat</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You'll answer the same {CHALLENGE_QUESTION_COUNT} questions your friend answered,
                in the same order.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Button
            size="lg"
            className="w-full bg-saffron text-background hover:bg-saffron/90 font-bold text-base"
            onClick={loadQuestions}
          >
            <Swords className="size-5" />
            Start Challenge
          </Button>

          <button
            type="button"
            onClick={() => router.push("/app/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
          >
            Not now — go to dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 max-w-xl mx-auto">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">Loading challenge questions…</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (phase === "error") {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="flex size-16 mx-auto mb-4 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/30">
          <Swords className="size-8 text-destructive" />
        </div>
        <h2 className="font-heading text-xl font-bold mb-2">Challenge Unavailable</h2>
        <p className="text-muted-foreground text-sm mb-6">{errorMsg}</p>
        <Button variant="outline" onClick={() => router.push("/app/dashboard")}>
          <ArrowLeft className="size-4" />
          Go to Dashboard
        </Button>
      </div>
    );
  }

  // ── Answering ─────────────────────────────────────────────────────────────

  if (phase === "answering" && currentQuestion) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span className="font-medium text-foreground">
            Question <span className="text-saffron font-bold">{currentIndex + 1}</span>
            <span className="text-muted-foreground font-normal"> of {questions.length}</span>
          </span>
          <span className="flex items-center gap-1">
            <Swords className="size-3 text-saffron" />
            <span>Challenge: {topic}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-saffron"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.question.substring(0, 20)}
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
          />
        </AnimatePresence>
        <AnswerInput question={currentQuestion} onSubmit={handleAnswer} />
      </div>
    );
  }

  // ── Grading ───────────────────────────────────────────────────────────────

  if (phase === "grading") {
    if (!currentAnswer) {
      return (
        <div className="flex flex-col items-center gap-3 py-20 max-w-xl mx-auto">
          <Loader2 className="size-8 animate-spin text-saffron" />
          <p className="text-sm text-muted-foreground">Grading…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <GradeResult
          answer={currentAnswer}
          xpEarned={0}
          onNext={handleNext}
          isLast={currentIndex + 1 >= questions.length}
        />
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────

  if (phase === "result") {
    return (
      <div className="max-w-xl mx-auto">
        <ScoreComparisonCard
          myScore={averageScore}
          friendScore={friendScoreParam}
          topic={topic}
          seed={seedParam}
        />

        {/* Retry / navigate */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setPhase("landing");
              setAnswers([]);
              setCurrentAnswer(null);
              setCurrentIndex(0);
            }}
          >
            Try Again
          </Button>
          <Button
            className="flex-1"
            onClick={() => router.push("/app/dashboard")}
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
