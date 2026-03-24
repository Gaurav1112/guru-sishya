"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, Zap, Timer } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionCard } from "./question-card";
import { AnswerInput } from "./answer-input";
import { GradeResult } from "./grade-result";
import { QuizResultScreen } from "./quiz-result";
import { CalibrationIntro } from "./calibration-intro";
import { DifficultyIndicator } from "./difficulty-indicator";
import { OneMoreRound } from "@/components/gamification/one-more-round";
import { TreasureChest } from "@/components/gamification/treasure-chest";
import { calibrationPrompt } from "@/lib/prompts/quiz-calibration";
import { quizQuestionPrompt, quizGradingPrompt } from "@/lib/prompts/quiz-generator";
import { getNextLevel, calculateQuizResult, getStartingLevelFromCalibration } from "@/lib/quiz/engine";
import { updateFlashcardsFromQuiz } from "@/lib/quiz/spaced-repetition-bridge";
import { generateFlashcardsFromQuiz } from "@/lib/flashcard-generator";
import { getUserStats, checkAndUnlockBadges } from "@/lib/gamification/badges";
import { checkOneMoreRound } from "@/lib/gamification/one-more-round";
import { xpProgressInLevel } from "@/lib/gamification/xp";
import { shouldDropChest, recordChest } from "@/lib/gamification/treasure-chests";
import type { ChestReward } from "@/lib/gamification/treasure-chests";
import type { OneMoreRoundTrigger } from "@/lib/gamification/one-more-round";
import { BLOOM_LABELS, type BloomLevel, type GeneratedQuestion, type AnsweredQuestion, type QuizResult } from "@/lib/quiz/types";
import { findTopicContent, type QuizBankQuestion } from "@/lib/content/loader";
import { pickQuestion, gradeStaticQuestion } from "@/lib/quiz/static-quiz";
import { cn } from "@/lib/utils";

const SESSION_CAP = 15;
const CALIBRATION_COUNT = 5;

// Timer durations (seconds)
const TIMER_MCQ = 60;
const TIMER_OPEN = 120;

interface QuizContainerProps {
  topicId: number;
  topicName: string;
}

// ── JSON extraction helper ────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const last = text.lastIndexOf("]");
    if (last !== -1) return text.slice(firstBracket, last + 1);
  }
  if (firstBrace !== -1) {
    const last = text.lastIndexOf("}");
    if (last !== -1) return text.slice(firstBrace, last + 1);
  }
  return text.trim();
}

// ── Weighted format selection based on Bloom's level ─────────────────────────

type QuizFormat = GeneratedQuestion["format"];

function pickFormatForLevel(level: BloomLevel): QuizFormat {
  type WeightedFormat = [QuizFormat, number];
  let pool: WeightedFormat[];

  if (level <= 2) {
    pool = [
      ["mcq", 40],
      ["true_false", 30],
      ["fill_blank", 30],
    ];
  } else if (level <= 4) {
    pool = [
      ["scenario", 35],
      ["open_ended", 25],
      ["predict_output", 20],
      ["mcq", 20],
    ];
  } else {
    pool = [
      ["open_ended", 40],
      ["scenario", 30],
      ["code_review", 15],
      ["ordering", 15],
    ];
  }

  const total = pool.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [format, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return format;
  }
  return pool[0][0];
}

// ── Local MCQ/TF/FB grading ──────────────────────────────────────────────────

function gradeLocalAnswer(
  question: GeneratedQuestion,
  userAnswer: string
): { score: number; feedback: string; missed: string[]; perfectAnswer: string } {
  const correct = question.correctAnswer ?? "";
  const normalUser = userAnswer.trim().toUpperCase();
  const normalCorrect = correct.trim().toUpperCase();
  const isCorrect = normalUser === normalCorrect;

  if (question.format === "mcq") {
    const optionText =
      question.options?.find((o) => o.startsWith(correct + ")"))?.substring(3) ?? correct;
    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect
        ? `Correct! The answer is ${correct}: ${optionText}`
        : `Incorrect. The correct answer was ${correct}: ${optionText}`,
      missed: isCorrect ? [] : [`The correct answer was ${correct}: ${optionText}`],
      perfectAnswer: `${correct}: ${optionText}`,
    };
  }

  if (question.format === "true_false") {
    return {
      score: isCorrect ? 10 : 0,
      feedback: isCorrect
        ? `Correct! The statement is ${correct}.`
        : `Incorrect. The statement is ${correct}.`,
      missed: isCorrect ? [] : [`The correct answer was: ${correct}`],
      perfectAnswer: correct,
    };
  }

  if (question.format === "fill_blank") {
    const close = normalUser.includes(normalCorrect) || normalCorrect.includes(normalUser);
    const score = isCorrect ? 10 : close ? 6 : 0;
    return {
      score,
      feedback: isCorrect
        ? `Correct!`
        : close
          ? `Close, but the expected answer was: ${correct}`
          : `Incorrect. The expected answer was: ${correct}`,
      missed: score < 10 ? [`Expected: ${correct}`] : [],
      perfectAnswer: correct,
    };
  }

  return {
    score: 5,
    feedback: "Answer recorded.",
    missed: [],
    perfectAnswer: correct || userAnswer,
  };
}

// ── Circular countdown timer ──────────────────────────────────────────────────

interface CountdownTimerProps {
  total: number;       // seconds
  remaining: number;   // seconds
}

function CountdownTimer({ total, remaining }: CountdownTimerProps) {
  const fraction = remaining / total;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * fraction;

  // Color transitions: green → yellow → red
  // CSS variables already contain full hsl() values, use directly
  const color =
    fraction > 0.5
      ? "var(--teal)"
      : fraction > 0.25
      ? "var(--gold)"
      : "var(--destructive)";

  const isUrgent = remaining <= 10;

  return (
    <motion.div
      animate={isUrgent ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={isUrgent ? { repeat: Infinity, duration: 0.6 } : {}}
      className="relative flex items-center justify-center"
      title={`${remaining}s remaining`}
    >
      <svg width={56} height={56} className="-rotate-90">
        {/* Track */}
        <circle
          cx={28}
          cy={28}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={4}
        />
        {/* Progress arc */}
        <motion.circle
          cx={28}
          cy={28}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          transition={{ duration: 0.4 }}
        />
      </svg>
      {/* Seconds label */}
      <span
        className="absolute text-xs font-bold tabular-nums"
        style={{ color }}
      >
        {remaining}
      </span>
    </motion.div>
  );
}

// ── Progress bar ─────────────────────────────────────────────────────────────

interface QuizProgressBarProps {
  current: number;   // 1-based
  total: number;
  score: number;     // cumulative score points earned (sum)
  maxScore: number;  // maximum possible so far
}

function QuizProgressBar({ current, total, score, maxScore }: QuizProgressBarProps) {
  const fraction = Math.min(current / total, 1);
  const pct = Math.round(fraction * 100);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Labels row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
        <span className="font-medium text-foreground">
          Question <span className="text-saffron font-bold">{current}</span>
          <span className="text-muted-foreground font-normal"> of {total}</span>
        </span>
        {maxScore > 0 && (
          <span className="font-medium">
            Score:{" "}
            <span className="text-saffron font-bold">{score}</span>
            <span className="text-muted-foreground">/{maxScore}</span>
          </span>
        )}
      </div>
      {/* Bar */}
      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-saffron"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Timer toggle switch ───────────────────────────────────────────────────────

interface TimerToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
}

function TimerToggle({ enabled, onChange }: TimerToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200",
        enabled
          ? "border-saffron bg-saffron"
          : "border-border bg-muted/40"
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={cn(
          "inline-block size-3.5 rounded-full bg-background shadow-sm",
          enabled ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Phase =
  | "checking"
  | "calibration_intro"
  | "calibration_loading"
  | "calibration_answering"
  | "calibration_grading"
  | "adaptive_loading"
  | "adaptive_answering"
  | "adaptive_grading"
  | "breaking_point"
  | "result";

export function QuizContainer({ topicId, topicName }: QuizContainerProps) {
  const ai = useAI();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);
  const aiProvider = useStore((s) => s.aiProvider);
  const quizTimerEnabled = useStore((s) => s.quizTimerEnabled);
  const setQuizTimerEnabled = useStore((s) => s.setQuizTimerEnabled);

  // Static provider: load quiz bank directly for instant question delivery
  const [quizBank, setQuizBank] = useState<QuizBankQuestion[] | null>(null);
  const isStatic = aiProvider === "static";

  useEffect(() => {
    if (isStatic) {
      findTopicContent(topicName).then((content) => {
        if (content?.quizBank && content.quizBank.length > 0) {
          setQuizBank(content.quizBank);
        }
      }).catch(() => {});
    }
  }, [isStatic, topicName]);

  // Dexie live query to detect existing calibration
  const existingCalibration = useLiveQuery(
    async () => (await db.quizAttempts.where({ topicId }).first()) ?? null,
    [topicId]
  );

  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState<string | null>(null);

  // Calibration state
  const [calibQuestions, setCalibQuestions] = useState<GeneratedQuestion[]>([]);
  const [calibIndex, setCalibIndex] = useState(0);
  const [calibScores, setCalibScores] = useState<number[]>([]);
  const [calibCurrentAnswer, setCalibCurrentAnswer] = useState<AnsweredQuestion | null>(null);

  // Adaptive state
  const [currentLevel, setCurrentLevel] = useState<BloomLevel>(1);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<GeneratedQuestion[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers] = useState<AnsweredQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<AnsweredQuestion | null>(null);
  const [consecutiveLow, setConsecutiveLow] = useState(0);
  const [breakingPointLevel, setBreakingPointLevel] = useState<BloomLevel | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // One More Round state
  const [oneMoreRoundTrigger, setOneMoreRoundTrigger] = useState<OneMoreRoundTrigger | null>(null);
  const [consecutivePrompts, setConsecutivePrompts] = useState(0);

  // Treasure Chest state
  const [activeChestId, setActiveChestId] = useState<number | null>(null);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [lastChestRound, setLastChestRound] = useState(0);

  // ── Timer state ────────────────────────────────────────────────────────────
  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [timerTotal, setTimerTotal] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSubmitRef = useRef<(() => void) | null>(null);

  const allAnswers = useRef<AnsweredQuestion[]>([]);

  // ── Effect: determine initial phase ─────────────────────────────────────────

  useEffect(() => {
    if (phase !== "checking") return;
    if (existingCalibration === undefined) return;
    if (existingCalibration === null) {
      setPhase("calibration_intro");
    } else {
      const savedScores = existingCalibration.questions?.map((q) => q.score) ?? [];
      const startLevel = savedScores.length > 0
        ? getStartingLevelFromCalibration(savedScores)
        : 1;
      setCurrentLevel(startLevel);
      setPhase("adaptive_loading");
    }
  }, [existingCalibration, phase]);

  // ── Timer helpers ─────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds: number, onExpire: () => void) => {
      clearTimer();
      setTimerTotal(seconds);
      setTimerRemaining(seconds);
      autoSubmitRef.current = onExpire;

      timerRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer]
  );

  // Clear timer on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  // ── Calibration: generate questions ─────────────────────────────────────────

  const startCalibration = useCallback(async () => {
    if (!ai) return;
    setPhase("calibration_loading");
    setError(null);
    try {
      if (isStatic && quizBank && quizBank.length >= CALIBRATION_COUNT) {
        const calibQs: GeneratedQuestion[] = [];
        for (let level = 1; level <= 5; level++) {
          const q = pickQuestion(quizBank, level, calibQs.map((cq) => cq.question));
          if (q) {
            calibQs.push({
              question: q.question,
              format: q.format as GeneratedQuestion["format"],
              difficulty: q.difficulty as BloomLevel,
              bloomLabel: q.bloomLabel,
              options: q.options,
              correctAnswer: q.correctAnswer,
            });
          }
        }
        if (calibQs.length > 0) {
          setCalibQuestions(calibQs.slice(0, CALIBRATION_COUNT));
          setCalibIndex(0);
          setPhase("calibration_answering");
          return;
        }
      }

      const { system, user } = calibrationPrompt(topicName);
      const questions = await ai.generateStructured<GeneratedQuestion[]>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as GeneratedQuestion[];
          if (!Array.isArray(parsed) || parsed.length === 0)
            throw new Error("Invalid calibration response");
          return parsed.slice(0, CALIBRATION_COUNT);
        },
        { temperature: 0.7 }
      );
      setCalibQuestions(questions);
      setCalibIndex(0);
      setPhase("calibration_answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calibration questions");
      setPhase("calibration_intro");
    }
  }, [ai, topicName, isStatic, quizBank]);

  // ── Calibration: grade answer ────────────────────────────────────────────────

  const gradeCalibrationAnswer = useCallback(
    async (question: GeneratedQuestion, userAnswer: string) => {
      if (!ai) return;
      clearTimer();
      setPhase("calibration_grading");
      setError(null);
      try {
        let graded: Pick<AnsweredQuestion, "score" | "feedback" | "missed" | "perfectAnswer">;

        if (isStatic && quizBank) {
          const bankQ = quizBank.find((q) => q.question === question.question);
          if (bankQ) {
            graded = gradeStaticQuestion(bankQ, userAnswer);
          } else {
            graded = gradeLocalAnswer(question, userAnswer);
          }
        } else {
          const needsAI = !question.correctAnswer ||
            (question.format !== "mcq" &&
              question.format !== "true_false" &&
              question.format !== "fill_blank");

          if (needsAI) {
            const { system, user } = quizGradingPrompt(question.question, userAnswer, question.difficulty);
            const result = await ai.generateStructured(
              user,
              system,
              (text) => {
                const parsed = JSON.parse(extractJSON(text)) as Record<string, unknown>;
                return {
                  score: Math.min(10, Math.max(0, Number(parsed.score))),
                  feedback: String(parsed.feedback ?? ""),
                  missed: Array.isArray(parsed.missed) ? (parsed.missed as unknown[]).map(String) : [],
                  perfectAnswer: String(parsed.perfectAnswer ?? ""),
                };
              },
              { temperature: 0.2 }
            );
            graded = result;
          } else {
            graded = gradeLocalAnswer(question, userAnswer);
          }
        }

        const answered: AnsweredQuestion = { ...question, userAnswer, ...graded };
        setCalibCurrentAnswer(answered);

        const newScores = [...calibScores, graded.score];
        setCalibScores(newScores);

        if (calibIndex + 1 >= calibQuestions.length) {
          await db.quizAttempts.add({
            topicId,
            score: Math.round(newScores.reduce((s, n) => s + n, 0) / newScores.length * 10),
            difficulty: "calibration",
            questions: calibQuestions.map((q, i) => ({
              question: q.question,
              userAnswer: i < calibIndex ? "" : userAnswer,
              score: i < calibIndex ? calibScores[i] : graded.score,
              feedback: graded.feedback,
              difficulty: String(q.difficulty),
              format: q.format,
            })),
            completedAt: new Date(),
          });

          const startLevel = getStartingLevelFromCalibration(newScores);
          setCurrentLevel(startLevel);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Grading failed");
        setPhase("calibration_answering");
      }
    },
    [ai, calibIndex, calibQuestions, calibScores, topicId, isStatic, quizBank, clearTimer]
  );

  const advanceCalibration = useCallback(() => {
    if (calibIndex + 1 >= calibQuestions.length) {
      setPhase("adaptive_loading");
    } else {
      setCalibIndex((i) => i + 1);
      setCalibCurrentAnswer(null);
      setPhase("calibration_answering");
    }
  }, [calibIndex, calibQuestions.length]);

  // ── Adaptive: generate question ──────────────────────────────────────────────

  const generateAdaptiveQuestion = useCallback(async () => {
    if (!ai) return;
    setPhase("adaptive_loading");
    setError(null);
    try {
      const prevQs = adaptiveQuestions.map((q) => q.question.substring(0, 80));

      if (isStatic && quizBank && quizBank.length > 0) {
        const picked = pickQuestion(quizBank, currentLevel, prevQs);
        if (picked) {
          const question: GeneratedQuestion = {
            question: picked.question,
            format: picked.format as GeneratedQuestion["format"],
            difficulty: picked.difficulty as BloomLevel,
            bloomLabel: picked.bloomLabel,
            options: picked.options,
            correctAnswer: picked.correctAnswer,
          };
          setCurrentQuestion(question);
          setAdaptiveQuestions((prev) => [...prev, question]);
          setPhase("adaptive_answering");
          return;
        }
      }

      const format = pickFormatForLevel(currentLevel);
      const { system, user } = quizQuestionPrompt(topicName, currentLevel, format, prevQs);

      const question = await ai.generateStructured<GeneratedQuestion>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as GeneratedQuestion;
          if (!parsed.question) throw new Error("Invalid question response");
          return parsed;
        },
        { temperature: 0.5 }
      );
      setCurrentQuestion(question);
      setAdaptiveQuestions((prev) => [...prev, question]);
      setPhase("adaptive_answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question");
    }
  }, [ai, adaptiveQuestions, currentLevel, topicName, isStatic, quizBank]);

  // ── Adaptive: grade answer ───────────────────────────────────────────────────

  const gradeAdaptiveAnswer = useCallback(
    async (question: GeneratedQuestion, userAnswer: string) => {
      if (!ai) return;
      clearTimer();
      setPhase("adaptive_grading");
      setError(null);
      try {
        let graded: Pick<AnsweredQuestion, "score" | "feedback" | "missed" | "perfectAnswer">;

        if (isStatic && quizBank) {
          const bankQ = quizBank.find((q) => q.question === question.question);
          if (bankQ) {
            graded = gradeStaticQuestion(bankQ, userAnswer);
          } else {
            graded = gradeLocalAnswer(question, userAnswer);
          }
        } else {
          const needsAI = !question.correctAnswer ||
            (question.format !== "mcq" &&
              question.format !== "true_false" &&
              question.format !== "fill_blank");

          if (needsAI) {
            const { system, user } = quizGradingPrompt(question.question, userAnswer, question.difficulty);
            const result = await ai.generateStructured(
              user,
              system,
              (text) => {
                const parsed = JSON.parse(extractJSON(text)) as Record<string, unknown>;
                return {
                  score: Math.min(10, Math.max(0, Number(parsed.score))),
                  feedback: String(parsed.feedback ?? ""),
                  missed: Array.isArray(parsed.missed) ? (parsed.missed as unknown[]).map(String) : [],
                  perfectAnswer: String(parsed.perfectAnswer ?? ""),
                };
              },
              { temperature: 0.2 }
            );
            graded = result;
          } else {
            graded = gradeLocalAnswer(question, userAnswer);
          }
        }

        const answered: AnsweredQuestion = { ...question, userAnswer, ...graded };
        setCurrentAnswer(answered);

        const newAnswers = [...adaptiveAnswers, answered];
        setAdaptiveAnswers(newAnswers);
        allAnswers.current = newAnswers;

        const isLow = graded.score < 7;
        const newConsecutiveLow = isLow ? consecutiveLow + 1 : 0;
        setConsecutiveLow(newConsecutiveLow);

        const { nextLevel, breakingPoint } = getNextLevel(
          currentLevel,
          graded.score,
          isLow ? consecutiveLow : 0
        );

        if (breakingPoint || newAnswers.length >= SESSION_CAP) {
          if (breakingPoint) setBreakingPointLevel(currentLevel);
          setPhase("adaptive_grading");
        } else {
          setCurrentLevel(nextLevel);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Grading failed");
        setPhase("adaptive_answering");
      }
    },
    [ai, adaptiveAnswers, consecutiveLow, currentLevel, isStatic, quizBank, clearTimer]
  );

  // ── Skip question ─────────────────────────────────────────────────────────────

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    clearTimer();
    const skippedAnswer: AnsweredQuestion = {
      ...currentQuestion,
      userAnswer: "[skipped]",
      score: 0,
      feedback: "Question skipped.",
      missed: [],
      perfectAnswer: currentQuestion.correctAnswer ?? "",
    };

    const newAnswers = [...adaptiveAnswers, skippedAnswer];
    setAdaptiveAnswers(newAnswers);
    allAnswers.current = newAnswers;
    setCurrentAnswer(skippedAnswer);

    const { nextLevel, breakingPoint } = getNextLevel(currentLevel, 5, 0);
    if (breakingPoint || newAnswers.length >= SESSION_CAP) {
      if (breakingPoint) setBreakingPointLevel(currentLevel);
    } else {
      setCurrentLevel(nextLevel);
    }
    setPhase("adaptive_grading");
  }, [adaptiveAnswers, currentLevel, currentQuestion, clearTimer]);

  // ── After seeing grade result, decide what to do next ───────────────────────

  const handleNextAfterGrade = useCallback(async () => {
    const answers = allAnswers.current;
    const isAtCap = answers.length >= SESSION_CAP;
    const isBreaking = breakingPointLevel !== null;

    if (isAtCap || isBreaking) {
      await finalizeQuiz(answers, isBreaking ? currentLevel : null);
    } else {
      setCurrentAnswer(null);
      setCurrentQuestion(null);
      generateAdaptiveQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakingPointLevel, currentLevel, generateAdaptiveQuestion]);

  const finalizeQuiz = useCallback(
    async (answers: AnsweredQuestion[], bpLevel: BloomLevel | null) => {
      const result = calculateQuizResult(answers, bpLevel);
      setQuizResult(result);

      await db.quizAttempts.add({
        topicId,
        score: Math.round(result.averageScore * 10),
        difficulty: String(result.highestLevel),
        questions: answers.map((a) => ({
          question: a.question,
          userAnswer: a.userAnswer,
          score: a.score,
          feedback: a.feedback,
          difficulty: String(a.difficulty),
          format: a.format,
        })),
        completedAt: new Date(),
      });

      await updateFlashcardsFromQuiz(topicId, answers);

      await generateFlashcardsFromQuiz(
        topicId,
        answers.map((a) => ({
          question: a.question,
          score: a.score,
          feedback: a.feedback,
          perfectAnswer: a.perfectAnswer,
        }))
      );

      if (result.xpEarned > 0) addXP(result.xpEarned);
      if (result.coinsEarned > 0) addCoins(result.coinsEarned, "quiz_perfect");

      const storeState = useStore.getState();
      const stats = await getUserStats({
        currentStreak: storeState.currentStreak,
        longestStreak: storeState.longestStreak,
        totalXP: storeState.totalXP,
        level: storeState.level,
      });
      await checkAndUnlockBadges(stats);

      const newRoundsCompleted = roundsCompleted + 1;
      setRoundsCompleted(newRoundsCompleted);
      if (shouldDropChest(newRoundsCompleted, lastChestRound)) {
        setLastChestRound(newRoundsCompleted);
        try {
          const chestId = await recordChest();
          setActiveChestId(chestId);
        } catch {
          // Non-critical
        }
      }

      const lastQuizScore = Math.round(result.averageScore * 10);
      const xpProgress = xpProgressInLevel(storeState.totalXP + result.xpEarned);
      const xpToNextLevel = xpProgress.needed - xpProgress.current;

      let inSessionStreak = 0;
      for (let i = answers.length - 1; i >= 0; i--) {
        if (answers[i].score >= 7) inSessionStreak++;
        else break;
      }

      const trigger = checkOneMoreRound({
        lastQuizScore,
        xpToNextLevel,
        badgesNearUnlock: 0,
        inSessionStreak,
        dailyChallengeAvailable: false,
        decayedTopicCount: 0,
        consecutivePrompts,
      });
      setOneMoreRoundTrigger(trigger);

      if (bpLevel !== null) {
        setPhase("breaking_point");
      } else {
        setPhase("result");
      }
    },
    [addCoins, addXP, topicId, roundsCompleted, lastChestRound, consecutivePrompts]
  );

  // ── Trigger adaptive question load when entering adaptive_loading ────────────

  useEffect(() => {
    if (phase === "adaptive_loading") {
      generateAdaptiveQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "adaptive_loading"]);

  // ── Start timer when a new answering phase begins ────────────────────────────

  useEffect(() => {
    if (!quizTimerEnabled) return;
    if (phase !== "adaptive_answering" && phase !== "calibration_answering") return;

    const q = phase === "adaptive_answering" ? currentQuestion : calibQuestions[calibIndex];
    if (!q) return;

    const isMCQorTF = q.format === "mcq" || q.format === "true_false" || q.format === "fill_blank";
    const duration = isMCQorTF ? TIMER_MCQ : TIMER_OPEN;

    const submitOnExpire = () => {
      // Auto-submit with "[time_expired]" so it scores 0 gracefully
      if (phase === "adaptive_answering" && currentQuestion) {
        gradeAdaptiveAnswer(currentQuestion, "[time_expired]");
      } else if (phase === "calibration_answering" && calibQuestions[calibIndex]) {
        gradeCalibrationAnswer(calibQuestions[calibIndex], "[time_expired]");
      }
    };

    startTimer(duration, submitOnExpire);
    return () => clearTimer();
    // Only re-run when question or phase changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQuestion?.question, calibIndex, quizTimerEnabled]);

  // ── Retry ────────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    clearTimer();
    setAdaptiveQuestions([]);
    setAdaptiveAnswers([]);
    allAnswers.current = [];
    setCurrentQuestion(null);
    setCurrentAnswer(null);
    setConsecutiveLow(0);
    setBreakingPointLevel(null);
    setQuizResult(null);
    setOneMoreRoundTrigger(null);
    setActiveChestId(null);
    const savedScores = existingCalibration?.questions?.map((q) => q.score) ?? [];
    const startLevel = savedScores.length > 0
      ? getStartingLevelFromCalibration(savedScores)
      : 1;
    setCurrentLevel(startLevel);
    setPhase("adaptive_loading");
  }, [existingCalibration, clearTimer]);

  // ── One More Round handlers ──────────────────────────────────────────────────

  const handleOneMoreRoundAccept = useCallback(() => {
    setConsecutivePrompts((p) => p + 1);
    setOneMoreRoundTrigger(null);
    handleRetry();
  }, [handleRetry]);

  const handleOneMoreRoundDismiss = useCallback(() => {
    setConsecutivePrompts(0);
    setOneMoreRoundTrigger(null);
  }, []);

  // ── Treasure chest handlers ──────────────────────────────────────────────────

  const handleChestClaim = useCallback(
    (reward: ChestReward) => {
      if (reward.coins > 0) addCoins(reward.coins, "treasure_chest");
    },
    [addCoins]
  );

  const handleChestDismiss = useCallback(() => {
    setActiveChestId(null);
  }, []);

  // ── Calibration answer submission ─────────────────────────────────────────────

  const handleCalibrationAnswer = useCallback(
    (answer: string) => {
      if (!calibQuestions[calibIndex]) return;
      gradeCalibrationAnswer(calibQuestions[calibIndex], answer);
    },
    [calibIndex, calibQuestions, gradeCalibrationAnswer]
  );

  // ── Adaptive answer submission ────────────────────────────────────────────────

  const handleAdaptiveAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;
      gradeAdaptiveAnswer(currentQuestion, answer);
    },
    [currentQuestion, gradeAdaptiveAnswer]
  );

  // ── Computed values for progress/score display ───────────────────────────────

  const cumulativeScore = adaptiveAnswers.reduce((s, a) => s + a.score, 0);
  const maxPossibleScore = adaptiveAnswers.length * 10;

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === "checking") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const errorBanner = error && (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="size-4 mt-0.5 shrink-0" />
      <span>{error}</span>
      <button
        type="button"
        onClick={() => setError(null)}
        className="ml-auto text-xs underline shrink-0"
      >
        Dismiss
      </button>
    </div>
  );

  // ── Calibration intro ────────────────────────────────────────────────────────
  if (phase === "calibration_intro") {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {errorBanner}
        {/* Timer toggle on intro screen */}
        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Timer className="size-4 text-saffron" />
            <div>
              <p className="text-sm font-medium">Question Timer</p>
              <p className="text-xs text-muted-foreground">
                60s for MCQ, 120s for open-ended
              </p>
            </div>
          </div>
          <TimerToggle enabled={quizTimerEnabled} onChange={setQuizTimerEnabled} />
        </div>
        <CalibrationIntro topicName={topicName} onStart={startCalibration} />
      </div>
    );
  }

  // ── Calibration loading ──────────────────────────────────────────────────────
  if (phase === "calibration_loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-20">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">Preparing calibration questions…</p>
      </div>
    );
  }

  // ── Calibration answering ────────────────────────────────────────────────────
  if (phase === "calibration_answering" && calibQuestions[calibIndex]) {
    const q = calibQuestions[calibIndex];
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {errorBanner}

        {/* Progress + timer row */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <QuizProgressBar
              current={calibIndex + 1}
              total={calibQuestions.length}
              score={0}
              maxScore={0}
            />
          </div>
          {quizTimerEnabled && timerTotal > 0 && (
            <CountdownTimer total={timerTotal} remaining={timerRemaining} />
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Calibration</span>
          <span>Finding your level…</span>
        </div>

        <QuestionCard
          question={q}
          questionNumber={calibIndex + 1}
          totalQuestions={calibQuestions.length}
        />
        <AnswerInput question={q} onSubmit={handleCalibrationAnswer} />
      </div>
    );
  }

  // ── Calibration grading ──────────────────────────────────────────────────────
  if (phase === "calibration_grading") {
    if (!calibCurrentAnswer) {
      return (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="size-8 animate-spin text-saffron" />
          <p className="text-sm text-muted-foreground">Grading your answer…</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <GradeResult
          answer={calibCurrentAnswer}
          xpEarned={0}
          onNext={advanceCalibration}
          isLast={calibIndex + 1 >= calibQuestions.length}
        />
      </div>
    );
  }

  // ── Adaptive loading ─────────────────────────────────────────────────────────
  if (phase === "adaptive_loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Generating question…</p>
          <p className="text-xs text-muted-foreground mt-1">
            Level {currentLevel} — {BLOOM_LABELS[currentLevel]}
          </p>
        </div>
      </div>
    );
  }

  // ── Adaptive answering ───────────────────────────────────────────────────────
  if (phase === "adaptive_answering" && currentQuestion) {
    const qNum = adaptiveAnswers.length + 1;
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {errorBanner}

        {/* Progress bar + timer */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <QuizProgressBar
              current={qNum}
              total={SESSION_CAP}
              score={cumulativeScore}
              maxScore={maxPossibleScore}
            />
          </div>
          {quizTimerEnabled && timerTotal > 0 && (
            <CountdownTimer total={timerTotal} remaining={timerRemaining} />
          )}
        </div>

        {/* Difficulty indicator */}
        <div className="flex items-center justify-between px-1">
          <DifficultyIndicator currentLevel={currentLevel} />
          <span className="text-xs text-muted-foreground">
            {adaptiveAnswers.length} / {SESSION_CAP}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.question.substring(0, 20)}
            question={currentQuestion}
            questionNumber={qNum}
            totalQuestions={SESSION_CAP}
          />
        </AnimatePresence>
        <AnswerInput
          question={currentQuestion}
          onSubmit={handleAdaptiveAnswer}
          onSkip={handleSkip}
        />
      </div>
    );
  }

  // ── Adaptive grading ─────────────────────────────────────────────────────────
  if (phase === "adaptive_grading") {
    if (!currentAnswer) {
      return (
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="size-8 animate-spin text-saffron" />
          <p className="text-sm text-muted-foreground">Grading your answer…</p>
        </div>
      );
    }
    const isLastQ =
      breakingPointLevel !== null || adaptiveAnswers.length >= SESSION_CAP;
    const xpForThis =
      currentAnswer.score >= 10 ? 25
      : currentAnswer.score >= 8 ? 15
      : currentAnswer.score >= 5 ? 10
      : 0;
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {errorBanner}

        {/* Score progress shown during grading */}
        <QuizProgressBar
          current={adaptiveAnswers.length}
          total={SESSION_CAP}
          score={cumulativeScore}
          maxScore={adaptiveAnswers.length * 10}
        />

        <GradeResult
          answer={currentAnswer}
          xpEarned={xpForThis}
          onNext={handleNextAfterGrade}
          isLast={isLastQ}
        />
      </div>
    );
  }

  // ── Breaking point ────────────────────────────────────────────────────────────
  if (phase === "breaking_point") {
    return (
      <div className="flex flex-col items-center gap-5 py-8 max-w-xl mx-auto text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/30">
          <Zap className="size-10 text-destructive" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold">Breaking Point!</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            You&apos;ve hit your current limit at{" "}
            <span className="font-semibold text-destructive">
              Level {breakingPointLevel} — {BLOOM_LABELS[breakingPointLevel!]}
            </span>
            . That&apos;s completely normal — this is where growth happens.
          </p>
        </div>
        <Card className="w-full">
          <CardContent className="pt-4 text-sm text-muted-foreground">
            The quiz will now show your results. Review the weak areas and come
            back to push further.
          </CardContent>
        </Card>
        <Button
          onClick={() => setPhase("result")}
          className="w-full max-w-xs"
          size="lg"
        >
          See My Results
        </Button>
      </div>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === "result" && quizResult) {
    return (
      <div className="max-w-xl mx-auto">
        {activeChestId !== null && (
          <TreasureChest
            chestId={activeChestId}
            onClaim={handleChestClaim}
            onDismiss={handleChestDismiss}
          />
        )}

        <QuizResultScreen
          result={quizResult}
          answers={allAnswers.current}
          topicId={topicId}
          topicName={topicName}
          onRetry={handleRetry}
        />

        <OneMoreRound
          trigger={oneMoreRoundTrigger}
          onAccept={handleOneMoreRoundAccept}
          onDismiss={handleOneMoreRoundDismiss}
        />
      </div>
    );
  }

  // Fallback loading
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
