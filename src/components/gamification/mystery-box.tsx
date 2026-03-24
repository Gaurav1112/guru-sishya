"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

// ── Types ─────────────────────────────────────────────────────────────────────

type RewardType = "xp" | "coins" | "streak_freeze";

interface Reward {
  type: RewardType;
  value: number;
  icon: string;
  label: string;
  color: string;
}

// ── Reward Pool ────────────────────────────────────────────────────────────────

const REWARDS: Reward[] = [
  { type: "xp", value: 25, icon: "⚡", label: "+25 XP", color: "text-gold" },
  { type: "xp", value: 50, icon: "⚡", label: "+50 XP", color: "text-gold" },
  { type: "xp", value: 75, icon: "⚡", label: "+75 XP", color: "text-gold" },
  { type: "xp", value: 100, icon: "✨", label: "+100 XP", color: "text-saffron" },
  { type: "coins", value: 5, icon: "🪙", label: "+5 Coins", color: "text-gold" },
  { type: "coins", value: 10, icon: "🪙", label: "+10 Coins", color: "text-gold" },
  { type: "coins", value: 20, icon: "🪙", label: "+20 Coins", color: "text-gold" },
  { type: "streak_freeze", value: 1, icon: "🧊", label: "Streak Freeze!", color: "text-teal" },
];

function pickReward(): Reward {
  // Weighted: XP 60%, coins 30%, streak freeze 10%
  const roll = Math.random() * 100;
  if (roll < 10) {
    // Streak freeze — the rarest
    return REWARDS.find((r) => r.type === "streak_freeze")!;
  } else if (roll < 40) {
    const coinRewards = REWARDS.filter((r) => r.type === "coins");
    return coinRewards[Math.floor(Math.random() * coinRewards.length)];
  } else {
    const xpRewards = REWARDS.filter((r) => r.type === "xp");
    return xpRewards[Math.floor(Math.random() * xpRewards.length)];
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface MysteryBoxProps {
  /** Called when the modal closes. opened=true means the reward was claimed. */
  onClose: (opened: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function MysteryBox({ onClose }: MysteryBoxProps) {
  const { addXP, addCoins, addStreakFreeze, queueCelebration } = useStore();

  const [phase, setPhase] = useState<"idle" | "opening" | "revealed">("idle");
  const [reward, setReward] = useState<Reward | null>(null);
  const confettiRef = useRef(false);

  // Fire confetti once reward is revealed
  useEffect(() => {
    if (phase !== "revealed" || confettiRef.current) return;
    confettiRef.current = true;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.45 },
        colors: ["#f97316", "#fbbf24", "#a855f7", "#14b8a6", "#3b82f6"],
      });
    });
  }, [phase]);

  function handleOpen() {
    if (phase !== "idle") return;
    setPhase("opening");

    const picked = pickReward();
    setReward(picked);

    // Brief delay for "opening" animation, then reveal
    setTimeout(() => {
      setPhase("revealed");

      // Apply reward to game state
      if (picked.type === "xp") {
        addXP(picked.value);
        queueCelebration({ type: "xp_gain", data: { amount: picked.value } });
      } else if (picked.type === "coins") {
        addCoins(picked.value, "Mystery Box");
      } else if (picked.type === "streak_freeze") {
        addStreakFreeze();
      }
    }, 800);
  }

  function handleClose() {
    onClose(phase === "revealed");
  }

  return (
    <AnimatePresence>
      <motion.div
        key="mystery-box-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // Close on backdrop click only after reveal
          if (e.target === e.currentTarget && phase === "revealed") handleClose();
        }}
      >
        <motion.div
          key="mystery-box-card"
          initial={{ scale: 0.8, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className="mx-auto w-full max-w-sm rounded-2xl border border-gold/40 bg-surface shadow-2xl p-6 text-center"
        >
          {/* ── Idle: invite to open ─────────────────────────────────────── */}
          {phase === "idle" && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                All Quests Complete!
              </p>

              {/* Wobbling gift box */}
              <motion.div
                className="text-7xl mb-4 select-none inline-block"
                animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
                transition={{
                  duration: 0.7,
                  repeat: Infinity,
                  repeatDelay: 1.2,
                  ease: "easeInOut",
                }}
              >
                🎁
              </motion.div>

              <h2 className="font-heading text-2xl font-bold text-gold mb-1">
                Mystery Box
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                You crushed all 3 daily quests. Click to reveal your secret
                reward!
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpen}
                className="w-full rounded-xl bg-gradient-to-r from-gold to-saffron px-4 py-3 text-sm font-bold text-white shadow-lg hover:opacity-95 transition-opacity"
              >
                Open Mystery Box
              </motion.button>

              <button
                onClick={() => onClose(false)}
                className="mt-3 w-full rounded-xl border border-border/60 px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors"
              >
                Save for later
              </button>
            </>
          )}

          {/* ── Opening: loading shimmer ──────────────────────────────────── */}
          {phase === "opening" && (
            <div className="py-8">
              <motion.div
                className="text-7xl inline-block"
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, -10, 10, -6, 6, 0],
                }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                🎁
              </motion.div>
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">
                Opening…
              </p>
            </div>
          )}

          {/* ── Revealed: show reward ─────────────────────────────────────── */}
          {phase === "revealed" && reward && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                You got…
              </p>

              {/* Exploding box */}
              <motion.div
                className="text-6xl mb-2 inline-block"
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 20 }}
              >
                {reward.type === "streak_freeze" ? "🧊" : reward.type === "coins" ? "🪙" : "⚡"}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p
                  className={`font-heading text-4xl font-black mb-1 ${reward.color}`}
                >
                  {reward.label}
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {reward.type === "xp" && "Added to your XP total!"}
                  {reward.type === "coins" && "Coins added to your wallet!"}
                  {reward.type === "streak_freeze" &&
                    "Streak Freeze saved — your streak is protected for one missed day!"}
                </p>
              </motion.div>

              {/* Glow ring */}
              <motion.div
                className="mx-auto mb-5 size-16 rounded-full"
                style={{
                  background:
                    reward.type === "streak_freeze"
                      ? "radial-gradient(circle, rgba(20,184,166,0.25), transparent)"
                      : "radial-gradient(circle, rgba(251,191,36,0.25), transparent)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClose}
                className="w-full rounded-xl bg-saffron px-4 py-3 text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                Awesome, thanks!
              </motion.button>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
