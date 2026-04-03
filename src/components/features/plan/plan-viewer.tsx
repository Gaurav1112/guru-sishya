"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ChevronDown, ChevronUp, RefreshCw, Trophy, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { SessionCard } from "./session-card";
import { useStore } from "@/lib/store";
import type { GeneratedPlan } from "@/lib/plan/types";

const FREE_SESSION_LIMIT = 3;

interface SessionCompletion {
  sessionNumber: number;
  completed: boolean;
}

interface PlanViewerProps {
  plan: GeneratedPlan;
  completions: SessionCompletion[];
  onSessionComplete: (sessionNumber: number) => void;
  onRegenerate: () => void;
  completingSession?: number | null;
  topicId: number;
}

export function PlanViewer({
  plan,
  completions,
  onSessionComplete,
  onRegenerate,
  completingSession,
  topicId,
}: PlanViewerProps) {
  const [skippedExpanded, setSkippedExpanded] = useState(false);

  const { isPremium, premiumUntil } = useStore();
  const isActivePremium =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  const completedCount = completions.filter((c) => c.completed).length;
  const totalSessions = plan.sessions.length;
  const progressPct = Math.round((completedCount / totalSessions) * 100);

  const isCompleted = (sessionNumber: number) =>
    completions.find((c) => c.sessionNumber === sessionNumber)?.completed ?? false;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Guru's Path
            </p>
            <h1 className="font-heading text-2xl font-bold">{plan.topic}</h1>
          </div>
          <Button
            onClick={onRegenerate}
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Regenerate
          </Button>
        </div>

        {/* Progress bar */}
        <div>
          <Progress value={progressPct}>
            <ProgressLabel>Progress</ProgressLabel>
            <span className="ml-auto text-sm text-muted-foreground tabular-nums">
              {completedCount}/{totalSessions} sessions
            </span>
          </Progress>
        </div>

        {completedCount === totalSessions && totalSessions > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
            <Trophy className="size-4" />
            <span className="font-medium">Plan complete! You&apos;ve mastered the Pareto 20% of {plan.topic}.</span>
          </div>
        )}
      </div>

      {/* Overview */}
      {plan.overview && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-heading font-semibold text-sm text-saffron uppercase tracking-wide mb-3">
            Plan Overview
          </h2>
          <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
            <MarkdownRenderer content={plan.overview} />
          </div>
        </div>
      )}

      {/* Skipped Topics */}
      {plan.skippedTopics && (
        <div className="rounded-xl border border-border bg-surface">
          <button
            type="button"
            onClick={() => setSkippedExpanded((v) => !v)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="font-heading font-semibold text-sm">
              What We&apos;re Skipping &amp; Why
            </span>
            {skippedExpanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
          {skippedExpanded && (
            <div className="px-4 pb-4">
              <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                <MarkdownRenderer content={plan.skippedTopics} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sessions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-sm uppercase tracking-wide text-muted-foreground">
            {plan.sessions.length} Sessions
          </h2>
          {!isActivePremium && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="size-3 text-saffron" />
                <span>
                  <span className="font-semibold text-saffron">{FREE_SESSION_LIMIT} of {totalSessions}</span>
                  {" "}sessions unlocked
                </span>
              </span>
              <a
                href="/app/pricing"
                className="rounded-md bg-saffron px-2.5 py-1 text-[10px] font-bold text-background hover:opacity-90 transition-opacity"
              >
                Upgrade
              </a>
            </div>
          )}
        </div>

        {plan.sessions.map((session, index) => {
          // Fallback: some content JSON sessions lack sessionNumber
          const sNum = session.sessionNumber ?? index + 1;
          const safeSession = session.sessionNumber != null ? session : { ...session, sessionNumber: sNum };
          return (
          <div key={sNum}>
            <SessionCard
              session={safeSession}
              completed={isCompleted(sNum)}
              onComplete={() => onSessionComplete(sNum)}
              isLoading={completingSession === sNum}
              topicId={topicId}
            />
            {/* Midpoint checkpoint banner between sessions 5 and 6 */}
            {sNum === 5 && (
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 border-t border-dashed border-border" />
                <div className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
                  Midpoint Checkpoint — Halfway There!
                </div>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            )}
          </div>
        );})}
      </div>
    </div>
  );
}
