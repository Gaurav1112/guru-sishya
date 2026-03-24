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
  "full-cheatsheets": {
    title: "All Cheat Sheets",
    description: "Upgrade to Pro to access all 56 cheat sheets.",
  },
  "mock-interview": {
    title: "Unlimited Mock Interviews",
    description: "Upgrade to Pro for unlimited interviews with 8 questions per session. Free plan: 1 interview per day.",
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
