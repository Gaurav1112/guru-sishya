"use client";

import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DifficultyIndicator } from "./difficulty-indicator";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { GeneratedQuestion } from "@/lib/quiz/types";

interface QuestionCardProps {
  question: GeneratedQuestion;
  questionNumber: number;
  totalQuestions: number;
}

const FORMAT_LABEL: Record<string, string> = {
  mcq: "Multiple Choice",
  code_review: "Code Review",
  predict_output: "Predict Output",
  scenario: "Scenario",
  fill_blank: "Fill in the Blank",
  true_false: "True or False",
  ordering: "Ordering",
  open_ended: "Open Ended",
};

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  return (
    <motion.div
      data-testid="quiz-question"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                Question {questionNumber} of {totalQuestions}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {FORMAT_LABEL[question.format] ?? question.format}
              </span>
            </div>
            <DifficultyIndicator currentLevel={question.difficulty} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none prose-sm prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-muted prose-pre:rounded-lg">
            <MarkdownRenderer content={question.question || ""} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
