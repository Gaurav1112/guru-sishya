"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAI } from "@/hooks/use-ai";
import { diagnosticProbesPrompt } from "@/lib/prompts/plan-generator";
import type { DiagnosticAnswer } from "@/lib/plan/types";

interface DiagnosticFormProps {
  topicName: string;
  onSubmit: (answers: DiagnosticAnswer[]) => void;
}

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBracket = text.indexOf("[");
  if (firstBracket !== -1) {
    const last = text.lastIndexOf("]");
    if (last !== -1) return text.slice(firstBracket, last + 1);
  }
  return text.trim();
}

export function DiagnosticForm({ topicName, onSubmit }: DiagnosticFormProps) {
  const ai = useAI();
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(["", "", ""]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    if (!ai) return;
    setLoading(true);
    setError(null);
    try {
      const { system, user } = diagnosticProbesPrompt(topicName);
      const qs = await ai.generateStructured<string[]>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as unknown[];
          if (!Array.isArray(parsed) || parsed.length === 0)
            throw new Error("Invalid diagnostic questions response");
          return parsed.map(String).slice(0, 3);
        },
        { temperature: 0.7 }
      );
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, [ai, topicName]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleSubmit = () => {
    setSubmitting(true);
    const diagnosticAnswers: DiagnosticAnswer[] = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || "(no answer provided)",
    }));
    onSubmit(diagnosticAnswers);
  };

  const allAnswered = answers.every((a) => a.trim().length > 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Loader2 className="size-7 animate-spin text-saffron" />
        <p className="text-sm text-muted-foreground">Preparing your diagnostic questions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={loadQuestions} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-saffron text-sm font-medium">
          <Sparkles className="size-4" />
          <span>Quick Diagnostic</span>
        </div>
        <h2 className="font-heading text-xl font-bold">
          Let&apos;s personalize your plan
        </h2>
        <p className="text-sm text-muted-foreground">
          Answer 3 quick questions so the AI can tailor your 20-hour plan to your
          exact needs.
        </p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={i} className="bg-surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                <span className="text-saffron font-bold mr-2">{i + 1}.</span>
                {q}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={3}
                value={answers[i]}
                onChange={(e) => {
                  const next = [...answers];
                  next[i] = e.target.value;
                  setAnswers(next);
                }}
                placeholder="Your answer…"
                className="w-full resize-none rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Generating your plan…
          </>
        ) : (
          <>
            Generate My 20-Hour Plan
            <ChevronRight className="size-4 ml-1" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You can skip questions by clicking generate — the plan will use defaults.
      </p>
    </div>
  );
}
