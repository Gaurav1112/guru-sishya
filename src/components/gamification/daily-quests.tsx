"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { MysteryBox } from "./mystery-box";

// ── Types ────────────────────────────────────────────────────────────────────

interface Quest {
  id: "quiz" | "flashcards" | "lesson";
  label: string;
  icon: string;
  description: string;
  target: number;
  unit: string;
  xpReward: number;
}

interface QuestProgress {
  quiz: number;
  flashcards: number;
  lesson: number;
  claimedXP: { quiz: boolean; flashcards: boolean; lesson: boolean };
  boxOpened: boolean;
}

// ── Quest pools — rotated daily for variety ──────────────────────────────────

interface QuestTemplate {
  id: "quiz" | "flashcards" | "lesson";
  label: string;
  icon: string;
  description: string;
  target: number;
  unit: string;
  xpReward: number;
}

const QUEST_POOL: QuestTemplate[][] = [
  // Day pattern 0 — standard
  [
    { id: "quiz", label: "Quiz Challenger", icon: "🧠", description: "Complete a quiz session", target: 1, unit: "quiz", xpReward: 20 },
    { id: "flashcards", label: "Card Scholar", icon: "🃏", description: "Review 5 flashcards", target: 5, unit: "cards", xpReward: 15 },
    { id: "lesson", label: "Lesson Seeker", icon: "📖", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 10 },
  ],
  // Day pattern 1 — double quiz focus
  [
    { id: "quiz", label: "Double Down", icon: "🎯", description: "Complete 2 quiz sessions", target: 2, unit: "quizzes", xpReward: 30 },
    { id: "flashcards", label: "Quick Review", icon: "🃏", description: "Review 3 flashcards", target: 3, unit: "cards", xpReward: 10 },
    { id: "lesson", label: "Knowledge Seeker", icon: "📚", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 10 },
  ],
  // Day pattern 2 — flashcard heavy
  [
    { id: "quiz", label: "Warm Up", icon: "🧠", description: "Complete a quiz session", target: 1, unit: "quiz", xpReward: 15 },
    { id: "flashcards", label: "Card Master", icon: "🎴", description: "Review 10 flashcards", target: 10, unit: "cards", xpReward: 25 },
    { id: "lesson", label: "Steady Learner", icon: "📖", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 10 },
  ],
  // Day pattern 3 — speed day
  [
    { id: "quiz", label: "Speed Run", icon: "⚡", description: "Complete a quiz session", target: 1, unit: "quiz", xpReward: 20 },
    { id: "flashcards", label: "Flash Review", icon: "🃏", description: "Review 7 flashcards", target: 7, unit: "cards", xpReward: 20 },
    { id: "lesson", label: "Deep Dive", icon: "🔬", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 15 },
  ],
  // Day pattern 4 — bonus XP day
  [
    { id: "quiz", label: "Bonus Round", icon: "🌟", description: "Complete a quiz session", target: 1, unit: "quiz", xpReward: 25 },
    { id: "flashcards", label: "Card Collector", icon: "🃏", description: "Review 5 flashcards", target: 5, unit: "cards", xpReward: 20 },
    { id: "lesson", label: "Scholar's Path", icon: "📖", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 15 },
  ],
  // Day pattern 5 — marathon
  [
    { id: "quiz", label: "Triple Threat", icon: "🔥", description: "Complete 3 quiz sessions", target: 3, unit: "quizzes", xpReward: 40 },
    { id: "flashcards", label: "Card Scholar", icon: "🃏", description: "Review 5 flashcards", target: 5, unit: "cards", xpReward: 15 },
    { id: "lesson", label: "Lesson Seeker", icon: "📖", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 10 },
  ],
  // Day pattern 6 — balanced
  [
    { id: "quiz", label: "Sunday Scholar", icon: "🎓", description: "Complete a quiz session", target: 1, unit: "quiz", xpReward: 20 },
    { id: "flashcards", label: "Memory Lane", icon: "🧩", description: "Review 8 flashcards", target: 8, unit: "cards", xpReward: 20 },
    { id: "lesson", label: "Weekly Wrap", icon: "📖", description: "Read a lesson session", target: 1, unit: "lesson", xpReward: 15 },
  ],
];

/** Pick the quest set for today based on day-of-year, so quests rotate daily. */
function getTodayQuests(): Quest[] {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const pattern = dayOfYear % QUEST_POOL.length;
  return QUEST_POOL[pattern];
}

const QUESTS: Quest[] = getTodayQuests();

const LS_PREFIX = "gs-daily-quests-";

function getTodayKey(): string {
  return LS_PREFIX + new Date().toISOString().slice(0, 10);
}

function loadProgress(): QuestProgress {
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (raw) return JSON.parse(raw) as QuestProgress;
  } catch {
    // ignore
  }
  return {
    quiz: 0,
    flashcards: 0,
    lesson: 0,
    claimedXP: { quiz: false, flashcards: false, lesson: false },
    boxOpened: false,
  };
}

function saveProgress(p: QuestProgress): void {
  try {
    localStorage.setItem(getTodayKey(), JSON.stringify(p));
  } catch {
    // ignore
  }
}

// ── Quest Row ────────────────────────────────────────────────────────────────

function QuestRow({
  quest,
  progress,
  claimed,
  onClaim,
}: {
  quest: Quest;
  progress: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const completed = progress >= quest.target;
  const pct = Math.min(100, Math.round((progress / quest.target) * 100));

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
        completed
          ? "border-saffron/40 bg-saffron/5"
          : "border-border/50 bg-surface"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full text-lg ${
          completed ? "bg-saffron/20" : "bg-muted/30"
        }`}
      >
        {completed ? "✅" : quest.icon}
      </div>

      {/* Text + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p
            className={`text-sm font-semibold truncate ${
              completed ? "text-saffron" : "text-foreground"
            }`}
          >
            {quest.label}
          </p>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2 tabular-nums">
            {progress}/{quest.target} {quest.unit}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden mb-1">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              completed ? "bg-saffron" : "bg-gold/60"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{quest.description}</p>
      </div>

      {/* XP badge / Claim button */}
      <div className="shrink-0">
        {completed && !claimed ? (
          <button
            onClick={onClaim}
            className="rounded-lg bg-gold px-2.5 py-1 text-[11px] font-bold text-white hover:opacity-90 active:scale-95 transition-all"
          >
            +{quest.xpReward} XP
          </button>
        ) : (
          <span
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
              claimed
                ? "border-saffron/30 bg-saffron/10 text-saffron"
                : "border-gold/30 bg-gold/10 text-gold"
            }`}
          >
            {claimed ? "Claimed" : `+${quest.xpReward} XP`}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Daily Quests Component ────────────────────────────────────────────────────

export function DailyQuests() {
  const { addXP, queueCelebration } = useStore();
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [showBox, setShowBox] = useState(false);

  // Load on mount (client-only)
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  // Listen for cross-component quest progress events
  useEffect(() => {
    function handleQuestEvent(e: Event) {
      const detail = (e as CustomEvent<{ quest: Quest["id"]; amount: number }>).detail;
      if (!detail) return;
      setProgress((prev) => {
        const base = prev ?? loadProgress();
        const updated: QuestProgress = {
          ...base,
          [detail.quest]: base[detail.quest] + detail.amount,
        };
        saveProgress(updated);
        return updated;
      });
    }
    window.addEventListener("gs:quest-progress", handleQuestEvent);
    return () => window.removeEventListener("gs:quest-progress", handleQuestEvent);
  }, []);

  if (!progress) {
    // SSR / loading skeleton
    return (
      <div className="rounded-xl border border-border/50 bg-surface p-4 animate-pulse space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full bg-muted/40 rounded-xl" />
        ))}
      </div>
    );
  }

  const allComplete = QUESTS.every((q) => progress[q.id] >= q.target);
  const allClaimed = QUESTS.every((q) => progress.claimedXP[q.id]);

  function claimXP(questId: Quest["id"], xp: number) {
    setProgress((prev) => {
      if (!prev) return prev;
      const updated: QuestProgress = {
        ...prev,
        claimedXP: { ...prev.claimedXP, [questId]: true },
      };
      saveProgress(updated);
      return updated;
    });
    addXP(xp);
    queueCelebration({ type: "xp_gain", data: { amount: xp } });
  }

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-surface p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚔️</span>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Daily Quests
            </p>
            {(() => {
              const totalReward = QUESTS.reduce((s, q) => s + q.xpReward, 0);
              return totalReward > 45 ? (
                <span className="rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                  BONUS DAY
                </span>
              ) : null;
            })()}
          </div>
          <span className="text-[10px] text-muted-foreground">
            +{QUESTS.reduce((s, q) => s + q.xpReward, 0)} XP total · Resets at midnight
          </span>
        </div>

        {/* Quest rows */}
        <div className="space-y-2">
          {QUESTS.map((quest) => (
            <QuestRow
              key={quest.id}
              quest={quest}
              progress={progress[quest.id]}
              claimed={progress.claimedXP[quest.id]}
              onClaim={() => claimXP(quest.id, quest.xpReward)}
            />
          ))}
        </div>

        {/* Mystery box CTA */}
        {allComplete && allClaimed && !progress.boxOpened && (
          <button
            onClick={() => setShowBox(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/10 to-saffron/10 py-2.5 text-sm font-semibold text-gold hover:from-gold/20 hover:to-saffron/20 transition-all active:scale-95"
          >
            <span className="text-lg">🎁</span>
            Open Mystery Box!
          </button>
        )}

        {allComplete && progress.boxOpened && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            All quests done for today! Come back tomorrow for new quests.
          </p>
        )}

        {allComplete && !allClaimed && (
          <p className="mt-3 text-center text-xs text-saffron font-medium">
            Claim all rewards to unlock the Mystery Box!
          </p>
        )}
      </div>

      {showBox && (
        <MysteryBox
          onClose={(opened) => {
            setShowBox(false);
            if (opened) {
              setProgress((prev) => {
                if (!prev) return prev;
                const updated = { ...prev, boxOpened: true };
                saveProgress(updated);
                return updated;
              });
            }
          }}
        />
      )}
    </>
  );
}

// ── Helper to fire quest progress events from other components ────────────────

/**
 * Call this from quiz/flashcard/lesson components to update quest progress.
 * quest: "quiz" | "flashcards" | "lesson"
 * amount: how much to increment (default 1)
 */
export function trackQuestProgress(quest: "quiz" | "flashcards" | "lesson", amount = 1) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("gs:quest-progress", { detail: { quest, amount } })
  );
}
