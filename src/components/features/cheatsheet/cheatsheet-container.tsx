"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CheatsheetViewer } from "./cheatsheet-viewer";
import { cheatsheetPrompt } from "@/lib/prompts/cheatsheet";

interface CheatsheetContainerProps {
  topicId: number;
  topicName: string;
}

type Status = "loading" | "streaming" | "ready" | "error";

export function CheatsheetContainer({
  topicId,
  topicName,
}: CheatsheetContainerProps) {
  const ai = useAI();
  const { addXP, addCoins, queueCelebration } = useStore((s) => ({
    addXP: s.addXP,
    addCoins: s.addCoins,
    queueCelebration: s.queueCelebration,
  }));

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [streamContent, setStreamContent] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const initDone = useRef(false);
  const xpAwardedRef = useRef(false);

  // Live query — picks up the latest cheat sheet for this topic
  const existingSheet = useLiveQuery(
    () =>
      db.cheatSheets
        .where("topicId")
        .equals(topicId)
        .reverse()
        .sortBy("version")
        .then((rows) => rows[0] ?? null),
    [topicId]
  );

  // On mount: if a cached sheet exists show it, otherwise generate
  useEffect(() => {
    if (initDone.current) return;
    if (existingSheet === undefined) return; // Dexie still loading

    initDone.current = true;

    if (existingSheet) {
      setStatus("ready");
    } else {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSheet]);

  // ── Generate cheat sheet ──────────────────────────────────────────────────

  const generate = useCallback(
    async (isRegen = false) => {
      if (!ai) return;

      setStatus("streaming");
      setError(null);
      setStreamContent("");

      try {
        const { system, user } = cheatsheetPrompt(topicName);

        let fullText = "";
        await ai.streamText(
          user,
          system,
          (chunk) => {
            fullText += chunk;
            setStreamContent(fullText);
          },
          { temperature: 0.4, maxTokens: 4096 }
        );

        // Determine version number
        const allSheets = await db.cheatSheets
          .where("topicId")
          .equals(topicId)
          .toArray();
        const nextVersion =
          allSheets.length > 0
            ? Math.max(...allSheets.map((s) => s.version)) + 1
            : 1;

        await db.cheatSheets.add({
          topicId,
          content: fullText,
          version: nextVersion,
          level: "",
          createdAt: new Date(),
        });

        // Award XP + coins only on first-ever generation
        if (!isRegen && !xpAwardedRef.current) {
          xpAwardedRef.current = true;
          addXP(15);
          addCoins(5, "cheatsheet_generated");
          queueCelebration({ type: "xp_gain", data: { amount: 15 } });
        }

        setStatus("ready");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate cheat sheet"
        );
        setStatus("error");
      }
    },
    [ai, topicId, topicName, addXP, addCoins, queueCelebration]
  );

  // ── Regenerate ────────────────────────────────────────────────────────────

  const handleRegenerate = useCallback(async () => {
    setIsRegenerating(true);
    await generate(true);
    setIsRegenerating(false);
  }, [generate]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "streaming") {
    return (
      <div className="flex flex-col items-center gap-4 py-16 max-w-xl mx-auto">
        <Loader2 className="size-8 animate-spin text-teal" />
        <div className="text-center space-y-1">
          <p className="font-medium">Generating your cheat sheet…</p>
          <p className="text-sm text-muted-foreground">
            The AI is distilling the key concepts into a concise reference.
          </p>
        </div>
        {streamContent.length > 0 && (
          <div className="w-full rounded-xl border border-border bg-surface p-4 max-h-48 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface pointer-events-none rounded-xl" />
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap overflow-hidden">
              {streamContent.slice(-500)}
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
          <p className="font-medium">Cheat sheet generation failed</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">{error}</p>
        <Button onClick={() => generate()} size="sm">
          <RefreshCw className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    );
  }

  if (status === "ready" && existingSheet) {
    return (
      <CheatsheetViewer
        topicName={topicName}
        content={existingSheet.content}
        version={existingSheet.version}
        createdAt={existingSheet.createdAt}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating}
      />
    );
  }

  return null;
}
