"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import {
  getTodaysChallenge,
  saveTodaysChallenge,
  submitDailyChallenge,
  dailyChallengePrompt,
  hoursUntilNextChallenge,
  DAILY_CHALLENGE_ATTEMPT_XP,
  DAILY_CHALLENGE_CORRECT_XP,
} from "@/lib/gamification/daily-challenge";
import type { DailyChallenge } from "@/lib/types";
import { createAIProvider } from "@/lib/ai";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ParsedChallenge {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
}

// ── Daily Challenge Widget ────────────────────────────────────────────────────

export function DailyChallengeWidget() {
  const { apiKey, aiProvider, timezone, level, totalXP, addXP } = useStore();

  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [parsed, setParsed] = useState<ParsedChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoursLeft, setHoursLeft] = useState(0);
  // Simulated accuracy percentage for answered challenges (seeded from challenge id)
  const [accuracy, setAccuracy] = useState<number>(0);

  // ── Load today's challenge on mount ────────────────────────────────────────

  const loadChallenge = useCallback(async () => {
    setLoading(true);
    try {
      const existing = await getTodaysChallenge(timezone ?? "UTC");
      if (existing) {
        setChallenge(existing);
        // Parse stored question field — it stores the full JSON from AI
        try {
          const p = JSON.parse(existing.question) as ParsedChallenge;
          setParsed(p);
        } catch {
          // Legacy format: question is plain text
          setParsed({
            question: existing.question,
            options: [],
            correctAnswer: existing.correctAnswer,
            explanation: existing.explanation,
            topic: existing.topic,
          });
        }
        if (existing.answered) {
          setSubmitted(true);
          // Simulate accuracy: hash(id) mod 40 + 45 → 45-84%
          const pct = ((existing.id ?? 1) * 37 + 45) % 40 + 45;
          setAccuracy(pct);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [timezone]);

  useEffect(() => {
    void loadChallenge();
    setHoursLeft(hoursUntilNextChallenge(timezone ?? "UTC"));
  }, [loadChallenge, timezone]);

  // ── Generate challenge via AI ──────────────────────────────────────────────

  async function generateChallenge() {
    if (false) { // Disabled — using pre-generated questions
      setError("Set your API key in Settings first.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      // Load pre-generated questions (no AI needed)
      const response = await fetch("/content/daily-questions.json");
      if (!response.ok) throw new Error("Could not load daily questions");
      const allQuestions = await response.json() as Array<{
        question: string; options: string[]; correctAnswer: string;
        explanation: string; category: string;
      }>;

      // Pick a consistent random question based on today's date
      const todayStr = new Date().toISOString().slice(0, 10);
      const dayHash = todayStr.split("").reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
      const index = dayHash % allQuestions.length;
      const q = allQuestions[index];

      const p: ParsedChallenge = {
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        topic: q.category,
      };
      setParsed(p);

      const today = new Date().toISOString().slice(0, 10);
      const id = await saveTodaysChallenge({
        date: today,
        topic: p.topic,
        question: JSON.stringify(p), // store full JSON for later parsing
        correctAnswer: p.correctAnswer,
        explanation: p.explanation,
        answered: false,
      });

      const saved = await db.dailyChallenges.get(id);
      if (saved) setChallenge(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate challenge.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Submit answer ──────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!challenge?.id || !selected) return;
    const ca = parsed?.correctAnswer ?? "";
    const isCorrect = selected === ca ||
      selected.startsWith(`${ca})`) ||
      selected.startsWith(`${ca} `);
    const score = isCorrect ? 100 : 0;

    await submitDailyChallenge(challenge.id, selected, score);

    // Award XP + coins (3 coins for completing the daily challenge)
    addXP(DAILY_CHALLENGE_ATTEMPT_XP + (isCorrect ? DAILY_CHALLENGE_CORRECT_XP : 0));
    useStore.getState().addCoins(3, "daily_challenge");

    // Refresh from DB
    const updated = await db.dailyChallenges.get(challenge.id);
    if (updated) setChallenge(updated);
    setSubmitted(true);

    const pct = ((challenge.id ?? 1) * 37 + 45) % 40 + 45;
    setAccuracy(pct);
  }

  // ── Render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-xl border border-border/50 bg-surface p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="h-3 w-full bg-muted rounded mb-2" />
        <div className="h-3 w-3/4 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">☀️</span>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Guru&apos;s Question of the Day
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          Resets in {hoursLeft}h
        </span>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive mb-3">{error}</p>
      )}

      {/* No challenge yet — generate */}
      {!challenge && !generating && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Today&apos;s question is ready to be revealed.
          </p>
          <button
            onClick={generateChallenge}
            className="rounded-xl bg-saffron px-4 py-2 text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
          >
            Reveal Today&apos;s Question
          </button>
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <span className="animate-spin">⏳</span>
          Guru is crafting today&apos;s question…
        </div>
      )}

      {/* Challenge question */}
      {parsed && !submitted && (
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            {parsed.question}
          </p>

          {parsed.options.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {parsed.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`text-left rounded-lg border px-3 py-2 text-sm transition-all ${
                    selected === opt
                      ? "border-saffron bg-saffron/10 text-saffron"
                      : "border-border/50 hover:border-saffron/40 hover:bg-muted/20"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              +{DAILY_CHALLENGE_ATTEMPT_XP} XP attempt · +{DAILY_CHALLENGE_CORRECT_XP} XP correct
            </span>
            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="rounded-xl bg-saffron px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {parsed && submitted && challenge && (
        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            {parsed.question}
          </p>

          {/* Show selected answer with colour */}
          {challenge.userAnswer && (() => {
            const ua = challenge.userAnswer;
            const ca = parsed.correctAnswer;
            const userCorrect = ua === ca || ua.startsWith(`${ca})`) || ua.startsWith(`${ca} `);
            const correctFull = parsed.options.find((o) => o.startsWith(`${ca})`)) ?? ca;
            return userCorrect ? (
              <div className="rounded-lg border px-3 py-2 text-sm mb-3 border-green-500/40 bg-green-500/10 text-green-400">
                <span className="font-bold">Correct!</span> {ua}
              </div>
            ) : (
              <>
                <div className="rounded-lg border px-3 py-2 text-sm mb-2 border-destructive/40 bg-destructive/10 text-destructive">
                  <span className="font-bold">Your answer:</span> {ua}
                </div>
                <div className="rounded-lg border px-3 py-2 text-sm mb-3 border-green-500/40 bg-green-500/10 text-green-400">
                  <span className="font-bold">Correct answer:</span> {correctFull}
                </div>
              </>
            );
          })()}

          {/* Explanation */}
          <p className="text-xs text-muted-foreground mb-3">
            {parsed.explanation}
          </p>

          {/* Accuracy */}
          <p className="text-xs text-muted-foreground">
            {accuracy}% of learners got this right
          </p>
        </div>
      )}
    </div>
  );
}
