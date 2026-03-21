"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw, Zap } from "lucide-react";
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
import { calibrationPrompt } from "@/lib/prompts/quiz-calibration";
import { quizQuestionPrompt, quizGradingPrompt } from "@/lib/prompts/quiz-generator";
import { getNextLevel, calculateQuizResult, getStartingLevelFromCalibration } from "@/lib/quiz/engine";
import { updateFlashcardsFromQuiz } from "@/lib/quiz/spaced-repetition-bridge";
import { getUserStats, checkAndUnlockBadges } from "@/lib/gamification/badges";
import { BLOOM_LABELS, type BloomLevel, type GeneratedQuestion, type AnsweredQuestion, type QuizResult } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

const SESSION_CAP = 15;
const CALIBRATION_COUNT = 5;

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
  const { addXP, addCoins } = useStore((s) => ({
    addXP: s.addXP,
    addCoins: s.addCoins,
  }));

  // Dexie live query to detect existing calibration
  const existingCalibration = useLiveQuery(
    () => db.quizAttempts.where({ topicId }).first(),
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

  const allAnswers = useRef<AnsweredQuestion[]>([]);

  // ── Effect: determine initial phase ─────────────────────────────────────────

  useEffect(() => {
    if (phase !== "checking") return;
    if (existingCalibration === undefined) return; // still loading
    if (existingCalibration === null) {
      setPhase("calibration_intro");
    } else {
      // Has calibration — start adaptive directly at level 1
      setCurrentLevel(1);
      setPhase("adaptive_loading");
    }
  }, [existingCalibration, phase]);

  // ── Calibration: generate questions ─────────────────────────────────────────

  const startCalibration = useCallback(async () => {
    if (!ai) return;
    setPhase("calibration_loading");
    setError(null);
    try {
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
  }, [ai, topicName]);

  // ── Calibration: grade answer ────────────────────────────────────────────────

  const gradeCalibrationAnswer = useCallback(
    async (question: GeneratedQuestion, userAnswer: string) => {
      if (!ai) return;
      setPhase("calibration_grading");
      setError(null);
      try {
        let graded: Pick<AnsweredQuestion, "score" | "feedback" | "missed" | "perfectAnswer">;

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

        const answered: AnsweredQuestion = { ...question, userAnswer, ...graded };
        setCalibCurrentAnswer(answered);

        const newScores = [...calibScores, graded.score];
        setCalibScores(newScores);

        if (calibIndex + 1 >= calibQuestions.length) {
          // Calibration done — save attempt and move to adaptive
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
    [ai, calibIndex, calibQuestions, calibScores, topicId]
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
      const formats: Array<GeneratedQuestion["format"]> = [
        "mcq", "open_ended", "scenario", "code_review", "predict_output",
        "fill_blank", "true_false", "ordering",
      ];
      const format = formats[Math.floor(Math.random() * formats.length)];
      const { system, user } = quizQuestionPrompt(topicName, currentLevel, format, prevQs);

      const question = await ai.generateStructured<GeneratedQuestion>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as GeneratedQuestion;
          if (!parsed.question) throw new Error("Invalid question response");
          return parsed;
        },
        { temperature: 0.8 }
      );
      setCurrentQuestion(question);
      setAdaptiveQuestions((prev) => [...prev, question]);
      setPhase("adaptive_answering");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question");
    }
  }, [ai, adaptiveQuestions, currentLevel, topicName]);

  // ── Adaptive: grade answer ───────────────────────────────────────────────────

  const gradeAdaptiveAnswer = useCallback(
    async (question: GeneratedQuestion, userAnswer: string) => {
      if (!ai) return;
      setPhase("adaptive_grading");
      setError(null);
      try {
        let graded: Pick<AnsweredQuestion, "score" | "feedback" | "missed" | "perfectAnswer">;

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

        const answered: AnsweredQuestion = { ...question, userAnswer, ...graded };
        setCurrentAnswer(answered);

        const newAnswers = [...adaptiveAnswers, answered];
        setAdaptiveAnswers(newAnswers);
        allAnswers.current = newAnswers;

        // Adaptive difficulty logic
        const isLow = graded.score < 7;
        const newConsecutiveLow = isLow ? consecutiveLow + 1 : 0;
        setConsecutiveLow(newConsecutiveLow);

        const { nextLevel, breakingPoint } = getNextLevel(
          currentLevel,
          graded.score,
          isLow ? consecutiveLow : 0 // pass previous consecutive low count
        );

        if (breakingPoint || newAnswers.length >= SESSION_CAP) {
          if (breakingPoint) setBreakingPointLevel(currentLevel);
          setPhase("adaptive_grading"); // stay to show grade result first
        } else {
          setCurrentLevel(nextLevel);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Grading failed");
        setPhase("adaptive_answering");
      }
    },
    [ai, adaptiveAnswers, consecutiveLow, currentLevel]
  );

  // ── After seeing grade result, decide what to do next ───────────────────────

  const handleNextAfterGrade = useCallback(async () => {
    const answers = allAnswers.current;
    const isAtCap = answers.length >= SESSION_CAP;
    const isBreaking = breakingPointLevel !== null;

    if (isAtCap || isBreaking) {
      // Complete quiz
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

      // Persist quiz attempt
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

      // Update flashcards for spaced repetition
      await updateFlashcardsFromQuiz(topicId, answers);

      // Award XP and coins
      if (result.xpEarned > 0) addXP(result.xpEarned);
      if (result.coinsEarned > 0) addCoins(result.coinsEarned, "quiz_perfect");

      // Check badge unlocks
      const storeState = useStore.getState();
      const stats = await getUserStats({
        currentStreak: storeState.currentStreak,
        longestStreak: storeState.longestStreak,
        totalXP: storeState.totalXP,
        level: storeState.level,
      });
      await checkAndUnlockBadges(stats);

      if (bpLevel !== null) {
        setPhase("breaking_point");
      } else {
        setPhase("result");
      }
    },
    [addCoins, addXP, topicId]
  );

  // ── Trigger adaptive question load when entering adaptive_loading ────────────

  useEffect(() => {
    if (phase === "adaptive_loading") {
      generateAdaptiveQuestion();
    }
    // Only fire when phase changes to adaptive_loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "adaptive_loading"]);

  // ── Retry ────────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(() => {
    setAdaptiveQuestions([]);
    setAdaptiveAnswers([]);
    allAnswers.current = [];
    setCurrentQuestion(null);
    setCurrentAnswer(null);
    setConsecutiveLow(0);
    setBreakingPointLevel(null);
    setQuizResult(null);
    setCurrentLevel(1);
    setPhase("adaptive_loading");
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

  // ── Render ──────────────────────────────────────────────────────────────────

  // Still loading Dexie check
  if (phase === "checking") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error banner
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
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Calibration — Question {calibIndex + 1} of {calibQuestions.length}</span>
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
    const xpForThis = currentAnswer.score >= 10 ? 25 : currentAnswer.score >= 8 ? 15 : currentAnswer.score >= 5 ? 10 : 0;
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {errorBanner}
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
        <QuizResultScreen
          result={quizResult}
          answers={allAnswers.current}
          topicId={topicId}
          onRetry={handleRetry}
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
