"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, X, Crown } from "lucide-react";
import { useStore } from "@/lib/store";
import { isNeverExpire, computeDaysRemaining } from "@/lib/stores/premium-slice";

// ── Dismissal persistence ─────────────────────────────────────────────────────

const DISMISS_KEY = "gs-sub-banner-dismissed-until";

function getBannerDismissedUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(DISMISS_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function dismissBannerFor24h() {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
  } catch {
    // ignore
  }
}

// ── Banner message helper ─────────────────────────────────────────────────────

type BannerVariant = "expiring-soon" | "expires-tomorrow" | "expired" | "trial-ending" | null;

interface BannerConfig {
  variant: BannerVariant;
  message: string;
  buttonLabel: string;
}

function resolveBanner(
  isPremium: boolean,
  premiumUntil: string | null,
  paymentId: string | null,
  planType: string | null
): BannerConfig | null {
  // Never show to admin/allowlist users
  if (isNeverExpire(paymentId)) return null;

  const isFreeTrial = planType === "free_trial" || paymentId === "free_trial";

  // Not premium at all — no banner (PremiumGate handles the upsell)
  if (!isPremium || !premiumUntil) return null;

  const days = computeDaysRemaining(premiumUntil);
  if (days === null) return null;

  // Already expired (should have been cleared by checkPremiumExpiry, but guard anyway)
  if (days <= 0) {
    if (isFreeTrial) {
      return {
        variant: "expired",
        message: "Your free trial has ended. Subscribe to keep access to all Pro features.",
        buttonLabel: "Subscribe Now",
      };
    }
    return {
      variant: "expired",
      message: "Your Pro subscription has expired. Upgrade to continue accessing premium features.",
      buttonLabel: "Renew Now",
    };
  }

  // Expires tomorrow (1 day)
  if (days === 1) {
    if (isFreeTrial) {
      return {
        variant: "expires-tomorrow",
        message: "Your free trial ends tomorrow! Subscribe to keep access.",
        buttonLabel: "Subscribe Now",
      };
    }
    return {
      variant: "expires-tomorrow",
      message: "Your Pro subscription expires tomorrow!",
      buttonLabel: "Renew Now",
    };
  }

  // Expiring soon (2–3 days)
  if (days <= 3) {
    if (isFreeTrial) {
      return {
        variant: "trial-ending",
        message: `Your free trial ends in ${days} days. Subscribe to keep access.`,
        buttonLabel: "Subscribe Now",
      };
    }
    return {
      variant: "expiring-soon",
      message: `Your Pro subscription expires in ${days} days. Renew now to keep access.`,
      buttonLabel: "Renew Now",
    };
  }

  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SubscriptionBanner() {
  const { isPremium, premiumUntil, paymentId, planType } = useStore();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if the banner was dismissed within the last 24 h
    const dismissedUntil = getBannerDismissedUntil();
    if (Date.now() < dismissedUntil) {
      setDismissed(true);
    } else {
      setDismissed(false);
    }
  }, []);

  const config = resolveBanner(isPremium, premiumUntil, paymentId, planType);

  // Nothing to show
  if (!mounted || dismissed || !config) return null;

  const isExpired = config.variant === "expired";

  const handleDismiss = () => {
    dismissBannerFor24h();
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
        isExpired
          ? "bg-red-500/15 border-b border-red-500/30 text-red-300"
          : "bg-amber-500/15 border-b border-amber-500/30 text-amber-200"
      }`}
    >
      {/* Icon */}
      <span
        className={`shrink-0 flex items-center justify-center size-6 rounded-full ${
          isExpired ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
        }`}
      >
        {isExpired ? (
          <AlertTriangle className="size-3.5" />
        ) : (
          <Crown className="size-3.5" />
        )}
      </span>

      {/* Message */}
      <span className="flex-1 leading-snug">{config.message}</span>

      {/* CTA button */}
      <Link
        href="/app/pricing"
        className={`shrink-0 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
          isExpired
            ? "bg-red-500/30 hover:bg-red-500/50 text-red-200"
            : "bg-saffron/80 hover:bg-saffron text-background"
        }`}
      >
        {config.buttonLabel}
      </Link>

      {/* Dismiss button */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className={`shrink-0 rounded p-0.5 transition-colors ${
          isExpired
            ? "text-red-400/70 hover:text-red-300 hover:bg-red-500/20"
            : "text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/20"
        }`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
