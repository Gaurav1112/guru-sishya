"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp, Star, AlertCircle, CheckCircle } from "lucide-react";
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

export function GradeResult({ answer, xpEarned, onNext, isLast }: GradeResultProps) {
  const [showPerfect, setShowPerfect] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4"
    >
      {/* Score circle */}
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

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {answer.feedback}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* What you missed */}
      {answer.missed.length > 0 && (
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

      {/* Perfect answer (collapsible) */}
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
        {showPerfect && (
          <CardContent>
            <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer.perfectAnswer}
              </ReactMarkdown>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Next button */}
      <Button onClick={onNext} className="w-full" size="lg">
        {isLast ? "See Results" : "Next Question"}
      </Button>
    </motion.div>
  );
}
