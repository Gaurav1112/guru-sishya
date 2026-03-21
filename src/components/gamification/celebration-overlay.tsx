"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { getCelebrationTier, getDismissDuration } from "@/lib/gamification/celebrations";
import type { Celebration } from "@/lib/stores/ui-slice";

// ────────────────────────────────────────────────────────────────────────────
// Sub-renderers
// ────────────────────────────────────────────────────────────────────────────

function XPGainToast({ data }: { data: Record<string, unknown> }) {
  const amount = data.amount as number | undefined;
  return (
    <motion.div
      key="xp-gain"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: -20 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-16 right-6 z-[200] pointer-events-none"
    >
      <span className="text-lg font-bold text-gold drop-shadow-lg">
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
  return (
    <motion.div
      key="badge"
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-8 right-6 z-[200] max-w-xs"
    >
      <div className="flex items-center gap-3 rounded-xl border border-gold/40 bg-surface px-4 py-3 shadow-[0_0_20px_rgba(234,179,8,0.25)]">
        <span className="text-3xl">{badge?.icon ?? "🏅"}</span>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
            Badge Unlocked
          </p>
          <p className="font-heading font-bold text-gold leading-tight">{badge?.name}</p>
          <p className="text-xs text-muted-foreground">{badge?.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function StreakMilestoneOverlay({ data }: { data: Record<string, unknown> }) {
  const streak = data.streak as number | undefined;
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

// ────────────────────────────────────────────────────────────────────────────
// Main overlay component
// ────────────────────────────────────────────────────────────────────────────

function CelebrationItem({ celebration }: { celebration: Celebration }) {
  const dequeueCelebration = useStore((s) => s.dequeueCelebration);
  const tier = getCelebrationTier(celebration.type as Parameters<typeof getCelebrationTier>[0]);
  const duration = getDismissDuration(tier);

  useEffect(() => {
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
