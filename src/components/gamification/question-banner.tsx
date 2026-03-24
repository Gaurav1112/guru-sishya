"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BannerQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export function QuestionBanner() {
  const [questions, setQuestions] = useState<BannerQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  // Load questions
  useEffect(() => {
    fetch("/content/daily-questions.json")
      .then((r) => r.json())
      .then((data: BannerQuestion[]) => {
        // Pick 20 random questions
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 20));
      })
      .catch(() => {});
  }, []);

  // Auto-rotate every 15 seconds
  useEffect(() => {
    if (questions.length === 0 || showAnswer) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % questions.length);
      setSelected(null);
      setShowAnswer(false);
    }, 15000);
    return () => clearInterval(timer);
  }, [questions.length, showAnswer]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % questions.length);
    setSelected(null);
    setShowAnswer(false);
  }, [questions.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
    setSelected(null);
    setShowAnswer(false);
  }, [questions.length]);

  const handleSelect = (opt: string) => {
    setSelected(opt);
    setShowAnswer(true);
  };

  if (questions.length === 0) return null;

  const q = questions[currentIndex];
  // correctAnswer is a letter like "B", options are "B) Some text..."
  // Match by checking if the selected option starts with the correct letter
  const isCorrect = selected !== null && (
    selected === q.correctAnswer ||
    selected.startsWith(`${q.correctAnswer})`) ||
    selected.startsWith(`${q.correctAnswer} `)
  );

  return (
    <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-surface to-gold/5 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-saffron/10 border-b border-saffron/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-semibold text-saffron tracking-wider uppercase">
            Question of the Day
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentIndex + 1} / {questions.length}
          </span>
          {/* Progress dots */}
          <div className="flex gap-0.5 ml-2">
            {questions.slice(0, 10).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex % 10 ? "bg-saffron" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="p-5 min-h-[180px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {/* Category badge */}
            <span className="inline-block rounded-full bg-saffron/10 border border-saffron/30 px-2.5 py-0.5 text-[10px] font-medium text-saffron mb-3">
              {q.category}
            </span>

            {/* Question */}
            <p className="text-sm font-semibold text-foreground leading-relaxed mb-4">
              {q.question}
            </p>

            {/* Options */}
            {!showAnswer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="text-left rounded-lg border border-border/50 px-3 py-2 text-xs transition-all hover:border-saffron/40 hover:bg-saffron/5 active:scale-[0.98] cursor-pointer"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                {isCorrect ? (
                  /* Correct answer — green */
                  <div className="rounded-lg p-3 text-xs bg-teal/10 border border-teal/30 text-teal">
                    <span className="font-bold">✅ Correct!</span>{" "}
                    {selected}
                  </div>
                ) : (
                  /* Wrong answer — red for user's pick, green for correct */
                  <>
                    <div className="rounded-lg p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive">
                      <span className="font-bold">❌ Your answer:</span>{" "}
                      {selected}
                    </div>
                    <div className="rounded-lg p-3 text-xs bg-teal/10 border border-teal/30 text-teal">
                      <span className="font-bold">✅ Correct answer:</span>{" "}
                      {q.options.find((o) => o.startsWith(`${q.correctAnswer})`)) ?? q.correctAnswer}
                    </div>
                  </>
                )}
                {/* Explanation */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {q.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-surface/50">
        <button
          type="button"
          onClick={handlePrev}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Previous
        </button>

        {/* Auto-rotate indicator */}
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
          <span className="text-[10px] text-muted-foreground">
            Auto-rotates every 15s
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
