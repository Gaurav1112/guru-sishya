"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface StreakFreezeModalProps {
  open: boolean;
  streak: number;
  freezesRemaining: number;
  onUseFreeze: () => void;
  onLetBreak: () => void;
}

export function StreakFreezeModal({
  open,
  streak,
  freezesRemaining,
  onUseFreeze,
  onLetBreak,
}: StreakFreezeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-sm mx-4 rounded-2xl border border-saffron/20 bg-surface p-6 shadow-2xl text-center"
          >
            {/* Animated ice/fire icons */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <motion.span
                className="text-4xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                🔥
              </motion.span>
              <motion.span
                className="text-4xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                ❄️
              </motion.span>
            </div>

            <h2 className="font-heading text-lg font-bold text-foreground mb-1">
              Your {streak}-day streak is at risk!
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              You missed a day, but you have{" "}
              <span className="font-semibold text-cyan-400">
                {freezesRemaining} streak freeze{freezesRemaining !== 1 ? "s" : ""}
              </span>{" "}
              available. Use one to protect your streak?
            </p>

            <div className="flex flex-col gap-2.5">
              <Button
                onClick={onUseFreeze}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                ❄️ Use Streak Freeze
              </Button>
              <Button
                variant="ghost"
                onClick={onLetBreak}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Let it break
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              {freezesRemaining - 1} freeze{freezesRemaining - 1 !== 1 ? "s" : ""} remaining
              after use. Earn more at streak milestones.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
