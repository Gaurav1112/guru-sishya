"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gradeStaticQuestion } from "@/lib/quiz/static-quiz";
import type { QuizBankQuestion } from "@/lib/content/loader";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TestAnswer {
  questionIndex: number;
  userAnswer: string;
  score: number;
  isCorrect: boolean;
}

export interface TimedTestProps {
  questions: QuizBankQuestion[];
  /** Duration in seconds */
  durationSeconds: number;
  /** XP awarded on completion */
  xpReward: number;
  /** Coin reward on completion */
  coinReward: number;
  title: string;
  subtitle?: string;
  onComplete: (answers: TestAnswer[], timeTakenSeconds: number) => void;
}

// ── Timer display ─────────────────────────────────────────────────────────────

function TimerDisplay({
  secondsLeft,
  total,
}: {
  secondsLeft: number;
  total: number;
}) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const pct = total > 0 ? (secondsLeft / total) * 100 : 0;
  const isLow = secondsLeft <= 300; // last 5 minutes

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2 tabular-nums",
        isLow
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border bg-surface text-foreground"
      )}
    >
      <Clock className="size-4 shrink-0" />
      <span className="font-mono text-sm font-semibold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <div className="hidden sm:block w-16 h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isLow ? "bg-destructive" : "bg-saffron"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Question navigator ────────────────────────────────────────────────────────

function QuestionNav({
  total,
  current,
  answered,
  flagged,
  onJump,
}: {
  total: number;
  current: number;
  answered: Set<number>;
  flagged: Set<number>;
  onJump: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onJump(i)}
          className={cn(
            "size-7 rounded-md text-xs font-semibold transition-all border",
            current === i
              ? "border-saffron bg-saffron text-white scale-110"
              : flagged.has(i)
                ? "border-orange-400 bg-orange-400/10 text-orange-400"
                : answered.has(i)
                  ? "border-teal/40 bg-teal/10 text-teal"
                  : "border-border bg-surface text-muted-foreground hover:border-border hover:bg-surface-hover"
          )}
          aria-label={`Question ${i + 1}${flagged.has(i) ? " (flagged)" : answered.has(i) ? " (answered)" : ""}`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// ── MCQ option button ─────────────────────────────────────────────────────────

function MCQOption({
  label,
  text,
  selected,
  onSelect,
}: {
  label: string;
  text: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border px-4 py-3 text-sm transition-all duration-150",
        selected
          ? "border-saffron bg-saffron/10 text-foreground"
          : "border-border bg-surface hover:bg-surface-hover text-foreground"
      )}
    >
      <span className="font-semibold mr-2">{label})</span>
      {text}
    </button>
  );
}

// ── Confirmation dialog ───────────────────────────────────────────────────────

function SubmitConfirmDialog({
  answeredCount,
  totalCount,
  flaggedCount,
  onConfirm,
  onCancel,
}: {
  answeredCount: number;
  totalCount: number;
  flaggedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const unanswered = totalCount - answeredCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <h3 className="font-heading text-lg font-bold mb-2">Submit Test?</h3>
        <div className="space-y-2 text-sm mb-6">
          <p className="text-muted-foreground">
            You have answered{" "}
            <span className="font-semibold text-foreground">{answeredCount}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalCount}</span>{" "}
            questions.
          </p>
          {unanswered > 0 && (
            <p className="flex items-center gap-2 text-orange-400">
              <AlertCircle className="size-4 shrink-0" />
              {unanswered} question{unanswered !== 1 ? "s" : ""} left unanswered.
            </p>
          )}
          {flaggedCount > 0 && (
            <p className="flex items-center gap-2 text-orange-400">
              <Flag className="size-4 shrink-0" />
              {flaggedCount} question{flaggedCount !== 1 ? "s" : ""} flagged for review.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Keep Going
          </Button>
          <Button onClick={onConfirm} className="flex-1">
            Submit Now
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Score screen ──────────────────────────────────────────────────────────────

function ScoreScreen({
  answers,
  questions,
  timeTaken,
  xpReward,
  coinReward,
  onDone,
}: {
  answers: TestAnswer[];
  questions: QuizBankQuestion[];
  timeTaken: number;
  xpReward: number;
  coinReward: number;
  onDone: () => void;
}) {
  const correct = answers.filter((a) => a.isCorrect).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mins = Math.floor(timeTaken / 60);
  const secs = timeTaken % 60;

  const grade =
    pct >= 90
      ? { label: "Excellent", color: "text-teal", ring: "ring-teal/40 bg-teal/10" }
      : pct >= 70
        ? { label: "Good", color: "text-saffron", ring: "ring-saffron/40 bg-saffron/10" }
        : pct >= 50
          ? { label: "Fair", color: "text-gold", ring: "ring-gold/40 bg-gold/10" }
          : { label: "Needs Work", color: "text-destructive", ring: "ring-destructive/40 bg-destructive/10" };

  // Weak areas: questions answered incorrectly
  const weakAreas = answers
    .filter((a) => !a.isCorrect)
    .slice(0, 5)
    .map((a) => questions[a.questionIndex]?.question ?? "")
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8 max-w-xl mx-auto text-center"
    >
      {/* Grade circle */}
      <div
        className={cn(
          "flex size-24 flex-col items-center justify-center rounded-full ring-2",
          grade.ring
        )}
      >
        <span className={cn("font-heading text-3xl font-bold", grade.color)}>
          {pct}%
        </span>
        <span className={cn("text-xs font-medium", grade.color)}>
          {grade.label}
        </span>
      </div>

      <div>
        <h2 className="font-heading text-2xl font-bold">Test Complete!</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {correct} / {total} correct &middot; Time:{" "}
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 w-full">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="font-heading text-xl font-bold text-teal">{correct}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="font-heading text-xl font-bold text-destructive">
            {total - correct}
          </p>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="font-heading text-xl font-bold text-muted-foreground">
            {total - answers.length}
          </p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </div>
      </div>

      {/* Rewards */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 rounded-full border border-saffron/40 bg-saffron/10 px-4 py-2">
          <Zap className="size-4 text-saffron" />
          <span className="font-semibold text-saffron text-sm">+{xpReward} XP</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2">
          <Coins className="size-4 text-gold" />
          <span className="font-semibold text-gold text-sm">+{coinReward} coins</span>
        </div>
      </div>

      {/* Weak areas */}
      {weakAreas.length > 0 && (
        <div className="w-full text-left rounded-xl border border-orange-400/30 bg-orange-400/5 p-4">
          <p className="text-sm font-semibold text-orange-400 mb-2">
            Areas to Improve
          </p>
          <ul className="space-y-1">
            {weakAreas.map((q, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2">
                <span className="text-orange-400 shrink-0">•</span>
                <span className="line-clamp-2">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={onDone} size="lg" className="w-full max-w-xs">
        Back to Review Hub
      </Button>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Phase = "intro" | "testing" | "confirm" | "score";

export function TimedTest({
  questions,
  durationSeconds,
  xpReward,
  coinReward,
  title,
  subtitle,
  onComplete,
}: TimedTestProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Map<number, string>>(new Map());
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [startTime, setStartTime] = useState<number>(0);
  const [finalAnswers, setFinalAnswers] = useState<TestAnswer[]>([]);
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = questions[currentIdx];
  const answered = new Set(userAnswers.keys());

  // ── Timer ──────────────────────────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setStartTime(Date.now());
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (phase === "testing" && secondsLeft === 0) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Answer / navigation ───────────────────────────────────────────────────

  const setAnswer = useCallback((idx: number, answer: string) => {
    setUserAnswers((prev) => {
      const next = new Map(prev);
      next.set(idx, answer);
      return next;
    });
  }, []);

  const toggleFlag = useCallback((idx: number) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    stopTimer();
    const elapsed = startTime > 0 ? Math.round((Date.now() - startTime) / 1000) : durationSeconds - secondsLeft;
    setTimeTaken(elapsed);

    const graded: TestAnswer[] = [];
    for (let i = 0; i < questions.length; i++) {
      const userAnswer = userAnswers.get(i) ?? "";
      if (!userAnswer) continue;
      const result = gradeStaticQuestion(questions[i], userAnswer);
      graded.push({
        questionIndex: i,
        userAnswer,
        score: result.score,
        isCorrect: result.score >= 7,
      });
    }
    setFinalAnswers(graded);
    setPhase("score");
    onComplete(graded, elapsed);
  }, [stopTimer, startTime, durationSeconds, secondsLeft, questions, userAnswers, onComplete]);

  // ── Intro screen ──────────────────────────────────────────────────────────

  if (phase === "intro") {
    const mins = Math.floor(durationSeconds / 60);
    return (
      <div className="flex flex-col items-center gap-6 py-12 max-w-lg mx-auto text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-saffron/10 ring-2 ring-saffron/30">
          <Clock className="size-10 text-saffron" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-heading text-2xl font-bold">{questions.length}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="font-heading text-2xl font-bold">{mins} min</p>
            <p className="text-xs text-muted-foreground">Time Limit</p>
          </div>
        </div>
        <div className="w-full rounded-xl border border-border bg-surface p-4 text-sm text-left space-y-2 text-muted-foreground">
          <p className="font-semibold text-foreground">Instructions</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Use the question navigator to jump between questions.</li>
            <li>Flag questions you want to review before submitting.</li>
            <li>The test auto-submits when the timer reaches zero.</li>
            <li>Earn <span className="text-saffron font-semibold">+{xpReward} XP</span> and <span className="text-gold font-semibold">+{coinReward} coins</span> on completion.</li>
          </ul>
        </div>
        <Button
          size="lg"
          className="w-full max-w-xs"
          onClick={() => {
            setPhase("testing");
            startTimer();
          }}
        >
          Start Test
        </Button>
      </div>
    );
  }

  // ── Score screen ──────────────────────────────────────────────────────────

  if (phase === "score") {
    return (
      <ScoreScreen
        answers={finalAnswers}
        questions={questions}
        timeTaken={timeTaken}
        xpReward={xpReward}
        coinReward={coinReward}
        onDone={() => window.history.back()}
      />
    );
  }

  // ── Testing phase ─────────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  // Parse MCQ options from the options array
  const isMCQ =
    currentQuestion.format === "mcq" && currentQuestion.options && currentQuestion.options.length > 0;
  const isTrueFalse = currentQuestion.format === "true_false";

  const currentAnswer = userAnswers.get(currentIdx) ?? "";

  return (
    <>
      {phase === "confirm" && (
        <SubmitConfirmDialog
          answeredCount={answered.size}
          totalCount={questions.length}
          flaggedCount={flagged.size}
          onConfirm={handleSubmit}
          onCancel={() => setPhase("testing")}
        />
      )}

      <div className="flex flex-col gap-4 max-w-2xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-heading text-base font-semibold">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {answered.size} of {questions.length} answered
            </p>
          </div>
          <TimerDisplay secondsLeft={secondsLeft} total={durationSeconds} />
        </div>

        {/* Question navigator */}
        <div className="rounded-xl border border-border bg-surface p-3">
          <QuestionNav
            total={questions.length}
            current={currentIdx}
            answered={answered}
            flagged={flagged}
            onJump={setCurrentIdx}
          />
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className="rounded-xl border border-border bg-surface p-5 space-y-4"
          >
            {/* Question header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Q{currentIdx + 1}
                </span>
                <span className="rounded-full border border-saffron/40 bg-saffron/10 text-saffron text-[10px] font-semibold px-2 py-0.5 uppercase tracking-wider">
                  {currentQuestion.bloomLabel}
                </span>
                <span className="rounded-full border border-border text-muted-foreground text-[10px] px-2 py-0.5 uppercase">
                  {currentQuestion.format.replace("_", " ")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleFlag(currentIdx)}
                className={cn(
                  "flex items-center gap-1 text-xs rounded-lg px-2 py-1 border transition-colors",
                  flagged.has(currentIdx)
                    ? "border-orange-400/40 bg-orange-400/10 text-orange-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
                aria-label="Flag for review"
              >
                <Flag className="size-3" />
                {flagged.has(currentIdx) ? "Flagged" : "Flag"}
              </button>
            </div>

            {/* Question text */}
            <p className="text-sm leading-relaxed font-medium">
              {currentQuestion.question}
            </p>

            {/* Answer area */}
            {isMCQ && currentQuestion.options ? (
              <div className="space-y-2">
                {currentQuestion.options.map((option, i) => {
                  const letter = option.match(/^([A-D])\)/)?.[1] ?? String.fromCharCode(65 + i);
                  const text = option.replace(/^[A-D]\)\s*/, "");
                  return (
                    <MCQOption
                      key={i}
                      label={letter}
                      text={text}
                      selected={currentAnswer === letter}
                      onSelect={() => setAnswer(currentIdx, letter)}
                    />
                  );
                })}
              </div>
            ) : isTrueFalse ? (
              <div className="flex gap-3">
                {["True", "False"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAnswer(currentIdx, val.toUpperCase())}
                    className={cn(
                      "flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
                      currentAnswer === val.toUpperCase()
                        ? "border-saffron bg-saffron/10 text-foreground"
                        : "border-border bg-surface hover:bg-surface-hover"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-saffron/40 min-h-[100px]"
                placeholder="Type your answer here…"
                value={currentAnswer}
                onChange={(e) => setAnswer(currentIdx, e.target.value)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation row */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="size-4" />
            Prev
          </Button>

          <div className="flex items-center gap-2">
            {answered.size === questions.length ? (
              <Button
                size="sm"
                onClick={() => setPhase("confirm")}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                Submit Test
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPhase("confirm")}
              >
                Submit Early
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
            disabled={currentIdx === questions.length - 1}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
