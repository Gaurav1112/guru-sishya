"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, SkipForward } from "lucide-react";
import type { TourStepDef } from "./tour-steps";

interface TourStepProps {
  step: TourStepDef;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TourStep({ step, stepNumber, totalSteps, onNext, onSkip }: TourStepProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const isModal = step.targetSelector === "body";
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  useEffect(() => {
    if (isModal) {
      setPosition({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 });
      return;
    }
    const target = document.querySelector(step.targetSelector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const pos = isMobile ? (step.mobilePosition ?? "bottom") : step.position;
    let top = 0, left = 0;
    switch (pos) {
      case "right": top = rect.top + rect.height / 2 - 40; left = rect.right + 12; break;
      case "bottom": top = rect.bottom + 12; left = rect.left + rect.width / 2 - 160; break;
      case "top": top = rect.top - 120; left = rect.left + rect.width / 2 - 160; break;
      case "left": top = rect.top + rect.height / 2 - 40; left = rect.left - 332; break;
    }
    top = Math.max(8, Math.min(top, window.innerHeight - 200));
    left = Math.max(8, Math.min(left, window.innerWidth - 340));
    setPosition({ top, left });
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step, isModal, isMobile]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed z-[9999] w-80 rounded-xl border border-saffron/30 bg-surface p-5 shadow-2xl shadow-saffron/10"
        style={{ top: position.top, left: position.left }}
      >
        <button onClick={onSkip} className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
        <div className="text-xs text-saffron font-medium mb-1">{stepNumber} of {totalSteps}</div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
        <div className="flex items-center justify-between">
          <button onClick={onSkip} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <SkipForward className="size-3" /> Skip tour
          </button>
          <button onClick={onNext} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron text-background text-sm font-medium hover:bg-saffron/90 transition-colors">
            {stepNumber === totalSteps ? "Get Started" : "Next"} <ChevronRight className="size-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
