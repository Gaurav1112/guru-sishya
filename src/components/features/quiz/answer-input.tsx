"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedQuestion } from "@/lib/quiz/types";

interface AnswerInputProps {
  question: GeneratedQuestion;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
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

export function AnswerInput({ question, onSubmit, onSkip, disabled }: AnswerInputProps) {
  const [selected, setSelected] = useState<string>("");

  const handleSubmit = () => {
    if (!selected.trim()) return;
    onSubmit(selected.trim());
    setSelected("");
  };

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    if (disabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire shortcuts when typing in a textarea or input
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        // Enter in textarea → submit
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleSubmit();
        }
        return;
      }

      if (question.format === "mcq" && question.options) {
        const keyMap: Record<string, string> = {
          "1": "A",
          a: "A",
          "2": "B",
          b: "B",
          "3": "C",
          c: "C",
          "4": "D",
          d: "D",
          "5": "E",
          e: "E",
        };
        const letter = keyMap[e.key.toLowerCase()];
        if (letter) {
          const validLetters = question.options.map((o) => o.charAt(0));
          if (validLetters.includes(letter)) {
            e.preventDefault();
            setSelected(letter);
            return;
          }
        }
      }

      if (question.format === "true_false") {
        if (e.key.toLowerCase() === "t" || e.key === "1") {
          e.preventDefault();
          setSelected("True");
          return;
        }
        if (e.key.toLowerCase() === "f" || e.key === "2") {
          e.preventDefault();
          setSelected("False");
          return;
        }
      }

      // Enter = submit (when answer already selected, not in textarea)
      if (e.key === "Enter" && selected.trim()) {
        e.preventDefault();
        handleSubmit();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, question, selected]);

  // ── Skip button helper ────────────────────────────────────────────────────

  const skipButton = onSkip && (
    <button
      type="button"
      onClick={onSkip}
      disabled={disabled}
      className="mt-1 w-full rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/30 disabled:pointer-events-none disabled:opacity-40"
    >
      Skip this question
    </button>
  );

  // ── MCQ ──────────────────────────────────────────────────────────────────

  if (question.format === "mcq" && question.options) {
    const keyHints: Record<string, string> = { A: "1", B: "2", C: "3", D: "4", E: "5" };
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
                  "flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition-all duration-150 min-h-[48px]",
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
                <span className="pt-0.5 flex-1">{option.substring(3)}</span>
                {/* Keyboard hint */}
                {keyHints[letter] && (
                  <span className="shrink-0 self-center rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {keyHints[letter]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          className="mt-2 w-full sticky bottom-4 md:static md:bottom-auto"
          size="lg"
        >
          Submit Answer
        </Button>
        {skipButton}
      </div>
    );
  }

  // ── True / False ──────────────────────────────────────────────────────────

  if (question.format === "true_false") {
    const tfHints: Record<string, string> = { True: "T", False: "F" };
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
                "relative rounded-xl border p-4 text-center text-base font-semibold transition-all duration-150 min-h-[48px]",
                "hover:bg-surface-hover hover:border-saffron/50",
                "disabled:pointer-events-none disabled:opacity-50",
                selected === value
                  ? "border-saffron bg-saffron/10 text-saffron"
                  : "border-border bg-card text-foreground"
              )}
            >
              {value}
              <span className="absolute right-2 top-2 rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px] text-muted-foreground">
                {tfHints[value]}
              </span>
            </button>
          ))}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled}
          className="w-full sticky bottom-4 md:static md:bottom-auto"
          size="lg"
        >
          Submit Answer
        </Button>
        {skipButton}
      </div>
    );
  }

  // ── Textarea-based formats ────────────────────────────────────────────────

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
        className="w-full sticky bottom-4 md:static md:bottom-auto"
        size="lg"
      >
        Submit Answer
      </Button>
      {skipButton}
    </div>
  );
}
