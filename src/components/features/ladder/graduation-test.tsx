"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, Clock, Trophy, XCircle, CheckCircle } from "lucide-react";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/features/quiz/question-card";
import { AnswerInput } from "@/components/features/quiz/answer-input";
import { GradeResult } from "@/components/features/quiz/grade-result";
import { quizQuestionPrompt, quizGradingPrompt } from "@/lib/prompts/quiz-generator";
import type { BloomLevel, GeneratedQuestion, AnsweredQuestion } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";
import { findTopicContent } from "@/lib/content/loader";
import type { QuizBankQuestion } from "@/lib/content/loader";
import { gradeStaticQuestion } from "@/lib/quiz/static-quiz";

// ── Bloom level mapping per Dreyfus level ────────────────────────────────────

// Dreyfus → min Bloom level for question generation
const DREYFUS_TO_BLOOM: Record<number, BloomLevel> = {
  1: 1, // Novice → Remember/Understand
  2: 2, // Advanced Beginner → Understand/Apply
  3: 3, // Competent → Apply/Analyze
  4: 4, // Proficient → Analyze/Evaluate
  5: 5, // Expert → Evaluate/Create/Transfer
};

// Question counts
const STANDARD_COUNT = 5;
const BOSS_COUNT = 10;
const BOSS_DURATION_SECONDS = 15 * 60; // 15 minutes

// Pass threshold: 4/5 standard, 8/10 boss (80%)
const PASS_THRESHOLD = 0.8;

// XP / coins for passing
const PASS_XP = 30;
const PASS_COINS = 15;
const BOSS_PASS_XP = 100;
const BOSS_PASS_COINS = 50;

// Dreyfus level → numeric difficulty range in the quiz bank (1–5 scale)
const DREYFUS_DIFFICULTY_RANGE: Record<number, [number, number]> = {
  1: [1, 2],
  2: [2, 3],
  3: [3, 4],
  4: [4, 5],
  5: [4, 5],
};

// Convert a QuizBankQuestion to the GeneratedQuestion shape used by the UI
function quizBankToGeneratedQuestion(q: QuizBankQuestion): GeneratedQuestion {
  // Map numeric difficulty (1-5) to BloomLevel (1-7) — simple 1:1 for 1-5
  const bloom = Math.min(7, Math.max(1, q.difficulty)) as BloomLevel;
  return {
    question: q.question,
    format: q.format as GeneratedQuestion["format"],
    difficulty: bloom,
    bloomLabel: q.bloomLabel,
    options: q.options,
    correctAnswer: q.correctAnswer,
  };
}

// Pick N questions from a quiz bank within a difficulty range, without repeats
function pickStaticQuestions(
  quizBank: QuizBankQuestion[],
  diffMin: number,
  diffMax: number,
  count: number
): QuizBankQuestion[] {
  const inRange = quizBank.filter(
    (q) => q.difficulty >= diffMin && q.difficulty <= diffMax
  );
  // Shuffle
  const shuffled = [...inRange].sort(() => Math.random() - 0.5);
  if (shuffled.length >= count) return shuffled.slice(0, count);

  // Not enough in range — pad with questions just outside the range
  const outside = quizBank
    .filter((q) => q.difficulty < diffMin || q.difficulty > diffMax)
    .sort(() => Math.random() - 0.5);
  return [...shuffled, ...outside].slice(0, count);
}

// ── Cooldown helpers ─────────────────────────────────────────────────────────

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function cooldownRemaining(lastAttemptMs: number): number {
  return Math.max(0, lastAttemptMs + COOLDOWN_MS - Date.now());
}

function formatCooldown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

// ── JSON extraction ──────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    const last = text.lastIndexOf("}");
    if (last !== -1) return text.slice(firstBrace, last + 1);
  }
  return text.trim();
}

// ── Local grading for MCQ / TF / fill_blank ──────────────────────────────────

function gradeLocalAnswer(
  question: GeneratedQuestion,
  userAnswer: string
): { score: number; feedback: string; missed: string[]; perfectAnswer: string } {
  const correct = question.correctAnswer ?? "";
  const norm = (s: string) => s.trim().toUpperCase();
  const isCorrect = norm(userAnswer) === norm(correct);

  if (question.format === "mcq") {
    const optionText =
      question.options?.find((o) => o.startsWith(correct + ")"))?.substring(3) ?? correct;
    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect
        ? `Correct! The answer is ${correct}: ${optionText}`
        : `Incorrect. The correct answer was ${correct}: ${optionText}`,
      missed: isCorrect ? [] : [`Correct answer: ${correct}: ${optionText}`],
      perfectAnswer: `${correct}: ${optionText}`,
    };
  }
  if (question.format === "true_false") {
    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect ? `Correct!` : `Incorrect. The statement is ${correct}.`,
      missed: isCorrect ? [] : [`Correct answer: ${correct}`],
      perfectAnswer: correct,
    };
  }
  if (question.format === "fill_blank") {
    const close =
      norm(userAnswer).includes(norm(correct)) || norm(correct).includes(norm(userAnswer));
    const score = isCorrect ? 10 : close ? 6 : 0;
    return {
      score,
      feedback: isCorrect
        ? "Correct!"
        : close
          ? `Close, but expected: ${correct}`
          : `Incorrect. Expected: ${correct}`,
      missed: score < 10 ? [`Expected: ${correct}`] : [],
      perfectAnswer: correct,
    };
  }
  return { score: 5, feedback: "Answer recorded.", missed: [], perfectAnswer: correct };
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface GraduationTestProps {
  topicId: number;
  topicName: string;
  dreyfusLevel: number; // 1–5
  onPass: (level: number) => void;
  onClose: () => void;
}

// ── Phase type ────────────────────────────────────────────────────────────────

type Phase =
  | "cooldown"
  | "intro"
  | "loading"
  | "answering"
  | "grading"
  | "showing_grade"
  | "result";

export function GraduationTest({
  topicId,
  topicName,
  dreyfusLevel,
  onPass,
  onClose,
}: GraduationTestProps) {
  const ai = useAI();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);
  const queueCelebration = useStore((s) => s.queueCelebration);

  const isBoss = dreyfusLevel === 5;
  const totalQuestions = isBoss ? BOSS_COUNT : STANDARD_COUNT;
  const bloomBase = DREYFUS_TO_BLOOM[dreyfusLevel] ?? 1;

  const [phase, setPhase] = useState<Phase>("intro");
  const [error, setError] = useState<string | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);

  // Questions + answers
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<AnsweredQuestion | null>(null);
  const answersRef = useRef<AnsweredQuestion[]>([]);
  // Tracks the original QuizBankQuestion for each question (null = AI-generated)
  const staticBankRef = useRef<(QuizBankQuestion | null)[]>([]);

  // Boss battle timer
  const [secondsLeft, setSecondsLeft] = useState(BOSS_DURATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Actual number of questions loaded (may be < totalQuestions if partial static fill)
  const [loadedCount, setLoadedCount] = useState(totalQuestions);

  // Result
  const [passed, setPassed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // ── Check cooldown on mount ──────────────────────────────────────────────────

  useEffect(() => {
    async function checkCooldown() {
      const last = await db.graduationTests
        .where({ topicId, level: dreyfusLevel })
        .reverse()
        .sortBy("attemptedAt");
      if (last.length > 0) {
        const lastTime = new Date(last[0].attemptedAt).getTime();
        const remaining = cooldownRemaining(lastTime);
        if (remaining > 0 && !last[0].passed) {
          setCooldownMs(remaining);
          setPhase("cooldown");
        }
      }
    }
    checkCooldown();
  }, [topicId, dreyfusLevel]);

  // ── Boss timer ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isBoss || phase !== "answering") return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — finalize
          finalizeTest(answersRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isBoss]);

  function formatTimer(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Generate all questions upfront ──────────────────────────────────────────

  const startTest = useCallback(async () => {
    setPhase("loading");
    setError(null);
    answersRef.current = [];
    staticBankRef.current = [];

    try {
      const generated: GeneratedQuestion[] = [];
      const staticSources: (QuizBankQuestion | null)[] = [];

      // ── 1. Try to load from the static quiz bank first ─────────────────────
      const [diffMin, diffMax] = DREYFUS_DIFFICULTY_RANGE[dreyfusLevel] ?? [1, 5];
      let staticQuestions: QuizBankQuestion[] = [];

      const topicContent = await findTopicContent(topicName);
      if (topicContent?.quizBank?.length) {
        staticQuestions = pickStaticQuestions(
          topicContent.quizBank,
          diffMin,
          diffMax,
          totalQuestions
        );
      }

      // ── 2. Use however many static questions we got ────────────────────────
      for (const sq of staticQuestions) {
        generated.push(quizBankToGeneratedQuestion(sq));
        staticSources.push(sq);
      }

      // ── 3. Fill the remainder with AI-generated questions (if possible) ────
      const remaining = totalQuestions - generated.length;
      if (remaining > 0) {
        if (!ai) {
          if (generated.length === 0) {
            setError(
              "No questions available. Connect an AI provider or ensure the quiz bank has content for this topic."
            );
            setPhase("intro");
            return;
          }
          // Partial fill — work with what we have
        } else {
          const prevTexts = generated.map((q) => q.question.substring(0, 80));
          for (let i = 0; i < remaining; i++) {
            const bloomOffset = Math.floor(
              (generated.length + i) / Math.ceil(totalQuestions / 2)
            );
            const bloom = Math.min(7, bloomBase + bloomOffset) as BloomLevel;

            const formats: Array<GeneratedQuestion["format"]> =
              bloom <= 2
                ? ["mcq", "true_false", "fill_blank"]
                : bloom <= 4
                  ? ["mcq", "open_ended", "scenario"]
                  : ["open_ended", "scenario", "mcq"];
            const format = formats[i % formats.length];

            const { system, user } = quizQuestionPrompt(topicName, bloom, format, prevTexts);
            const q = await ai.generateStructured<GeneratedQuestion>(
              user,
              system,
              (text) => {
                const parsed = JSON.parse(extractJSON(text)) as GeneratedQuestion;
                if (!parsed.question) throw new Error("Invalid question");
                return parsed;
              },
              { temperature: 0.7 }
            );
            generated.push(q);
            staticSources.push(null); // AI-generated, no static source
            prevTexts.push(q.question.substring(0, 80));
          }
        }
      }

      staticBankRef.current = staticSources;
      setQuestions(generated);
      setLoadedCount(generated.length);
      setCurrentIndex(0);
      setSecondsLeft(BOSS_DURATION_SECONDS);
      setPhase("answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
      setPhase("intro");
    }
  }, [ai, bloomBase, dreyfusLevel, topicName, totalQuestions]);

  // ── Grade current answer ─────────────────────────────────────────────────────

  const handleAnswer = useCallback(
    async (userAnswer: string) => {
      const q = questions[currentIndex];
      if (!q) return;
      setPhase("grading");
      setError(null);

      try {
        let graded: { score: number; feedback: string; missed: string[]; perfectAnswer: string };

        const staticSource = staticBankRef.current[currentIndex] ?? null;

        if (staticSource) {
          // ── Static question: grade locally, no AI needed ─────────────────
          graded = gradeStaticQuestion(staticSource, userAnswer);
        } else {
          // ── AI-generated question: use local grader for MCQ/TF/fill_blank,
          //    fall back to AI for open-ended formats ──────────────────────
          const canGradeLocally =
            q.correctAnswer &&
            (q.format === "mcq" || q.format === "true_false" || q.format === "fill_blank");

          if (canGradeLocally) {
            graded = gradeLocalAnswer(q, userAnswer);
          } else if (ai) {
            const { system, user } = quizGradingPrompt(q.question, userAnswer, q.difficulty);
            graded = await ai.generateStructured(
              user,
              system,
              (text) => {
                const parsed = JSON.parse(extractJSON(text)) as Record<string, unknown>;
                return {
                  score: Math.min(10, Math.max(0, Number(parsed.score))),
                  feedback: String(parsed.feedback ?? ""),
                  missed: Array.isArray(parsed.missed)
                    ? (parsed.missed as unknown[]).map(String)
                    : [],
                  perfectAnswer: String(parsed.perfectAnswer ?? ""),
                };
              },
              { temperature: 0.2 }
            );
          } else {
            // No AI and not locally gradeable — give a neutral recorded score
            graded = {
              score: 5,
              feedback: "Answer recorded. (AI grading unavailable — connect a provider for detailed feedback.)",
              missed: [],
              perfectAnswer: q.correctAnswer ?? "",
            };
          }
        }

        const answered: AnsweredQuestion = { ...q, userAnswer, ...graded };
        answersRef.current = [...answersRef.current, answered];
        setCurrentAnswer(answered);
        setPhase("showing_grade");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Grading failed");
        setPhase("answering");
      }
    },
    [ai, currentIndex, questions]
  );

  // ── Advance or finalize ──────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= loadedCount) {
      clearInterval(timerRef.current!);
      finalizeTest(answersRef.current);
    } else {
      setCurrentAnswer(null);
      setCurrentIndex((i) => i + 1);
      setPhase("answering");
    }
  }, [currentIndex, loadedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeTest = useCallback(
    async (answers: AnsweredQuestion[]) => {
      // Score: count answers where score >= 7 (pass threshold for a question)
      const correct = answers.filter((a) => a.score >= 7).length;
      const actualCount = answers.length || loadedCount;
      const didPass = actualCount > 0 && correct / actualCount >= PASS_THRESHOLD;
      setCorrectCount(correct);
      setLoadedCount(actualCount);
      setPassed(didPass);

      // Persist result
      await db.graduationTests.add({
        topicId,
        level: dreyfusLevel,
        passed: didPass,
        score: correct,
        totalQuestions: actualCount,
        attemptedAt: new Date(),
      });

      if (didPass) {
        const xp = isBoss ? BOSS_PASS_XP : PASS_XP;
        const coins = isBoss ? BOSS_PASS_COINS : PASS_COINS;
        addXP(xp);
        addCoins(coins, isBoss ? "boss_battle_pass" : "graduation_test_pass");
        queueCelebration({ type: "badge", data: { label: "Level unlocked!" } });

        if (isBoss) {
          // Award mastery badge
          await db.badges.add({
            type: `topic_mastery_${topicId}`,
            name: "Guru Pareeksha",
            description: `Achieved Expert mastery of ${topicName}`,
            icon: "🏆",
            unlockedAt: new Date(),
          });
        }

        // Update level progress
        const existingProgress = await db.levelProgress
          .where("topicId")
          .equals(topicId)
          .first();
        const nextUnlocked = isBoss ? 5 : dreyfusLevel + 1;

        if (existingProgress?.id) {
          await db.levelProgress.update(existingProgress.id, {
            unlockedLevel: Math.max(existingProgress.unlockedLevel, nextUnlocked),
            masteryBadgeEarned: isBoss ? true : existingProgress.masteryBadgeEarned,
            updatedAt: new Date(),
          });
        } else {
          await db.levelProgress.add({
            topicId,
            unlockedLevel: nextUnlocked,
            masteryBadgeEarned: isBoss,
            updatedAt: new Date(),
          });
        }
      }

      setPhase("result");
    },
    [addCoins, addXP, dreyfusLevel, isBoss, loadedCount, queueCelebration, topicId, topicName, totalQuestions]
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  // Cooldown
  if (phase === "cooldown") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center max-w-md mx-auto">
        <div className="flex size-16 items-center justify-center rounded-full bg-gold/10 ring-2 ring-gold/30">
          <Clock className="size-8 text-gold" />
        </div>
        <div>
          <h3 className="text-xl font-heading font-bold">Cooldown Active</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to wait before retaking this graduation test.
          </p>
          <p className="mt-3 text-2xl font-bold text-gold">{formatCooldown(cooldownMs)}</p>
          <p className="text-xs text-muted-foreground mt-1">remaining</p>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          Use this time to review the level material and practice the observable skills before your next attempt.
        </p>
        <Button variant="outline" onClick={onClose} className="w-full max-w-xs">
          Back to Ladder
        </Button>
      </div>
    );
  }

  // Intro
  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 text-center max-w-md mx-auto">
        <div
          className={cn(
            "flex size-16 items-center justify-center rounded-full ring-2",
            isBoss
              ? "bg-gold/10 ring-gold/40"
              : "bg-saffron/10 ring-saffron/40"
          )}
        >
          <Trophy className={cn("size-8", isBoss ? "text-gold" : "text-saffron")} />
        </div>

        <div>
          {isBoss ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">
                Boss Battle
              </p>
              <h3 className="text-2xl font-heading font-bold">Guru Pareeksha</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                The final test of mastery. {BOSS_COUNT} questions, {BOSS_DURATION_SECONDS / 60} minutes. Score 80% to earn the Expert badge.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-heading font-bold">
                Level {dreyfusLevel} Graduation Test
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                {STANDARD_COUNT} questions to prove you&apos;re ready to advance. Score 80% (4 of 5) to unlock the next level.
              </p>
            </>
          )}
        </div>

        {/* Rewards */}
        <Card className="w-full max-w-xs">
          <CardContent className="pt-4 pb-3 text-sm">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 font-medium">
              Rewards for passing
            </p>
            <div className="flex justify-around">
              <span className="text-gold font-semibold">
                +{isBoss ? BOSS_PASS_XP : PASS_XP} XP
              </span>
              <span className="text-teal font-semibold">
                +{isBoss ? BOSS_PASS_COINS : PASS_COINS} coins
              </span>
              {isBoss && (
                <span className="font-semibold">Expert Badge</span>
              )}
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive w-full max-w-xs">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button onClick={startTest} size="lg" className="w-full">
            {isBoss ? "Begin Guru Pareeksha" : "Start Test"}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Back to Ladder
          </Button>
        </div>
      </div>
    );
  }

  // Loading questions
  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">
          Preparing {totalQuestions} questions…
        </p>
      </div>
    );
  }

  // Grading spinner
  if (phase === "grading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">Grading your answer…</p>
      </div>
    );
  }

  // Answering
  if (phase === "answering" && questions[currentIndex]) {
    const q = questions[currentIndex];
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-muted-foreground">
            {isBoss ? "Guru Pareeksha" : `Level ${dreyfusLevel} Graduation Test`} — Question{" "}
            {currentIndex + 1} of {loadedCount}
          </span>
          {isBoss && (
            <span
              className={cn(
                "text-xs font-mono font-semibold px-2 py-0.5 rounded",
                secondsLeft < 120 ? "text-destructive bg-destructive/10" : "text-gold bg-gold/10"
              )}
            >
              <Clock className="size-3 inline mr-1" />
              {formatTimer(secondsLeft)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-saffron transition-all duration-300"
            style={{ width: `${((currentIndex) / loadedCount) * 100}%` }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <QuestionCard
            key={q.question.substring(0, 20)}
            question={q}
            questionNumber={currentIndex + 1}
            totalQuestions={loadedCount}
          />
        </AnimatePresence>
        <AnswerInput question={q} onSubmit={handleAnswer} />
      </div>
    );
  }

  // Showing grade result
  if (phase === "showing_grade" && currentAnswer) {
    const isLast = currentIndex + 1 >= loadedCount;
    const xpForThis =
      currentAnswer.score >= 10 ? 5 : currentAnswer.score >= 8 ? 3 : currentAnswer.score >= 5 ? 1 : 0;
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <GradeResult
          answer={currentAnswer}
          xpEarned={xpForThis}
          onNext={handleNext}
          isLast={isLast}
        />
      </div>
    );
  }

  // Result screen
  if (phase === "result") {
    const pct = loadedCount > 0 ? Math.round((correctCount / loadedCount) * 100) : 0;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-5 py-8 text-center max-w-md mx-auto"
      >
        <div
          className={cn(
            "flex size-20 items-center justify-center rounded-full ring-2",
            passed
              ? "bg-teal/10 ring-teal/40"
              : "bg-destructive/10 ring-destructive/30"
          )}
        >
          {passed ? (
            <CheckCircle className="size-10 text-teal" />
          ) : (
            <XCircle className="size-10 text-destructive" />
          )}
        </div>

        <div>
          {passed ? (
            <>
              <h3 className="text-2xl font-heading font-bold text-teal">
                {isBoss ? "Guru Pareeksha Passed!" : "Level Cleared!"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctCount} / {loadedCount} correct ({pct}%)
              </p>
              {isBoss && (
                <p className="mt-2 text-sm font-medium text-gold">
                  You have earned the Expert mastery badge for {topicName}!
                </p>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-heading font-bold text-destructive">
                Not Quite Yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {correctCount} / {loadedCount} correct ({pct}%) — need{" "}
                {Math.ceil(loadedCount * PASS_THRESHOLD)} to pass
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Review the material and try again in 24 hours.
              </p>
            </>
          )}
        </div>

        {passed && (
          <Card className="w-full max-w-xs border-teal/20 bg-teal/5">
            <CardContent className="pt-4 pb-3 text-sm text-center">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">
                Rewards earned
              </p>
              <div className="flex justify-around font-semibold">
                <span className="text-gold">
                  +{isBoss ? BOSS_PASS_XP : PASS_XP} XP
                </span>
                <span className="text-teal">
                  +{isBoss ? BOSS_PASS_COINS : PASS_COINS} coins
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            onClick={() => {
              if (passed) onPass(dreyfusLevel);
              else onClose();
            }}
            size="lg"
            className="w-full"
          >
            {passed ? "Continue to Ladder" : "Back to Ladder"}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
