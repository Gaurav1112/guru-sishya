"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RotateCcw, Trophy, BookOpen } from "lucide-react";
import { useAI } from "@/hooks/use-ai";
import { useStore } from "@/lib/store";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ConceptInput } from "./concept-input";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { PhaseIndicator } from "./phase-indicator";
import { MasteryDisplay } from "./mastery-display";
import {
  feynmanPrimePrompt,
  feynmanTeachPrompt,
  feynmanRecallPrompt,
  feynmanProbePrompt,
  feynmanStrugglePrompt,
  feynmanReteachPrompt,
  feynmanVerifyPrompt,
  antiParrotingPrompt,
} from "@/lib/prompts/feynman";
import type { MasteryScores } from "@/lib/types";
import type { FeynmanStatus } from "@/lib/stores/chat-slice";

const MAX_ROUNDS = 4;

// ── JSON extraction helper ────────────────────────────────────────────────────

function extractJSON(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

interface FeynmanContainerProps {
  topicId: number;
  topicName: string;
}

interface RecallResult {
  completeness: number;
  accuracy: number;
  depth: number;
  originality: number;
  gaps: string[];
  feedback: string;
}

interface VerifyResult extends RecallResult {
  mastered: boolean;
  summary: string;
}

interface AntiParrotResult {
  isParroting: boolean;
  reason: string;
}

export function FeynmanContainer({ topicId, topicName }: FeynmanContainerProps) {
  const ai = useAI();
  const addXP = useStore((s) => s.addXP);
  const addCoins = useStore((s) => s.addCoins);
  const queueCelebration = useStore((s) => s.queueCelebration);
  const startFeynmanChat = useStore((s) => s.startFeynmanChat);
  const setFeynmanPhase = useStore((s) => s.setFeynmanPhase);
  const setFeynmanStatus = useStore((s) => s.setFeynmanStatus);
  const setFeynmanRound = useStore((s) => s.setFeynmanRound);
  const updateMasteryScores = useStore((s) => s.updateMasteryScores);
  const addChatMessage = useStore((s) => s.addChatMessage);
  const endFeynmanChat = useStore((s) => s.endFeynmanChat);
  const feynmanChat = useStore((s) => s.feynmanChat);

  const [error, setError] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  // Track conversation artifacts needed for phase transitions
  const teachingResponseRef = useRef<string>("");
  const firstAnalogy = useRef<string>("");
  const gapsRef = useRef<string[]>([]);
  const sessionIdRef = useRef<number | null>(null);

  // Derive local readable state from store
  const messages = feynmanChat?.messages ?? [];
  const status = feynmanChat?.status ?? "loading";
  const phase = feynmanChat?.phase ?? 1;
  const round = feynmanChat?.round ?? 1;
  const masteryScores = feynmanChat?.masteryScores ?? { completeness: 0, accuracy: 0, depth: 0, originality: 0 };
  const concept = feynmanChat?.concept ?? "";

  // ── Helpers ────────────────────────────────────────────────────────────────

  const addAssistantMessage = useCallback(
    (content: string) => {
      addChatMessage("assistant", content);
    },
    [addChatMessage]
  );

  const addUserMessage = useCallback(
    (content: string) => {
      addChatMessage("user", content);
    },
    [addChatMessage]
  );

  const streamAssistantMessage = useCallback(
    async (userPrompt: string, systemPrompt: string): Promise<string> => {
      if (!ai) throw new Error("No AI provider");
      setStreamingContent("");
      let full = "";
      await ai.streamText(userPrompt, systemPrompt, (chunk) => {
        full += chunk;
        setStreamingContent(full);
      });
      setStreamingContent(null);
      addAssistantMessage(full);
      return full;
    },
    [ai, addAssistantMessage]
  );

  // ── Persist message to Dexie ───────────────────────────────────────────────

  const persistMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!sessionIdRef.current) return;
      await db.chatMessages.add({
        sessionId: sessionIdRef.current,
        role,
        content,
        createdAt: new Date(),
      }).catch(() => {});
    },
    []
  );

  // ── Phase 1: Prime ─────────────────────────────────────────────────────────

  const runPhase1Prime = useCallback(
    async (conceptName: string) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const { system, user } = feynmanPrimePrompt(topicName, conceptName);
        const response = await streamAssistantMessage(user, system);
        await persistMessage("assistant", response);
        setFeynmanPhase(1);
        setFeynmanStatus("priming");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start session");
        setFeynmanStatus("priming");
      }
    },
    [ai, topicName, streamAssistantMessage, persistMessage, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 2: Teach ─────────────────────────────────────────────────────────

  const runPhase2Teach = useCallback(
    async (priorKnowledge: string) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const { system, user } = feynmanTeachPrompt(topicName, concept, priorKnowledge);
        const response = await streamAssistantMessage(user, system);
        teachingResponseRef.current = response;

        // Extract analogy for later use in re-teach
        const analogyMatch = response.match(/analogy[:\s]+([^.]+\.)/i) || response.match(/like\s+([^.]+\.)/i);
        firstAnalogy.current = analogyMatch ? analogyMatch[1] : "previous analogy";

        await persistMessage("assistant", response);
        setFeynmanPhase(2);
        setFeynmanStatus("recalling");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate teaching");
        setFeynmanStatus("recalling");
      }
    },
    [ai, topicName, concept, streamAssistantMessage, persistMessage, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 3: Recall evaluation ─────────────────────────────────────────────

  const runPhase3Recall = useCallback(
    async (userExplanation: string) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        // Anti-parroting check
        const { system: apSystem, user: apUser } = antiParrotingPrompt(
          teachingResponseRef.current,
          userExplanation
        );
        const apResult = await ai.generateStructured<AntiParrotResult>(
          apUser,
          apSystem,
          (text) => {
            const parsed = JSON.parse(extractJSON(text)) as AntiParrotResult;
            return { isParroting: Boolean(parsed.isParroting), reason: String(parsed.reason ?? "") };
          },
          { temperature: 0.1 }
        );

        if (apResult.isParroting) {
          const parotMsg = `I can see you're echoing back what I said — that's a natural first step! But the Feynman Technique requires you to reconstruct the idea in your **own** words and with your **own** examples. ${apResult.reason}\n\nTry again: imagine you're explaining "${concept}" to a friend who has never heard of it. Use a different analogy or example than I used.`;
          addAssistantMessage(parotMsg);
          await persistMessage("assistant", parotMsg);
          setFeynmanStatus("recalling");
          return;
        }

        // Evaluate the recall
        const { system, user } = feynmanRecallPrompt(
          concept,
          teachingResponseRef.current,
          userExplanation
        );
        const recallResult = await ai.generateStructured<RecallResult>(
          user,
          system,
          (text) => {
            const parsed = JSON.parse(extractJSON(text)) as RecallResult;
            return {
              completeness: Number(parsed.completeness ?? 0),
              accuracy: Number(parsed.accuracy ?? 0),
              depth: Number(parsed.depth ?? 0),
              originality: Number(parsed.originality ?? 0),
              gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
              feedback: String(parsed.feedback ?? ""),
            };
          },
          { temperature: 0.2 }
        );

        updateMasteryScores({
          completeness: recallResult.completeness,
          accuracy: recallResult.accuracy,
          depth: recallResult.depth,
          originality: recallResult.originality,
        });
        gapsRef.current = recallResult.gaps;

        // Provide feedback
        const feedbackMsg = recallResult.feedback;
        addAssistantMessage(feedbackMsg);
        await persistMessage("assistant", feedbackMsg);

        setFeynmanPhase(3);
        setFeynmanStatus("probing");

        // Move to phase 4 automatically after brief delay
        setTimeout(() => {
          runPhase4Probe(userExplanation, recallResult.gaps);
        }, 800);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to evaluate recall");
        setFeynmanStatus("recalling");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ai, concept, addAssistantMessage, persistMessage, updateMasteryScores, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 4: Probe ─────────────────────────────────────────────────────────

  const runPhase4Probe = useCallback(
    async (userExplanation: string, gaps: string[]) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const { system, user } = feynmanProbePrompt(concept, gaps, userExplanation);
        const response = await streamAssistantMessage(user, system);
        await persistMessage("assistant", response);
        setFeynmanPhase(4);
        setFeynmanStatus("probing");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate probe question");
        setFeynmanStatus("probing");
      }
    },
    [ai, concept, streamAssistantMessage, persistMessage, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 5: Struggle ──────────────────────────────────────────────────────

  const runPhase5Struggle = useCallback(
    async (probeAnswer: string) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const context = messages
          .slice(-6)
          .map((m) => `${m.role === "user" ? "Student" : "Teacher"}: ${m.content}`)
          .join("\n\n");
        const contextWithAnswer = context + `\n\nStudent: ${probeAnswer}`;

        const { system, user } = feynmanStrugglePrompt(concept, contextWithAnswer);
        const response = await streamAssistantMessage(user, system);
        await persistMessage("assistant", response);
        setFeynmanPhase(5);
        setFeynmanStatus("struggling");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate challenge");
        setFeynmanStatus("struggling");
      }
    },
    [ai, concept, messages, streamAssistantMessage, persistMessage, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 6: Re-teach ──────────────────────────────────────────────────────

  const runPhase6Reteach = useCallback(
    async () => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const { system, user } = feynmanReteachPrompt(
          concept,
          firstAnalogy.current,
          gapsRef.current
        );
        const response = await streamAssistantMessage(user, system);
        teachingResponseRef.current = response;
        await persistMessage("assistant", response);
        setFeynmanPhase(6);
        setFeynmanStatus("recalling");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to re-teach");
        setFeynmanStatus("recalling");
      }
    },
    [ai, concept, streamAssistantMessage, persistMessage, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Phase 7: Verify ────────────────────────────────────────────────────────

  const runPhase7Verify = useCallback(
    async (userFinalExplanation: string) => {
      if (!ai) return;
      setFeynmanStatus("loading");
      setError(null);
      try {
        const { system, user } = feynmanVerifyPrompt(concept, userFinalExplanation);
        const verifyResult = await ai.generateStructured<VerifyResult>(
          user,
          system,
          (text) => {
            const parsed = JSON.parse(extractJSON(text)) as VerifyResult;
            return {
              completeness: Number(parsed.completeness ?? 0),
              accuracy: Number(parsed.accuracy ?? 0),
              depth: Number(parsed.depth ?? 0),
              originality: Number(parsed.originality ?? 0),
              mastered: Boolean(parsed.mastered),
              summary: String(parsed.summary ?? ""),
              gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
              feedback: String(parsed.feedback ?? parsed.summary ?? ""),
            };
          },
          { temperature: 0.2 }
        );

        updateMasteryScores({
          completeness: verifyResult.completeness,
          accuracy: verifyResult.accuracy,
          depth: verifyResult.depth,
          originality: verifyResult.originality,
        });

        setFeynmanPhase(7);

        if (verifyResult.mastered) {
          await finalizeSession(true, masteryScores, verifyResult.summary);
        } else {
          addAssistantMessage(verifyResult.summary);
          await persistMessage("assistant", verifyResult.summary);
          endFeynmanChat(false);
          // Save incomplete session
          await saveSession(false, {
            completeness: verifyResult.completeness,
            accuracy: verifyResult.accuracy,
            depth: verifyResult.depth,
            originality: verifyResult.originality,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to verify mastery");
        setFeynmanStatus("verifying");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ai, concept, masteryScores, updateMasteryScores, addAssistantMessage, persistMessage, endFeynmanChat, setFeynmanPhase, setFeynmanStatus]
  );

  // ── Save session to Dexie ──────────────────────────────────────────────────

  const saveSession = useCallback(
    async (mastered: boolean, scores: MasteryScores) => {
      try {
        const sessionId = await db.chatSessions.add({
          topicId,
          technique: "feynman",
          concept,
          phase: String(phase),
          round,
          masteryScores: scores,
          completed: mastered,
          createdAt: new Date(),
        });
        sessionIdRef.current = sessionId ?? null;
        return sessionId;
      } catch {
        return null;
      }
    },
    [topicId, concept, phase, round]
  );

  // ── Finalize mastered session ──────────────────────────────────────────────

  const finalizeSession = useCallback(
    async (mastered: boolean, scores: MasteryScores, summary: string) => {
      const celebrationMsg = mastered
        ? `Excellent work! You've mastered **${concept}** using the Feynman Technique.\n\n${summary}\n\n**+50 XP** and **+15 coins** earned!`
        : `Great effort! Here's a summary of your progress:\n\n${summary}\n\nKeep practicing — come back and try again!`;

      addAssistantMessage(celebrationMsg);
      await persistMessage("assistant", celebrationMsg);
      endFeynmanChat(mastered);

      if (mastered) {
        addXP(50);
        addCoins(15, "feynman_mastery");
        queueCelebration({ type: "xp_gain", data: { amount: 50, reason: "Feynman mastery" } });
      }

      await saveSession(mastered, scores);
    },
    [concept, addAssistantMessage, persistMessage, endFeynmanChat, addXP, addCoins, queueCelebration, saveSession]
  );

  // ── User message handler — routes to the correct phase ────────────────────

  const handleUserSend = useCallback(
    async (message: string) => {
      if (!feynmanChat) return;
      addUserMessage(message);
      await persistMessage("user", message);

      const currentPhase = feynmanChat.phase;
      const currentRound = feynmanChat.round;
      const currentStatus = feynmanChat.status;

      switch (currentStatus) {
        case "priming":
          // User shared prior knowledge — move to Phase 2: Teach
          await runPhase2Teach(message);
          break;

        case "recalling":
          // User explained concept — evaluate and probe
          await runPhase3Recall(message);
          break;

        case "probing":
          if (currentPhase <= 4) {
            // Move to struggle
            await runPhase5Struggle(message);
          } else {
            // Post-reteach probing: move to verify
            setFeynmanStatus("verifying");
            await runPhase7Verify(message);
          }
          break;

        case "struggling":
          // After struggle answer, decide: reteach or verify
          if (currentRound < MAX_ROUNDS) {
            // Not mastered yet — run reteach round
            const nextRound = currentRound + 1;
            setFeynmanRound(nextRound);
            await runPhase6Reteach();
          } else {
            // Max rounds reached — go to verify
            setFeynmanStatus("verifying");
            await runPhase7Verify(message);
          }
          break;

        case "verifying":
          await runPhase7Verify(message);
          break;

        default:
          break;
      }
    },
    [
      feynmanChat,
      addUserMessage,
      persistMessage,
      runPhase2Teach,
      runPhase3Recall,
      runPhase5Struggle,
      runPhase6Reteach,
      runPhase7Verify,
      setFeynmanRound,
      setFeynmanStatus,
    ]
  );

  // ── Start session ──────────────────────────────────────────────────────────

  const handleStartConcept = useCallback(
    async (conceptName: string) => {
      startFeynmanChat(topicId, topicName, conceptName);
      // Phase 1 will fire via useEffect once feynmanChat is set
    },
    [topicId, topicName, startFeynmanChat]
  );

  // Fire Phase 1 once the chat is initialised
  const hasStarted = useRef(false);
  useEffect(() => {
    if (feynmanChat && !hasStarted.current && feynmanChat.messages.length === 0) {
      hasStarted.current = true;
      runPhase1Prime(feynmanChat.concept);
    }
  }, [feynmanChat, runPhase1Prime]);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    hasStarted.current = false;
    setStreamingContent(null);
    setError(null);
    teachingResponseRef.current = "";
    firstAnalogy.current = "";
    gapsRef.current = [];
    sessionIdRef.current = null;
    // Clear the feynman chat by ending it
    endFeynmanChat(false);
    // Small delay then null the chat via store reset — just call start with empty to reset
    setTimeout(() => {
      useStore.setState((s) => { s.feynmanChat = null; });
    }, 50);
  }, [endFeynmanChat]);

  // ── Chat message scroll ────────────────────────────────────────────────────

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, streamingContent]);

  // ── Render: no chat started yet ───────────────────────────────────────────

  if (!feynmanChat) {
    return (
      <ConceptInput
        topicName={topicName}
        onStart={handleStartConcept}
      />
    );
  }

  const isMastered = feynmanChat.mastered;
  const isComplete = feynmanChat.status === "complete";
  const isMaxRoundsReached = isComplete && !isMastered;

  // ── Render: complete (mastered) ────────────────────────────────────────────

  if (isComplete && isMastered) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-6 max-w-lg mx-auto py-8 text-center"
      >
        <div className="flex size-20 items-center justify-center rounded-full bg-teal/10 ring-2 ring-teal/20 mx-auto">
          <Trophy className="size-10 text-teal" />
        </div>
        <div>
          <h2 className="text-2xl font-heading font-bold mb-2">Concept Mastered!</h2>
          <p className="text-muted-foreground text-sm">
            You&apos;ve truly understood <span className="text-foreground font-medium">{concept}</span> using the Feynman Technique.
          </p>
        </div>
        <MasteryDisplay scores={masteryScores} />
        <Button
          onClick={handleReset}
          className="w-full"
          variant="outline"
        >
          <RotateCcw className="size-4 mr-2" />
          Learn Another Concept
        </Button>
      </motion.div>
    );
  }

  // ── Render: complete (max rounds, not mastered) ────────────────────────────

  if (isMaxRoundsReached) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col gap-6 max-w-lg mx-auto py-8"
      >
        <div className="flex items-center gap-3 p-4 rounded-lg border border-saffron/30 bg-saffron/5">
          <BookOpen className="size-6 text-saffron shrink-0" />
          <div>
            <p className="text-sm font-semibold">Keep Practicing</p>
            <p className="text-xs text-muted-foreground">
              You&apos;ve completed {MAX_ROUNDS} rounds — here&apos;s where to focus next.
            </p>
          </div>
        </div>
        <MasteryDisplay scores={masteryScores} />
        {gapsRef.current.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-4">
            <p className="text-sm font-semibold mb-2">Remaining Gaps</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              {gapsRef.current.map((gap, i) => (
                <li key={i}>{gap}</li>
              ))}
            </ul>
          </div>
        )}
        <Button onClick={handleReset} className="w-full" variant="outline">
          <RotateCcw className="size-4 mr-2" />
          Try Another Concept
        </Button>
      </motion.div>
    );
  }

  // ── Render: active chat ────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-heading font-semibold">{concept}</h2>
          <p className="text-xs text-muted-foreground">{topicName}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="size-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* Phase indicator */}
      <PhaseIndicator
        currentPhase={phase}
        round={round}
        maxRounds={MAX_ROUNDS}
      />

      {/* Mastery scores */}
      <MasteryDisplay scores={masteryScores} />

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Chat messages */}
      <div className="flex flex-col gap-3 min-h-[200px]">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
            />
          ))}
        </AnimatePresence>

        {/* Streaming message */}
        {streamingContent !== null && (
          <ChatMessage
            role="assistant"
            content={streamingContent}
            isStreaming
          />
        )}

        {/* Loading indicator when no streaming content yet */}
        {status === "loading" && streamingContent === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin text-saffron" />
            <span>Thinking…</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <ChatInput
        status={status}
        onSend={handleUserSend}
        disabled={status === "loading"}
      />
    </div>
  );
}
