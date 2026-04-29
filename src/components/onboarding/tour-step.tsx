"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import type { TourStepDef } from "./tour-steps";

interface TourStepProps {
  step: TourStepDef;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

/** Padding around the highlighted element cutout */
const HIGHLIGHT_PAD = 6;
const TOOLTIP_W = 352;
const TOOLTIP_H_EST = 220;

export function TourStep({
  step,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: TourStepProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const isCenter =
    step.position === "center" || step.targetSelector === "body";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const computePosition = useCallback(() => {
    if (isCenter) {
      setPosition({
        top: window.innerHeight / 2 - TOOLTIP_H_EST / 2,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
      });
      setHighlightRect(null);
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      // Fallback to center if target not found (e.g. on mobile where sidebar is hidden)
      setPosition({
        top: window.innerHeight / 2 - TOOLTIP_H_EST / 2,
        left: window.innerWidth / 2 - TOOLTIP_W / 2,
      });
      setHighlightRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setHighlightRect(rect);

    const pos = isMobile
      ? (step.mobilePosition ?? "bottom")
      : step.position;

    let top = 0;
    let left = 0;

    switch (pos) {
      case "right":
        top = rect.top + rect.height / 2 - TOOLTIP_H_EST / 2;
        left = rect.right + 16;
        break;
      case "bottom":
        top = rect.bottom + 16;
        left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
        break;
      case "top":
        top = rect.top - TOOLTIP_H_EST - 16;
        left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - TOOLTIP_H_EST / 2;
        left = rect.left - TOOLTIP_W - 16;
        break;
      default:
        top = window.innerHeight / 2 - TOOLTIP_H_EST / 2;
        left = window.innerWidth / 2 - TOOLTIP_W / 2;
    }

    // Keep tooltip on screen
    top = Math.max(12, Math.min(top, window.innerHeight - TOOLTIP_H_EST - 12));
    left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_W - 12));

    setPosition({ top, left });
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [step, isCenter, isMobile]);

  useEffect(() => {
    computePosition();
    window.addEventListener("resize", computePosition);
    return () => window.removeEventListener("resize", computePosition);
  }, [computePosition]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onSkip();
      else if (e.key === "ArrowRight" || e.key === "Enter") onNext();
      else if (e.key === "ArrowLeft" && stepNumber > 1) onPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onPrev, onSkip, stepNumber]);

  return (
    <>
      {/* Overlay with optional cutout for highlighted element */}
      {highlightRect ? (
        <svg
          className="fixed inset-0 z-[9998] pointer-events-auto"
          width="100%"
          height="100%"
          onClick={onSkip}
          aria-hidden="true"
        >
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={highlightRect.left - HIGHLIGHT_PAD}
                y={highlightRect.top - HIGHLIGHT_PAD}
                width={highlightRect.width + HIGHLIGHT_PAD * 2}
                height={highlightRect.height + HIGHLIGHT_PAD * 2}
                rx={8}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#tour-mask)"
          />
          {/* Highlight ring around the target element */}
          <rect
            x={highlightRect.left - HIGHLIGHT_PAD}
            y={highlightRect.top - HIGHLIGHT_PAD}
            width={highlightRect.width + HIGHLIGHT_PAD * 2}
            height={highlightRect.height + HIGHLIGHT_PAD * 2}
            rx={8}
            fill="none"
            stroke="var(--color-saffron, #E85D26)"
            strokeWidth={2}
            strokeDasharray="6 3"
            className="animate-pulse"
          />
        </svg>
      ) : (
        <div
          className="fixed inset-0 z-[9998] bg-black/60"
          onClick={onSkip}
          aria-hidden="true"
        />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="dialog"
          aria-label={`Tour step ${stepNumber} of ${totalSteps}: ${step.title}`}
          className="fixed z-[9999] w-[352px] max-w-[calc(100vw-24px)] rounded-2xl border border-saffron/30 bg-gradient-to-br from-surface via-surface to-saffron/[0.03] p-6 shadow-2xl shadow-saffron/10"
          style={{ top: position.top, left: position.left }}
        >
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
            aria-label="Close tour"
          >
            <X className="size-4" />
          </button>

          {/* Step progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < stepNumber
                    ? "bg-saffron w-4"
                    : i === stepNumber
                      ? "bg-saffron/50 w-3"
                      : "bg-muted/40 w-1.5"
                }`}
              />
            ))}
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {stepNumber}/{totalSteps}
            </span>
          </div>

          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-2">
            <span className="text-2xl leading-none mt-0.5" role="img">
              {step.icon}
            </span>
            <h3 className="text-lg font-heading font-bold text-foreground leading-snug">
              {step.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5 pl-9">
            {step.description}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={onSkip}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <SkipForward className="size-3" /> Skip tour
            </button>

            <div className="flex items-center gap-2">
              {stepNumber > 1 && (
                <button
                  onClick={onPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
                >
                  <ChevronLeft className="size-3.5" /> Back
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-saffron text-background text-sm font-semibold hover:bg-saffron/90 transition-colors"
              >
                {stepNumber === totalSteps ? "Get Started" : "Next"}
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
