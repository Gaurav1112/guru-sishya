"use client";


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
  | "mock-interview"
  | "certificates";

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
    description: "Teach Mode helps you truly understand by explaining concepts back. Unlock interactive teaching sessions.",
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
  certificates: {
    title: "Earn Completion Certificates",
    description: "Unlock shareable certificates for every topic you master. Download as image or share directly on LinkedIn.",
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
): { cta: string; href: string; subtext?: string; showStarter?: boolean } {
  if (!hadPremium) {
    return { cta: "Upgrade to Pro — ₹149/mo", href: "/app/pricing", showStarter: true };
  }

  const isFreeTrial = planType === "free_trial";
  if (isFreeTrial) {
    return {
      cta: "Subscribe Now",
      href: "/app/pricing",
      subtext: "Your free trial has ended — Subscribe to continue",
      showStarter: true,
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
  /**
   * Optional daily-limit feature key (from FREE_LIMITS). When provided,
   * if the free user has exhausted today's allowance a daily-limit message
   * is shown instead of (or in addition to) the premium-upgrade gate.
   */
  limitFeature?: string;
}

// Upgrade layer disabled — all features unlocked for everyone
export function PremiumGate({ children }: PremiumGateProps) {
  return <>{children}</>;
}
