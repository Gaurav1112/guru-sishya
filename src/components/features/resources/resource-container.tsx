"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CategorySection } from "./category-section";
import { resourceFinderPrompt } from "@/lib/prompts/resource-finder";
import { BLOOM_LABELS, type BloomLevel } from "@/lib/quiz/types";
import type { ResourceCollection } from "@/lib/resources/types";
import type { ResourceItem } from "@/lib/types";

interface ResourceContainerProps {
  topicId: number;
  topicName: string;
}

type Status = "loading" | "generating" | "ready" | "error";

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

// FIX 8: Derive a human-readable user level from quiz attempt data for this topic
function bloomLevelLabel(difficulty: string): string | undefined {
  if (difficulty === "calibration") return undefined;
  const n = parseInt(difficulty, 10);
  if (n >= 1 && n <= 7) {
    return BLOOM_LABELS[n as BloomLevel];
  }
  return undefined;
}

export function ResourceContainer({ topicId, topicName }: ResourceContainerProps) {
  const ai = useAI();
  const addXP = useStore((s) => s.addXP);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState<ResourceCollection | null>(null);
  const xpAwardedRef = useRef(false);
  const initDone = useRef(false);

  // Live query: existing resource record for this topic
  const existingResource = useLiveQuery(
    () => db.resources.where("topicId").equals(topicId).first(),
    [topicId]
  );

  // FIX 8: Live query for the most recent quiz attempt for this topic
  const latestQuizAttempt = useLiveQuery(
    () =>
      db.quizAttempts
        .where("topicId")
        .equals(topicId)
        .reverse()
        .first(),
    [topicId]
  );

  // Restore cached resources from Dexie
  useEffect(() => {
    if (initDone.current) return;
    if (existingResource === undefined) return; // still loading
    if (latestQuizAttempt === undefined) return; // still loading

    initDone.current = true;

    if (existingResource) {
      // Parse stored collection from items field
      try {
        const stored = JSON.parse(
          existingResource.items as unknown as string
        ) as ResourceCollection;
        setCollection(stored);
        setStatus("ready");

        // Award XP for first view (once per session)
        if (!xpAwardedRef.current) {
          xpAwardedRef.current = true;
          addXP(10);
        }
      } catch {
        // Stored items in old format — regenerate
        generateResources();
      }
    } else {
      generateResources();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingResource, latestQuizAttempt]);

  // ── Generate resources via AI ───────────────────────────────────────────────

  const generateResources = useCallback(async () => {
    if (!ai) return;
    setStatus("generating");
    setError(null);

    try {
      // FIX 8: Build a user level string from the most recent quiz attempt
      let userLevel: string | undefined;
      if (latestQuizAttempt) {
        const label = bloomLevelLabel(latestQuizAttempt.difficulty);
        if (label) {
          userLevel = `Bloom's Level ${latestQuizAttempt.difficulty} (${label})`;
        }
      }

      const { system, user } = resourceFinderPrompt(topicName, userLevel);
      const resourceCollection = await ai.generateStructured<ResourceCollection>(
        user,
        system,
        (text) => {
          const parsed = JSON.parse(extractJSON(text)) as ResourceCollection;
          if (!parsed.categories || parsed.categories.length === 0) {
            throw new Error("Invalid resource collection response");
          }
          return parsed;
        },
        { temperature: 0.3, maxTokens: 8192 }
      );

      // Save to Dexie — store collection as JSON in items field
      if (existingResource?.id) {
        await db.resources.update(existingResource.id, {
          items: JSON.stringify(resourceCollection) as unknown as ResourceItem[],
          createdAt: new Date(),
        });
      } else {
        await db.resources.add({
          topicId,
          items: JSON.stringify(resourceCollection) as unknown as ResourceItem[],
          createdAt: new Date(),
        });
      }

      setCollection(resourceCollection);
      setStatus("ready");

      // Award 10 XP on first generation/view
      if (!xpAwardedRef.current) {
        xpAwardedRef.current = true;
        addXP(10);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate resources");
      setStatus("error");
    }
  }, [ai, existingResource?.id, latestQuizAttempt, topicId, topicName, addXP]);

  // ── Refresh handler ─────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    if (existingResource?.id) {
      await db.resources.delete(existingResource.id);
    }
    initDone.current = false;
    setCollection(null);
    generateResources();
  }, [existingResource?.id, generateResources]);

  // ── Render ──────────────────────────────────────────────────────────────────

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
          <p className="font-medium">Curating the best resources…</p>
          <p className="text-sm text-muted-foreground">
            The AI is finding top-quality resources across 8 categories.
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
          <p className="font-medium">Resource generation failed</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button onClick={generateResources} size="sm">
          <RefreshCw className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (status === "ready" && collection) {
    const totalResources = collection.categories.reduce(
      (sum, cat) => sum + cat.items.length,
      0
    );

    return (
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              AI-Curated Resources
            </p>
            <h1 className="font-heading text-2xl font-bold">{topicName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {totalResources} hand-picked resources across 8 categories
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Refresh Resources
          </Button>
        </div>

        {/* Confidence legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground rounded-lg border border-border bg-surface p-3">
          <span className="font-medium text-foreground">Confidence:</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-teal inline-block" />
            HIGH — Verified
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-gold inline-block" />
            MEDIUM — Likely accurate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-saffron inline-block" />
            LOW — Please verify before using
          </span>
        </div>

        {/* Category sections */}
        <div className="space-y-10">
          {collection.categories.map((cat) => (
            <CategorySection
              key={cat.name}
              name={cat.name}
              icon={cat.icon}
              items={cat.items}
            />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
