"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ChevronDown, ChevronUp, Star, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnsweredQuestion } from "@/lib/quiz/types";

interface GradeResultProps {
  answer: AnsweredQuestion;
  xpEarned: number;
  onNext: () => void;
  isLast?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 7) return "text-teal";
  if (score >= 4) return "text-gold";
  return "text-destructive";
}

function getScoreBg(score: number): string {
  if (score >= 7) return "bg-teal/10 border-teal/30";
  if (score >= 4) return "bg-gold/10 border-gold/30";
  return "bg-destructive/10 border-destructive/30";
}

function getScoreLabel(score: number): string {
  if (score >= 9) return "Excellent!";
  if (score >= 7) return "Good work";
  if (score >= 4) return "Partially correct";
  return "Needs improvement";
}

// Motivational messages for MCQ outcomes
function getMCQMotivation(correct: boolean): { headline: string; sub: string } {
  if (correct) {
    const headlines = ["You got it!", "Nailed it!", "Spot on!", "Perfect pick!"];
    const subs = [
      "Your knowledge is sharp — keep it up!",
      "That confidence is well-earned.",
      "One step closer to mastery.",
      "Great reasoning!",
    ];
    const i = Math.floor(Math.random() * headlines.length);
    return { headline: headlines[i], sub: subs[i] };
  } else {
    const headlines = ["Almost!", "Not quite — but you'll get it!", "Good try!", "Keep going!"];
    const subs = [
      "Review why the correct answer is right and move on stronger.",
      "Every mistake is a lesson in disguise.",
      "Check the explanation below — it clicks fast.",
      "Mistakes are how mastery is built.",
    ];
    const i = Math.floor(Math.random() * headlines.length);
    return { headline: headlines[i], sub: subs[i] };
  }
}

// ── Confetti particle for correct answers ────────────────────────────────────

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

// CSS variables already contain full hsl() values, so use var() directly
const CONFETTI_COLORS = [
  "var(--saffron)",
  "var(--gold)",
  "var(--teal)",
  "#a78bfa",
  "#34d399",
  "#f472b6",
];

function ConfettiBurst({ active }: { active: boolean }) {
  const [particles] = useState<ConfettiParticle[]>(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: Math.random() * 0.3,
      duration: 0.7 + Math.random() * 0.5,
      size: 5 + Math.random() * 6,
    }))
  );

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, y: -10, x: `${p.x}%`, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            y: 80 + Math.random() * 40,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            scale: 0.3,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: 0,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

// ── MCQ All-options review panel ─────────────────────────────────────────────

interface MCQReviewProps {
  options: string[];
  correctAnswer: string;       // letter, e.g. "B"
  userAnswer: string;          // letter, e.g. "A"
}

function MCQReview({ options, correctAnswer, userAnswer }: MCQReviewProps) {
  const correct = correctAnswer.trim().toUpperCase();
  const chosen = userAnswer.trim().toUpperCase();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
        All options
      </p>
      {options.map((option) => {
        const letter = option.charAt(0).toUpperCase();
        const text = option.substring(3);
        const isCorrect = letter === correct;
        const isWrongPick = letter === chosen && letter !== correct;
        const isNeutral = !isCorrect && !isWrongPick;

        return (
          <motion.div
            key={option}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18, delay: options.indexOf(option) * 0.05 }}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-sm",
              isCorrect && "border-teal/40 bg-teal/10",
              isWrongPick && "border-destructive/40 bg-destructive/10",
              isNeutral && "border-border/40 bg-muted/20 opacity-60"
            )}
          >
            {/* Letter badge */}
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold",
                isCorrect && "border-teal/60 bg-teal/20 text-teal",
                isWrongPick && "border-destructive/60 bg-destructive/20 text-destructive",
                isNeutral && "border-border/50 bg-muted/30 text-muted-foreground"
              )}
            >
              {letter}
            </span>

            {/* Text */}
            <span
              className={cn(
                "flex-1 leading-snug",
                isCorrect && "text-foreground font-medium",
                isWrongPick && "text-foreground",
                isNeutral && "text-muted-foreground"
              )}
            >
              {text}
            </span>

            {/* Icon */}
            {isCorrect && (
              <CheckCircle className="size-4 shrink-0 text-teal mt-0.5" />
            )}
            {isWrongPick && (
              <XCircle className="size-4 shrink-0 text-destructive mt-0.5" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GradeResult({ answer, xpEarned, onNext, isLast }: GradeResultProps) {
  const [showPerfect, setShowPerfect] = useState(false);
  const [confettiDone, setConfettiDone] = useState(false);

  const isMCQ = answer.format === "mcq" && !!answer.options && !!answer.correctAnswer;
  const isMCQCorrect = isMCQ && answer.score >= 7;
  const motivation = isMCQ ? getMCQMotivation(isMCQCorrect) : null;

  // Confetti fires once per correct MCQ answer
  useEffect(() => {
    if (isMCQCorrect) {
      const t = setTimeout(() => setConfettiDone(true), 1800);
      return () => clearTimeout(t);
    }
  }, [isMCQCorrect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4"
      role="status"
      aria-live="polite"
      aria-label={`Score: ${answer.score} out of 10. ${getScoreLabel(answer.score)}`}
    >
      {/* ── MCQ motivational banner ─────────────────────────────────────────── */}
      {motivation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "relative overflow-hidden rounded-xl border px-5 py-4 text-center",
            isMCQCorrect
              ? "border-teal/30 bg-teal/10"
              : "border-gold/30 bg-gold/10"
          )}
        >
          <ConfettiBurst active={isMCQCorrect && !confettiDone} />

          <div className="flex flex-col items-center gap-1">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="text-3xl mb-1"
            >
              {isMCQCorrect ? "🎉" : "💡"}
            </motion.span>
            <p
              className={cn(
                "text-lg font-heading font-bold",
                isMCQCorrect ? "text-teal" : "text-gold"
              )}
            >
              {motivation.headline}
            </p>
            <p className="text-xs text-muted-foreground">{motivation.sub}</p>
          </div>
        </motion.div>
      )}

      {/* ── Score circle ────────────────────────────────────────────────────── */}
      <Card className={cn("border", getScoreBg(answer.score))}>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-16 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold",
                getScoreBg(answer.score),
                getScoreColor(answer.score)
              )}
            >
              {answer.score}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "text-base font-semibold",
                    getScoreColor(answer.score)
                  )}
                >
                  {getScoreLabel(answer.score)}
                </span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
              {xpEarned > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="mt-1 flex items-center gap-1 text-sm font-medium text-gold"
                >
                  <Star className="size-3.5 fill-gold" />
                  +{xpEarned} XP
                </motion.div>
              )}
            </div>
            {answer.score >= 7 ? (
              <CheckCircle className="size-6 shrink-0 text-teal" />
            ) : (
              <AlertCircle className="size-6 shrink-0 text-destructive" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── MCQ all-options review ───────────────────────────────────────────── */}
      {isMCQ && answer.options && answer.correctAnswer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Answer Review</CardTitle>
          </CardHeader>
          <CardContent>
            <MCQReview
              options={answer.options}
              correctAnswer={answer.correctAnswer}
              userAnswer={answer.userAnswer}
            />
          </CardContent>
        </Card>
      )}

      {/* ── Feedback ────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed">
            <MarkdownRenderer content={answer.feedback || ""} />
          </div>
        </CardContent>
      </Card>

      {/* ── What you missed (non-MCQ or extra notes) ────────────────────────── */}
      {answer.missed.length > 0 && !isMCQ && (
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="text-sm text-gold">What you missed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {answer.missed.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Perfect answer (collapsible) — hidden for MCQ where review shows it */}
      {!isMCQ && (
        <Card>
          <button
            type="button"
            onClick={() => setShowPerfect((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>See perfect answer</span>
            {showPerfect ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {showPerfect && (
              <motion.div
                key="perfect"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent>
                  <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed">
                    <MarkdownRenderer content={answer.perfectAnswer || ""} />
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* ── Next button ─────────────────────────────────────────────────────── */}
      <Button onClick={onNext} className="w-full" size="lg">
        {isLast ? "See Results" : "Next Question"}
      </Button>
    </motion.div>
  );
}
