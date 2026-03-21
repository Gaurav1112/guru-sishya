"use client";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

interface CoinDisplayProps {
  coins: number;
}

export function CoinDisplay({ coins }: CoinDisplayProps) {
  const controls = useAnimation();
  const prevCoins = useRef(coins);

  useEffect(() => {
    if (coins !== prevCoins.current) {
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3, ease: "easeOut" },
      });
      prevCoins.current = coins;
    }
  }, [coins, controls]);

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <motion.span animate={controls} className="inline-block text-gold">
        🪙
      </motion.span>
      <span className="font-medium tabular-nums">{coins.toLocaleString()}</span>
    </div>
  );
}
