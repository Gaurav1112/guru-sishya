"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { getCelebrationTier, getDismissDuration } from "@/lib/gamification/celebrations";
import type { Celebration } from "@/lib/stores/ui-slice";
import { sounds } from "@/lib/audio";

// ────────────────────────────────────────────────────────────────────────────
// Sub-renderers
// ────────────────────────────────────────────────────────────────────────────

function XPGainToast({ data }: { data: Record<string, unknown> }) {
  const amount = data.amount as number | undefined;

  useEffect(() => {
    sounds.coin();
  }, []);

  return (
    <motion.div
      key="xp-gain"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: -40, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed top-14 right-6 z-[200] pointer-events-none"
    >
      <span className="text-2xl font-black text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
        +{amount ?? "?"} XP
      </span>
    </motion.div>
  );
}

function LevelUpOverlay({ data }: { data: Record<string, unknown> }) {
  const title = data.title as string | undefined;
  const level = data.level as number | undefined;
  const confettiRef = useRef(false);

  useEffect(() => {
    sounds.levelUp();
  }, []);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#f97316", "#fbbf24", "#a855f7", "#3b82f6"],
      });
    });
  }, []);

  return (
    <motion.div
      key="level-up"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-2">Level Up!</p>
        <h2 className="font-heading text-5xl font-bold text-saffron mb-2">Level {level}</h2>
        <p className="font-heading text-2xl text-gold">{title}</p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-muted-foreground text-sm"
        >
          Keep going, scholar!
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function BadgeOverlay({ data }: { data: Record<string, unknown> }) {
  const badge = data.badge as { icon: string; name: string; description: string } | undefined;
  const confettiRef = useRef(false);

  useEffect(() => {
    sounds.badge();
  }, []);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#f97316", "#fbbf24", "#a855f7"],
      });
    });
  }, []);

  return (
    <motion.div
      key="badge"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-center"
      >
        <p className="text-muted-foreground text-sm uppercase tracking-widest mb-4">
          Badge Unlocked!
        </p>
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 8px rgba(234,179,8,0.4))",
              "drop-shadow(0 0 24px rgba(234,179,8,0.9))",
              "drop-shadow(0 0 8px rgba(234,179,8,0.4))",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-8xl mb-6 inline-block"
        >
          {badge?.icon ?? "🏅"}
        </motion.div>
        <h2 className="font-heading text-4xl font-bold text-gold mb-2">{badge?.name}</h2>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">{badge?.description}</p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-muted-foreground text-xs"
        >
          Tap anywhere to continue
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function StreakMilestoneOverlay({ data }: { data: Record<string, unknown> }) {
  const streak = data.streak as number | undefined;

  useEffect(() => {
    sounds.streak();
  }, []);

  return (
    <motion.div
      key="streak-milestone"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="fixed top-16 left-1/2 z-[200] -translate-x-1/2"
    >
      <div className="flex items-center gap-2 rounded-xl border border-orange-500/40 bg-surface px-5 py-3 shadow-lg">
        <span className="text-2xl">🔥</span>
        <span className="font-heading font-bold text-orange-400">{streak} Day Streak!</span>
      </div>
    </motion.div>
  );
}

function PerfectRoundOverlay() {
  const confettiRef = useRef(false);

  useEffect(() => {
    sounds.perfect();
  }, []);

  useEffect(() => {
    if (confettiRef.current) return;
    confettiRef.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ["#22c55e", "#fbbf24", "#f97316"],
      });
    });
  }, []);

  return (
    <motion.div
      key="perfect-round"
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="fixed top-1/2 left-1/2 z-[200] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      <div className="text-center">
        <p className="font-heading text-5xl font-black text-green-400 drop-shadow-lg">Perfect!</p>
      </div>
    </motion.div>
  );
}

function StreakBrokenOverlay({ data }: { data: Record<string, unknown> }) {
  const lostStreak = data.lostStreak as number | undefined;
  const dequeueCelebration = useStore((s) => s.dequeueCelebration);
  const { coins, spendCoins, setStreak, currentStreak, longestStreak } = useStore();
  const canRepair = coins >= 200;

  function handleRepair() {
    const success = spendCoins(200, "Streak Repair");
    if (success) {
      // Restore the streak to the old count
      setStreak(lostStreak ?? 1, Math.max(longestStreak, lostStreak ?? 1));
    }
    dequeueCelebration();
  }

  function handleStartFresh() {
    dequeueCelebration();
  }

  return (
    <motion.div
      key="streak-broken"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center max-w-sm px-6"
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1], scale: [1, 0.92, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl mb-6"
        >
          🔥
        </motion.div>

        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
          Your {lostStreak}-day streak was lost
        </h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          Life happens — even the most dedicated scholars miss a day. Your progress and knowledge
          remain. Pick up where you left off.
        </p>

        <div className="flex flex-col gap-3">
          {canRepair && (
            <button
              onClick={handleRepair}
              className="flex items-center justify-center gap-2 rounded-xl bg-gold/20 border border-gold/40 px-5 py-3 text-gold font-semibold hover:bg-gold/30 transition-colors"
            >
              <span>🪙</span>
              <span>Repair for 200 coins</span>
              <span className="text-xs text-gold/70 ml-1">({coins} available)</span>
            </button>
          )}
          {!canRepair && (
            <div className="text-xs text-muted-foreground mb-1">
              Not enough coins to repair (need 200, have {coins})
            </div>
          )}
          <button
            onClick={handleStartFresh}
            className="rounded-xl border border-border/50 px-5 py-3 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors text-sm"
          >
            Start fresh — every day is a new beginning
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main overlay component
// ────────────────────────────────────────────────────────────────────────────

function CelebrationItem({ celebration }: { celebration: Celebration }) {
  const dequeueCelebration = useStore((s) => s.dequeueCelebration);
  const tier = getCelebrationTier(celebration.type as Parameters<typeof getCelebrationTier>[0]);
  const duration = getDismissDuration(tier);

  useEffect(() => {
    // streak_broken is interactive — user dismisses manually
    if (celebration.type === "streak_broken") return;
    const timer = setTimeout(() => {
      dequeueCelebration();
    }, duration);
    return () => clearTimeout(timer);
  }, [celebration, dequeueCelebration, duration]);

  switch (celebration.type) {
    case "xp_gain":
      return <XPGainToast data={celebration.data} />;
    case "level_up":
      return <LevelUpOverlay data={celebration.data} />;
    case "badge":
      return <BadgeOverlay data={celebration.data} />;
    case "streak_milestone":
      return <StreakMilestoneOverlay data={celebration.data} />;
    case "perfect_round":
      return <PerfectRoundOverlay />;
    case "streak_broken":
      return <StreakBrokenOverlay data={celebration.data} />;
    default:
      return null;
  }
}

export function CelebrationOverlay() {
  const celebrationQueue = useStore((s) => s.celebrationQueue);
  const current = celebrationQueue[0] ?? null;

  return (
    <AnimatePresence mode="wait">
      {current && (
        <CelebrationItem key={`${current.type}-${JSON.stringify(current.data)}`} celebration={current} />
      )}
    </AnimatePresence>
  );
}
