"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { openChest } from "@/lib/gamification/treasure-chests";
import type { ChestReward } from "@/lib/gamification/treasure-chests";

interface TreasureChestProps {
  chestId: number;
  onClaim: (reward: ChestReward) => void;
  onDismiss: () => void;
}

/**
 * Animated treasure chest that opens to reveal coins and optional item.
 * Auto-dismisses after 5 seconds if unclaimed.
 */
export function TreasureChest({ chestId, onClaim, onDismiss }: TreasureChestProps) {
  const [opened, setOpened] = useState(false);
  const [reward, setReward] = useState<ChestReward | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [visible, setVisible] = useState(true);

  // Auto-dismiss countdown after chest is opened and reward revealed
  useEffect(() => {
    if (!opened || !reward) return;
    if (secondsLeft <= 0) {
      setVisible(false);
      onDismiss();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [opened, reward, secondsLeft, onDismiss]);

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    try {
      const result = await openChest(chestId);
      if (result) {
        setReward(result);
        setOpened(true);
        onClaim(result);
      } else {
        // Already opened or missing — just dismiss
        setVisible(false);
        onDismiss();
      }
    } catch {
      setVisible(false);
      onDismiss();
    } finally {
      setClaiming(false);
    }
  }

  function handleDismiss() {
    setVisible(false);
    onDismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="treasure-chest"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        >
          <div className="mx-auto w-full max-w-sm rounded-2xl border border-gold/40 bg-surface shadow-2xl p-6 text-center">
            {!opened ? (
              <>
                {/* Closed chest */}
                <motion.div
                  className="text-7xl mb-4 select-none"
                  animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  🎁
                </motion.div>
                <h2 className="text-xl font-heading font-bold mb-1">Treasure Chest!</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  You earned a chest — open it to claim your reward!
                </p>
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
                >
                  {claiming ? "Opening…" : "Open Chest"}
                </button>
                <button
                  onClick={handleDismiss}
                  className="mt-3 w-full rounded-xl border border-border/60 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/30"
                >
                  Save for later
                </button>
              </>
            ) : reward ? (
              <>
                {/* Opened chest — lid lift animation */}
                <motion.div
                  className="relative text-7xl mb-4 select-none inline-block"
                  initial={{ scale: 1 }}
                >
                  {/* Lid */}
                  <motion.span
                    className="absolute inset-0 flex items-center justify-center text-7xl origin-bottom"
                    initial={{ rotateX: 0 }}
                    animate={{ rotateX: -140, y: -20 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                    style={{ display: "block" }}
                  >
                    🔓
                  </motion.span>
                  <span>📦</span>
                </motion.div>

                {/* Coins burst */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">🪙</span>
                    <span className="text-3xl font-heading font-bold text-gold">
                      +{reward.coins}
                    </span>
                  </div>
                  {reward.item && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-xs font-medium text-saffron"
                    >
                      <span>{reward.item.type === "potion" ? "⚗️" : "✨"}</span>
                      <span>{reward.item.name}</span>
                    </motion.div>
                  )}
                </motion.div>

                <p className="text-sm font-medium text-foreground mb-1">Reward claimed!</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Auto-closing in {secondsLeft}s
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full rounded-xl border border-border/60 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
                >
                  Close
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
