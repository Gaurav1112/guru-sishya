"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedQuestion } from "@/lib/quiz/types";

interface AnswerInputProps {
  question: GeneratedQuestion;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

const OPEN_PLACEHOLDERS: Record<string, string> = {
  code_review: "Describe the bug you found and explain why it is a problem...",
  predict_output:
    "Type the exact output you expect the code to produce, one line per line...",
  scenario:
    "Describe your solution step by step. Be as specific as possible...",
  ordering:
    "List the steps in the correct order, e.g.:\n1. First step\n2. Second step\n...",
  open_ended: "Write your answer here. Be thorough and specific...",
  fill_blank: "Type the word or phrase that fills the blank...",
};

export function AnswerInput({ question, onSubmit, disabled }: AnswerInputProps) {
  const [selected, setSelected] = useState<string>("");

  const handleSubmit = () => {
    if (!selected.trim()) return;
    onSubmit(selected.trim());
    setSelected("");
  };

  if (question.format === "mcq" && question.options) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-2">
          {question.options.map((option) => {
            const letter = option.charAt(0); // "A", "B", etc.
            const isSelected = selected === letter;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(letter)}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-150",
                  "hover:bg-surface-hover hover:border-saffron/50",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected
                    ? "border-saffron bg-saffron/10 text-foreground"
                    : "border-border bg-card text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    isSelected
                      ? "border-saffron bg-saffron text-white"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {letter}
                </span>
                <span className="pt-0.5">{option.substring(3)}</span>
              </button>
            );
          })}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          className="mt-2 w-full"
          size="lg"
        >
          Submit Answer
        </Button>
      </div>
    );
  }

  if (question.format === "true_false") {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {["True", "False"].map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(value)}
              className={cn(
                "rounded-xl border p-4 text-center text-base font-semibold transition-all duration-150",
                "hover:bg-surface-hover hover:border-saffron/50",
                "disabled:pointer-events-none disabled:opacity-50",
                selected === value
                  ? "border-saffron bg-saffron/10 text-saffron"
                  : "border-border bg-card text-foreground"
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          className="w-full"
          size="lg"
        >
          Submit Answer
        </Button>
      </div>
    );
  }

  // Textarea-based formats: fill_blank, open_ended, code_review, predict_output, scenario, ordering
  const placeholder =
    OPEN_PLACEHOLDERS[question.format] ?? "Write your answer here...";
  const minRows =
    question.format === "open_ended" ||
    question.format === "scenario" ||
    question.format === "code_review"
      ? 6
      : 3;

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={minRows}
        className={cn(
          "w-full resize-y rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "font-mono leading-relaxed"
        )}
      />
      <Button
        onClick={handleSubmit}
        disabled={!selected.trim() || disabled}
        className="w-full"
        size="lg"
      >
        Submit Answer
      </Button>
    </div>
  );
}
