"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GeneratedQuestion } from "@/lib/quiz/types";
import { useStore } from "@/lib/store";

// CodeViewer is lazily loaded so Monaco never runs on the server
const CodeViewer = dynamic(
  () => import("@/components/code-playground").then((m) => m.CodeViewer),
  { ssr: false }
);

// Extract the first fenced code block from a markdown string
function extractCodeBlock(md: string): { code: string; lang: string } | null {
  const match = md.match(/```(\w*)\n([\s\S]*?)```/);
  if (!match) return null;
  const lang = match[1].toLowerCase() || "javascript";
  const code = match[2].trim();
  return { code, lang };
}

interface AnswerInputProps {
  question: GeneratedQuestion;
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
}

// Picks one wrong MCQ option letter to eliminate using a hint token.
function pickEliminatedOption(
  options: string[],
  correctAnswer: string
): string | null {
  const wrongLetters = options
    .map((o) => o.charAt(0))
    .filter((l) => l !== correctAnswer.toUpperCase());
  if (wrongLetters.length === 0) return null;
  return wrongLetters[Math.floor(Math.random() * wrongLetters.length)];
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

// Letter badge colors — each option gets a distinct accent
const LETTER_BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/50" },
  B: { bg: "bg-violet-500/20", text: "text-violet-400", border: "border-violet-500/50" },
  C: { bg: "bg-cyan-500/20",   text: "text-cyan-400",   border: "border-cyan-500/50"   },
  D: { bg: "bg-amber-500/20",  text: "text-amber-400",  border: "border-amber-500/50"  },
  E: { bg: "bg-rose-500/20",   text: "text-rose-400",   border: "border-rose-500/50"   },
};

export function AnswerInput({ question, onSubmit, onSkip, disabled }: AnswerInputProps) {
  const hintTokens = useStore((s) => s.hintTokens);
  const useHintToken = useStore((s) => s.useHintToken);
  const [selected, setSelected] = useState<string>("");
  const [eliminatedOption, setEliminatedOption] = useState<string | null>(null);

  // Reset state whenever the question changes
  useEffect(() => {
    setEliminatedOption(null);
    setSelected("");
  }, [question.question]);

  function handleUseHint() {
    if (
      question.format !== "mcq" ||
      !question.options ||
      !question.correctAnswer ||
      eliminatedOption
    )
      return;
    const success = useHintToken();
    if (!success) return;
    const toEliminate = pickEliminatedOption(question.options, question.correctAnswer);
    setEliminatedOption(toEliminate);
  }

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
    const canUseHint =
      hintTokens > 0 && !!question.correctAnswer && !eliminatedOption && !disabled;
    return (
      <div className="flex flex-col gap-3">
        <div className="grid gap-2.5">
          {question.options.map((option, idx) => {
            const letter = option.charAt(0); // "A", "B", etc.
            const isSelected = selected === letter;
            const isEliminated = eliminatedOption === letter;
            const badge = LETTER_BADGE_COLORS[letter] ?? LETTER_BADGE_COLORS["A"];

            return (
              <motion.button
                key={option}
                type="button"
                disabled={disabled || isEliminated}
                onClick={() => !isEliminated && setSelected(letter)}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isEliminated ? 0.3 : 1, x: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.04 }}
                whileHover={
                  !disabled && !isEliminated
                    ? { scale: 1.012, transition: { duration: 0.12 } }
                    : {}
                }
                whileTap={!disabled && !isEliminated ? { scale: 0.985 } : {}}
                className={cn(
                  // base
                  "group relative flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-150",
                  // equal height
                  "min-h-[56px]",
                  // eliminated
                  isEliminated && "line-through cursor-not-allowed",
                  // selected state — saffron border + bg glow
                  isSelected
                    ? "border-saffron bg-saffron/10 shadow-[0_0_0_1px_hsl(var(--saffron)/0.4)] text-foreground"
                    : "border-border bg-card text-foreground",
                  // hover glow (only when not selected/eliminated/disabled)
                  !isSelected && !isEliminated && !disabled &&
                    "hover:border-saffron/40 hover:bg-saffron/5 hover:shadow-[0_0_0_1px_hsl(var(--saffron)/0.2)]",
                  "disabled:pointer-events-none"
                )}
              >
                {/* Letter badge */}
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors duration-150",
                    isSelected
                      ? "border-saffron bg-saffron text-background"
                      : cn(badge.bg, badge.text, badge.border, "border")
                  )}
                >
                  {letter}
                </span>

                {/* Option text */}
                <span className="flex-1 leading-snug">{option.substring(3)}</span>

                {/* Keyboard hint */}
                {keyHints[letter] && !isEliminated && (
                  <span className="shrink-0 self-center rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px] text-muted-foreground tabular-nums opacity-60 group-hover:opacity-100 transition-opacity">
                    {keyHints[letter]}
                  </span>
                )}

                {/* Selected check indicator */}
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="shrink-0 flex size-5 items-center justify-center rounded-full bg-saffron text-background text-[11px] font-bold"
                  >
                    ✓
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Hint token button */}
        {(canUseHint || eliminatedOption) && (
          <button
            type="button"
            onClick={handleUseHint}
            disabled={!canUseHint}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs transition-colors",
              canUseHint
                ? "border-saffron/50 text-saffron hover:bg-saffron/10 cursor-pointer"
                : "border-border/40 text-muted-foreground cursor-default"
            )}
          >
            <span>💡</span>
            {eliminatedOption
              ? "One wrong answer eliminated"
              : `Use hint token (${hintTokens} left) — eliminate a wrong answer`}
          </button>
        )}

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
            <motion.button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => setSelected(value)}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              className={cn(
                "relative rounded-xl border p-4 text-center text-base font-semibold transition-all duration-150 min-h-[56px]",
                "disabled:pointer-events-none disabled:opacity-50",
                selected === value
                  ? "border-saffron bg-saffron/10 text-saffron shadow-[0_0_0_1px_hsl(var(--saffron)/0.4)]"
                  : "border-border bg-card text-foreground hover:border-saffron/40 hover:bg-saffron/5"
              )}
            >
              {value}
              <span className="absolute right-2 top-2 rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-[10px] text-muted-foreground">
                {tfHints[value]}
              </span>
            </motion.button>
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

  // For code-centric formats, extract and show a syntax-highlighted code viewer
  const isCodeFormat =
    question.format === "code_review" || question.format === "predict_output";
  const codeSnippet = isCodeFormat ? extractCodeBlock(question.question) : null;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Code snippet viewer (for code_review & predict_output) ─────────── */}
      {codeSnippet && (
        <CodeViewer
          code={codeSnippet.code}
          language={
            codeSnippet.lang === "typescript" || codeSnippet.lang === "ts"
              ? "typescript"
              : codeSnippet.lang === "python" || codeSnippet.lang === "py"
              ? "python"
              : "javascript"
          }
          height={180}
          className="mb-1"
        />
      )}
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
