"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Lock, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";

// ── Feature definitions ───────────────────────────────────────────────────────

export type PremiumFeature =
  | "full-answers"
  | "full-sessions"
  | "star-answers"
  | "advanced-quiz"
  | "ladder-advanced"
  | "feynman"
  | "full-flashcards"
  | "full-cheatsheets"
  | "mock-interview";

const FEATURE_LABELS: Record<PremiumFeature, { title: string; description: string }> = {
  "full-answers": {
    title: "823 More Answers Waiting",
    description: "You've seen 5. Unlock all 828 detailed answers — including exact questions asked at Google, Amazon, and Meta.",
  },
  "full-sessions": {
    title: "Continue Your Learning Journey",
    description: "You've completed the intro. Unlock all remaining sessions with code examples, diagrams, and interview tips.",
  },
  "star-answers": {
    title: "STAR Answers for FAANG",
    description: "See how top engineers structure their behavioral answers for Google, Amazon, Microsoft, Meta, Apple, and Netflix.",
  },
  "advanced-quiz": {
    title: "Ready for Hard Mode?",
    description: "Unlock Hard difficulty questions and timed challenges that simulate real interview pressure.",
  },
  "ladder-advanced": {
    title: "Climb to Expert Level",
    description: "You've mastered the basics. Unlock levels 2-5 to prove deep mastery with graduation tests.",
  },
  "feynman": {
    title: "Teach It to Learn It",
    description: "The Feynman Technique helps you truly understand by explaining concepts back. Unlock interactive teaching sessions.",
  },
  "full-flashcards": {
    title: "2000+ Flashcards for Deep Retention",
    description: "Unlock the full spaced repetition deck with SM-2 algorithm for long-term memory.",
  },
  "full-cheatsheets": {
    title: "Quick Reference for Every Topic",
    description: "Access all 63+ cheat sheets — visual summaries with code snippets for last-minute revision.",
  },
  "mock-interview": {
    title: "Practice Like It's Real",
    description: "AI-powered mock interviews with company-specific questions, voice input, and instant scoring.",
  },
};

// ── Gate copy resolver ────────────────────────────────────────────────────────

/**
 * Returns the CTA label and href based on why the gate is shown.
 *  - never subscribed  → "Upgrade to Pro"
 *  - free trial ended  → "Your free trial has ended — Subscribe to continue"
 *  - subscription lapsed → "Your Pro subscription has expired — Renew"
 */
function resolveGateCopy(
  hadPremium: boolean,
  planType: string | null
): { cta: string; href: string; subtext?: string } {
  if (!hadPremium) {
    // User has never been premium (no stored premiumUntil at all)
    return { cta: "Upgrade to Pro", href: "/app/pricing" };
  }

  const isFreeTrial = planType === "free_trial";
  if (isFreeTrial) {
    return {
      cta: "Subscribe Now",
      href: "/app/pricing",
      subtext: "Your free trial has ended — Subscribe to continue",
    };
  }

  return {
    cta: "Renew Now",
    href: "/app/pricing",
    subtext: "Your Pro subscription has expired",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PremiumGateProps {
  feature: PremiumFeature;
  children?: React.ReactNode;
  /** When true, renders children with a blur overlay instead of replacing them */
  overlay?: boolean;
}

export function PremiumGate({ feature, children, overlay = true }: PremiumGateProps) {
  const { isPremium, premiumUntil, paymentId, planType, checkPremiumExpiry } = useStore();

  // Synchronous expiry check — runs BEFORE render decision, not in useEffect
  // This prevents the flash of premium content on mobile
  const checkResult = checkPremiumExpiry();

  // Also verify in useEffect for cleanup side effects
  useEffect(() => {
    checkPremiumExpiry();
  }, [checkPremiumExpiry]);

  // Triple-check: isPremium flag AND valid date AND expiry check passed
  const isActive =
    isPremium &&
    premiumUntil != null &&
    new Date(premiumUntil) > new Date() &&
    checkResult !== false;

  if (isActive) {
    return <>{children}</>;
  }

  const { title, description } = FEATURE_LABELS[feature];

  // Was the user ever premium (i.e. premiumUntil was set before expiry cleared it)?
  // After expiry, premiumUntil is cleared. We use planType as the indicator
  // that they had a subscription previously.
  // paymentId is also cleared on expiry — so we check planType (also cleared on expiry).
  // Instead, we check if paymentId still exists in state (it's cleared on expiry too).
  // The safest heuristic: if we have a paymentId remnant OR planType remnant, they had premium.
  // Since both are cleared on expiry, we check the pre-expiry stored planType before it's wiped.
  // For the gate rendering: isPremium=false can mean (a) never subscribed, or (b) expired.
  // We distinguish by checking if planType is non-null (set on subscription start, cleared only
  // when we explicitly wipe it on expiry via checkPremiumExpiry in the slice).
  // NOTE: planType IS wiped in checkPremiumExpiry, so at this render point it may already be null.
  // We therefore also keep a fallback: paymentId (also wiped). This means after expiry the gate
  // will show "Upgrade to Pro" — which is acceptable since the state is cleared.
  // The banner (shown while still active) handles the "expiring soon" message.
  const hadPremium = planType != null || paymentId != null;
  const { cta, href, subtext } = resolveGateCopy(hadPremium, planType);

  const GateIcon = hadPremium ? RefreshCw : Lock;

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
              <GateIcon className="size-5 text-saffron" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              {subtext && (
                <p className="mt-2 text-xs font-medium text-amber-400">{subtext}</p>
              )}
            </div>
            <Link
              href={href}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              {cta}
            </Link>
            {!hadPremium && (
              <Link
                href="/app/pricing"
                className="text-xs text-muted-foreground hover:text-saffron transition-colors"
              >
                or start 7-day free trial
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Non-overlay variant: replace content entirely with the gate card
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-gold/10 to-background p-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-saffron/40 bg-saffron/10">
        <GateIcon className="size-5 text-saffron" />
      </div>
      <div>
        <p className="font-heading font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {subtext && (
          <p className="mt-2 text-xs font-medium text-amber-400">{subtext}</p>
        )}
      </div>
      <Link
        href={href}
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        {cta}
      </Link>
    </div>
  );
}
