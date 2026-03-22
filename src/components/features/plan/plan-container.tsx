"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { DiagnosticForm } from "./diagnostic-form";
import { PlanViewer } from "./plan-viewer";
import { planGenerationPrompt } from "@/lib/prompts/plan-generator";
import { findTopicContent } from "@/lib/content/loader";
import type { DiagnosticAnswer, GeneratedPlan, PlanViewStatus } from "@/lib/plan/types";

interface PlanContainerProps {
  topicId: number;
  topicName: string;
}

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

export function PlanContainer({ topicId, topicName }: PlanContainerProps) {
  const ai = useAI();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);
  const queueCelebration = useStore((s) => s.queueCelebration);

  const [status, setStatus] = useState<PlanViewStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [streamText, setStreamText] = useState("");
  const [completingSession, setCompletingSession] = useState<number | null>(null);

  // Live query: existing learning plan for this topic
  // Returns null (not undefined) when no record found, so we can distinguish loading vs empty
  const existingPlan = useLiveQuery(
    async () => {
      const plan = await db.learningPlans.where("topicId").equals(topicId).first();
      return plan ?? null; // convert undefined → null to distinguish from "still loading" (undefined)
    },
    [topicId]
  );

  // Live query: plan sessions for existing plan
  const planSessions = useLiveQuery(
    async () => {
      if (!existingPlan?.id) return [] as { id?: number; planId: number; sessionNumber: number; completed: boolean; completedAt?: Date }[];
      return db.planSessions.where("planId").equals(existingPlan.id).toArray();
    },
    [existingPlan?.id]
  );

  // Whether we have determined the initial state (dexie load complete)
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    if (existingPlan === undefined) return; // still loading from Dexie (undefined = loading, null = no record)

    initDone.current = true;

    if (existingPlan) {
      // Parse stored JSON plan
      try {
        const stored = JSON.parse(existingPlan.sessions as unknown as string) as GeneratedPlan;
        setGeneratedPlan(stored);
        setStatus("ready");
      } catch {
        // Stored data is the old PlanSession[] shape — show diagnostic to regenerate
        setStatus("diagnostic");
      }
    } else {
      // No plan in Dexie — check if we have pre-generated static content
      loadStaticPlan();
    }
  }, [existingPlan]);

  // ── Load pre-generated plan from static content (skip diagnostics) ────────

  const loadStaticPlan = useCallback(async () => {
    try {
      const content = await findTopicContent(topicName);
      if (content?.plan && content.plan.sessions && content.plan.sessions.length > 0) {
        const plan: GeneratedPlan = {
          topic: topicName,
          overview: content.plan.overview || `Comprehensive 20-hour learning plan for ${topicName}`,
          skippedTopics: content.plan.skippedTopics || "",
          sessions: content.plan.sessions,
        };

        // Save to Dexie so it loads from cache next time
        await db.learningPlans.add({
          topicId,
          sessions: JSON.stringify(plan) as unknown as import("@/lib/types").PlanSession[],
          skippedTopics: [],
          status: "active",
          createdAt: new Date(),
        });

        setGeneratedPlan(plan);
        setStatus("ready");
        addXP(15);
        addCoins(5, "plan_loaded");
        return;
      }
    } catch {
      // Static content not available — fall through to diagnostic
    }
    // No static content found — show diagnostic form for AI generation
    setStatus("diagnostic");
  }, [topicName, topicId, addXP, addCoins]);

  // ── Generate plan from diagnostic answers ──────────────────────────────────

  const generatePlan = useCallback(
    async (diagnosticAnswers: DiagnosticAnswer[]) => {
      if (!ai) return;
      setStatus("generating");
      setError(null);
      setStreamText("");

      try {
        const { system, user } = planGenerationPrompt(topicName, diagnosticAnswers);

        let fullText = "";
        await ai.streamText(
          user,
          system,
          (chunk) => {
            fullText += chunk;
            setStreamText(fullText);
          },
          { temperature: 0.3, maxTokens: 8192 }
        );

        const plan = JSON.parse(extractJSON(fullText)) as GeneratedPlan;
        if (!plan.sessions || plan.sessions.length === 0) {
          throw new Error("Plan has no sessions");
        }

        // Save to Dexie — store GeneratedPlan as JSON in sessions field
        const planId = await db.learningPlans.add({
          topicId,
          sessions: JSON.stringify(plan) as unknown as import("@/lib/types").PlanSession[],
          skippedTopics: [],
          status: "active",
          createdAt: new Date(),
        });

        // Create planSessions rows
        await Promise.all(
          plan.sessions.map((s) =>
            db.planSessions.add({
              planId: planId as number,
              sessionNumber: s.sessionNumber,
              completed: false,
            })
          )
        );

        setGeneratedPlan(plan);
        setStatus("ready");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate plan"
        );
        setStatus("error");
      }
    },
    [ai, topicId, topicName]
  );

  // ── Complete a session ──────────────────────────────────────────────────────

  const handleSessionComplete = useCallback(
    async (sessionNumber: number) => {
      if (!existingPlan?.id) return;

      const existing = await db.planSessions
        .where("planId")
        .equals(existingPlan.id)
        .filter((ps) => ps.sessionNumber === sessionNumber)
        .first();

      if (!existing?.id) return;

      const nowCompleted = !existing.completed;
      setCompletingSession(sessionNumber);

      try {
        await db.planSessions.update(existing.id, {
          completed: nowCompleted,
          completedAt: nowCompleted ? new Date() : undefined,
        });

        if (nowCompleted) {
          addXP(20);
          addCoins(10, "plan_session_complete");
          queueCelebration({ type: "xp_gain", data: { amount: 20 } });
        }
      } finally {
        setCompletingSession(null);
      }
    },
    [existingPlan?.id, addXP, addCoins, queueCelebration]
  );

  // ── Regenerate plan ─────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(async () => {
    if (existingPlan?.id) {
      // Remove plan sessions first
      await db.planSessions.where("planId").equals(existingPlan.id).delete();
      await db.learningPlans.delete(existingPlan.id);
    }
    initDone.current = false;
    setGeneratedPlan(null);
    setStatus("loading");
    // Try to reload from static content (which may have new lesson content)
    loadStaticPlan();
  }, [existingPlan?.id, loadStaticPlan]);

  // ── Build completions list ─────────────────────────────────────────────────

  const completions = (planSessions ?? []).map((ps) => ({
    sessionNumber: ps.sessionNumber,
    completed: ps.completed,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "diagnostic") {
    return (
      <DiagnosticForm topicName={topicName} onSubmit={generatePlan} />
    );
  }

  if (status === "generating") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 max-w-xl mx-auto">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <div className="text-center space-y-1">
          <p className="font-medium">Building your 20-hour Pareto plan…</p>
          <p className="text-sm text-muted-foreground">
            This may take 20-30 seconds. The AI is designing 10 personalized sessions.
          </p>
        </div>
        {streamText.length > 0 && (
          <div className="w-full rounded-xl border border-border bg-surface p-4 max-h-48 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface pointer-events-none rounded-xl" />
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-hidden">
              {streamText.slice(-400)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" />
          <p className="font-medium">Plan generation failed</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => setStatus("diagnostic")} variant="outline" size="sm">
            <BookOpen className="size-3.5 mr-1.5" />
            Start Over
          </Button>
          <Button onClick={handleRegenerate} size="sm">
            <RefreshCw className="size-3.5 mr-1.5" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (status === "ready" && generatedPlan) {
    return (
      <PlanViewer
        plan={generatedPlan}
        completions={completions}
        onSessionComplete={handleSessionComplete}
        onRegenerate={handleRegenerate}
        completingSession={completingSession}
        topicId={topicId}
      />
    );
  }

  return null;
}
