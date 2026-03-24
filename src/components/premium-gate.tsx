"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useStore } from "@/lib/store";

// ── Feature definitions ───────────────────────────────────────────────────────

export type PremiumFeature =
  | "full-answers"
  | "full-sessions"
  | "star-answers"
  | "advanced-quiz"
  | "ladder-advanced"
  | "feynman"
  | "full-flashcards";

const FEATURE_LABELS: Record<PremiumFeature, { title: string; description: string }> = {
  "full-answers": {
    title: "Full Interview Answers",
    description: "Unlock all interview Q&A answers beyond the first 5.",
  },
  "full-sessions": {
    title: "All Learning Sessions",
    description: "Unlock all lesson sessions beyond the first 2 per topic.",
  },
  "star-answers": {
    title: "All STAR Answers",
    description: "Unlock all STAR method answers beyond the first 3.",
  },
  "advanced-quiz": {
    title: "Advanced Quiz Mode",
    description: "Unlock hard difficulty questions and timed quiz challenges.",
  },
  "ladder-advanced": {
    title: "Full Learning Ladder",
    description: "Unlock ladder levels 2–5 for deep mastery.",
  },
  "feynman": {
    title: "Feynman Technique",
    description: "Unlock the Feynman learning technique for deeper understanding.",
  },
  "full-flashcards": {
    title: "Unlimited Flashcards",
    description: "Unlock all flashcards beyond the first 50.",
  },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  /** When true, renders children with a blur overlay instead of replacing them */
  overlay?: boolean;
}

export function PremiumGate({ feature, children, overlay = true }: PremiumGateProps) {
  const { isPremium, premiumUntil, checkPremiumExpiry } = useStore();

  // Re-check expiry whenever this gate renders
  useEffect(() => {
    checkPremiumExpiry();
  }, [checkPremiumExpiry]);

  const isActive =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  if (isActive) {
    return <>{children}</>;
  }

  const { title, description } = FEATURE_LABELS[feature];

  if (overlay) {
    return (
      <div className="relative">
        {/* Blurred content behind the gate */}
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-[2px]">
          <div className="mx-4 flex flex-col items-center gap-3 rounded-2xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-gold/10 to-background p-6 text-center shadow-xl max-w-sm w-full">
            <div className="flex size-12 items-center justify-center rounded-full border border-saffron/40 bg-saffron/10">
              <Lock className="size-5 text-saffron" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <Link
              href="/app/pricing"
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Non-overlay variant: replace content entirely with the gate card
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-gold/10 to-background p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-saffron/40 bg-saffron/10">
        <Lock className="size-5 text-saffron" />
      </div>
      <div>
        <p className="font-heading font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Link
        href="/app/pricing"
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
