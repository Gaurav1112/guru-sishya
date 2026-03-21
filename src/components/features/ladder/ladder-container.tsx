"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAI } from "@/hooks/use-ai";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { LevelCard } from "./level-card";
import { LadderProgress } from "./ladder-progress";
import { GraduationTest } from "./graduation-test";
import { ladderPrompt } from "@/lib/prompts/ladder-generator";
import type { GeneratedLadder, LadderStatus } from "@/lib/ladder/types";

// ── JSON extraction ──────────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    const last = text.lastIndexOf("}");
    if (last !== -1) return text.slice(firstBrace, last + 1);
  }
  return text.trim();
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface LadderContainerProps {
  topicId: number;
  topicName: string;
}

export function LadderContainer({ topicId, topicName }: LadderContainerProps) {
  const ai = useAI();

  const [status, setStatus] = useState<LadderStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [ladder, setLadder] = useState<GeneratedLadder | null>(null);

  // Which level is currently being tested (null = none)
  const [testingLevel, setTestingLevel] = useState<number | null>(null);

  const initDone = useRef(false);

  // Live queries
  const cachedLadder = useLiveQuery(
    () => db.ladderCache.where("topicId").equals(topicId).first(),
    [topicId]
  );
  const levelProgress = useLiveQuery(
    () => db.levelProgress.where("topicId").equals(topicId).first(),
    [topicId]
  );

  // ── Init: load from cache or generate ───────────────────────────────────────

  useEffect(() => {
    if (initDone.current) return;
    if (cachedLadder === undefined) return; // Dexie still loading

    initDone.current = true;

    if (cachedLadder) {
      try {
        const parsed = JSON.parse(cachedLadder.data) as GeneratedLadder;
        setLadder(parsed);
        setStatus("ready");
      } catch {
        generateLadder();
      }
    } else {
      generateLadder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedLadder]);

  // ── Generate ladder via AI ───────────────────────────────────────────────────

  const generateLadder = useCallback(async () => {
    if (!ai) return;
    setStatus("generating");
    setError(null);

    try {
      const { system, user } = ladderPrompt(topicName);
      const generated = await ai.generateStructured<GeneratedLadder>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as GeneratedLadder;
          if (!parsed.levels || parsed.levels.length !== 5) {
            throw new Error("Expected 5 levels in ladder response");
          }
          return parsed;
        },
        { temperature: 0.4, maxTokens: 6000 }
      );

      // Cache in Dexie
      const existing = await db.ladderCache.where("topicId").equals(topicId).first();
      if (existing?.id) {
        await db.ladderCache.update(existing.id, {
          data: JSON.stringify(generated),
          createdAt: new Date(),
        });
      } else {
        await db.ladderCache.add({
          topicId,
          data: JSON.stringify(generated),
          createdAt: new Date(),
        });
      }

      setLadder(generated);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate learning ladder");
      setStatus("error");
    }
  }, [ai, topicId, topicName]);

  // ── Refresh handler ──────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    const existing = await db.ladderCache.where("topicId").equals(topicId).first();
    if (existing?.id) {
      await db.ladderCache.delete(existing.id);
    }
    initDone.current = false;
    setLadder(null);
    setStatus("loading");
    generateLadder();
  }, [generateLadder, topicId]);

  // ── Graduation test handlers ─────────────────────────────────────────────────

  const handlePass = useCallback((_level: number) => {
    setTestingLevel(null);
    // levelProgress live query will update automatically from Dexie
  }, []);

  const handleCloseTest = useCallback(() => {
    setTestingLevel(null);
  }, []);

  // ── Derived unlock state ─────────────────────────────────────────────────────

  const unlockedLevel = levelProgress?.unlockedLevel ?? 1;
  const masteryEarned = levelProgress?.masteryBadgeEarned ?? false;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "generating") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="size-8 animate-spin text-saffron" />
        <div className="text-center space-y-1">
          <p className="font-medium">Building your Learning Ladder…</p>
          <p className="text-sm text-muted-foreground">
            The AI is mapping your 5-level journey using the Dreyfus Model.
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-5" />
          <p className="font-medium">Failed to generate learning ladder</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button onClick={generateLadder} size="sm">
          <RefreshCw className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!ladder) return null;

  // Show graduation test overlay
  if (testingLevel !== null) {
    return (
      <GraduationTest
        topicId={topicId}
        topicName={topicName}
        dreyfusLevel={testingLevel}
        onPass={handlePass}
        onClose={handleCloseTest}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Dreyfus Learning Ladder
          </p>
          <h1 className="font-heading text-2xl font-bold">{topicName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            5-level progression from Novice to Expert
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5 mr-1.5" />
          Regenerate
        </Button>
      </div>

      {/* Two-column layout: progress sidebar + level cards */}
      <div className="flex gap-6">
        {/* Progress sidebar */}
        <div className="hidden md:flex flex-col items-center w-24 shrink-0 pt-2">
          <LadderProgress
            unlockedLevel={unlockedLevel}
            currentLevel={unlockedLevel <= 5 ? unlockedLevel : 5}
            masteryEarned={masteryEarned}
            onSelectLevel={(level) => {
              if (level <= unlockedLevel) {
                const el = document.getElementById(`level-card-${level}`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          />
        </div>

        {/* Level cards */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Mobile progress bar */}
          <div className="md:hidden flex items-center gap-2 px-1">
            <span className="text-xs text-muted-foreground">Progress:</span>
            <div className="flex-1 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((l) => (
                <div
                  key={l}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    l < unlockedLevel
                      ? "bg-teal"
                      : l === unlockedLevel
                        ? "bg-saffron"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {unlockedLevel}/5
            </span>
          </div>

          {ladder.levels.map((level) => {
            const isUnlocked = level.level <= unlockedLevel;
            const isCompleted =
              level.level < unlockedLevel ||
              (level.level === 5 && masteryEarned);
            const isCurrent = level.level === unlockedLevel && !masteryEarned;

            return (
              <div key={level.level} id={`level-card-${level.level}`}>
                <LevelCard
                  level={level}
                  isUnlocked={isUnlocked}
                  isCompleted={isCompleted}
                  isCurrent={isCurrent}
                  masteryEarned={level.level === 5 ? masteryEarned : false}
                  onTakeTest={(dreyfusLevel) => setTestingLevel(dreyfusLevel)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
