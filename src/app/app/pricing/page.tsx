"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Zap, Infinity as InfinityIcon, LogIn, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import { PageTransition } from "@/components/page-transition";
import { CountdownTimer } from "@/components/pricing/countdown-timer";
import { trackEvent } from "@/lib/analytics";
// ── Types ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

type PlanType = "starter" | "monthly" | "semester" | "annual" | "lifetime";

// ── Plan data ─────────────────────────────────────────────────────────────────

const PLANS: {
  id: PlanType;
  label: string;
  price: number;
  originalPrice?: number;
  period: string;
  savingsPct?: number;
  highlight: boolean;
  isLifetime?: boolean;
  icon: React.ReactNode;
  badge?: string;
}[] = [
  {
    id: "starter",
    label: "Starter",
    price: 49,
    period: "per month",
    highlight: false,
    icon: <Zap className="size-5" />,
    badge: "New",
  },
  {
    id: "monthly",
    label: "Pro Monthly",
    price: 149,
    originalPrice: 299,
    period: "per month",
    savingsPct: 50,
    highlight: false,
    icon: <Sparkles className="size-5" />,
    badge: "50% Off",
  },
  {
    id: "semester",
    label: "Pro Semester",
    price: 699,
    originalPrice: 149 * 6,
    period: "for 6 months",
    savingsPct: Math.round((1 - 699 / (149 * 6)) * 100),
    highlight: false,
    icon: <Zap className="size-5" />,
    badge: `Save ${Math.round((1 - 699 / (149 * 6)) * 100)}%`,
  },
  {
    id: "annual",
    label: "Annual",
    price: 1199,
    originalPrice: 149 * 12,
    period: "per year",
    savingsPct: Math.round((1 - 1199 / (149 * 12)) * 100),
    highlight: true,
    icon: <Crown className="size-5" />,
    badge: `Most Popular · Save ${Math.round((1 - 1199 / (149 * 12)) * 100)}%`,
  },
  {
    id: "lifetime",
    label: "Lifetime",
    price: 2999,
    period: "one-time payment",
    highlight: false,
    isLifetime: true,
    icon: <InfinityIcon className="size-5" />,
    badge: "Best Value",
  },
];

// ── Competitor comparison data ────────────────────────────────────────────────

const COMPARISON = [
  {
    feature: "Price",
    gs: "₹49-149/mo",
    lc: "₹2,917/mo",
    ae: "₹1,660/mo",
    nc: "₹991/mo",
    gsHighlight: true,
  },
  {
    feature: "Interview Questions",
    gs: "828 with answers",
    lc: "2800+ (no answers)",
    ae: "160",
    nc: "150",
    gsHighlight: true,
  },
  {
    feature: "System Design",
    gs: "32 topics",
    lc: "Premium only",
    ae: "Included",
    nc: "Partial",
    gsHighlight: false,
  },
  {
    feature: "Behavioral (STAR)",
    gs: "58 questions",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
  {
    feature: "Works Offline",
    gs: "Yes",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
  {
    feature: "Spaced Repetition",
    gs: "Built-in",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
];

function CompetitorCell({ value }: { value: string }) {
  const isYes = value === "Yes" || value === "Built-in" || value === "Included";
  const isNo = value === "No" || value === "Premium only" || value === "Partial";
  return (
    <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-center">
      {isYes ? (
        <span className="inline-flex items-center gap-1 text-teal font-medium">
          <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          {value}
        </span>
      ) : isNo ? (
        <span className="inline-flex items-center gap-1 text-muted-foreground/50">
          <X className="h-3 w-3 flex-shrink-0" />
          {value}
        </span>
      ) : (
        <span className="text-muted-foreground">{value}</span>
      )}
    </td>
  );
}

// ── Feature comparison data ───────────────────────────────────────────────────

const FEATURES: { label: string; free: boolean | string; starter: boolean | string; pro: boolean | string }[] = [
  { label: "All topics + quiz banks", free: true, starter: true, pro: true },
  { label: "First 5 interview Q&A answers per topic", free: true, starter: true, pro: true },
  { label: "Learning sessions per topic", free: "2/topic", starter: "3/topic", pro: true },
  { label: "First 3 STAR method answers", free: true, starter: true, pro: true },
  { label: "Easy & medium quiz difficulty", free: "3/day", starter: true, pro: true },
  { label: "Up to 50 flashcards", free: true, starter: true, pro: true },
  { label: "Gamification (XP, streaks, badges)", free: true, starter: true, pro: true },
  { label: "Study Buddy AI messages", free: "2/day", starter: "10/day", pro: true },
  { label: "Full interview Q&A answers (unlimited)", free: false, starter: false, pro: true },
  { label: "All learning sessions (unlimited)", free: false, starter: false, pro: true },
  { label: "All STAR method answers", free: false, starter: false, pro: true },
  { label: "Hard difficulty + timed quiz mode", free: false, starter: false, pro: true },
  { label: "Full Skill Levels (levels 2-5)", free: false, starter: false, pro: true },
  { label: "Teach Mode sessions", free: false, starter: false, pro: true },
  { label: "Unlimited flashcards", free: false, starter: false, pro: true },
  { label: "Cheatsheet export", free: false, starter: false, pro: true },
  { label: "Mock interview", free: false, starter: false, pro: true },
  { label: "Java playground", free: false, starter: false, pro: true },
  { label: "Completion certificates", free: false, starter: false, pro: true },
];

// ── Razorpay script loader ────────────────────────────────────────────────────

function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as Record<string, unknown>).Razorpay) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(false);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return loaded;
}

// ── Pricing Page ──────────────────────────────────────────────────────────────

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const {
    isPremium,
    premiumUntil,
    planType: storedPlanType,
    setPremiumStatus,
    activateFreeTrial,
    checkPremiumExpiry,
  } = useStore();
  const razorpayLoaded = useRazorpayScript();

  const [loadingPlan, setLoadingPlan] = useState<PlanType | null>(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [countdownEndDate, setCountdownEndDate] = useState<string | null>(null);
  // Static stats — avoids loading 11MB of content JSON on the pricing page
  const contentStats = { topicCount: 81, questionCount: 1730, sessionCount: 500 };

  // Re-check expiry on mount and check trial-used flag
  useEffect(() => {
    checkPremiumExpiry();
    try {
      setTrialUsed(localStorage.getItem("gs-trial-used") === "true");
    } catch {
      // ignore
    }
    // Rolling 3-day countdown window
    try {
      const stored = localStorage.getItem("gs-price-timer-end");
      if (stored && new Date(stored).getTime() > Date.now()) {
        setCountdownEndDate(stored);
      } else {
        const end = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
        localStorage.setItem("gs-price-timer-end", end);
        setCountdownEndDate(end);
      }
    } catch {
      setCountdownEndDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString());
    }
  }, [checkPremiumExpiry]);


  const isActive =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  // True when the user previously had a paid plan (not free trial) that has now expired
  const hadPaidPlan =
    !isActive &&
    storedPlanType != null &&
    storedPlanType !== "free_trial" &&
    storedPlanType !== "admin_free" &&
    storedPlanType !== "allowlist_free";

  const handleBuyPlan = useCallback(
    async (planType: PlanType) => {
      if (!razorpayLoaded) {
        setError("Payment SDK is still loading. Please try again in a moment.");
        return;
      }
      setError(null);
      setLoadingPlan(planType);

      try {
        // 1. Create Razorpay order on the server
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planType }),
        });

        if (!orderRes.ok) {
          const data = await orderRes.json();
          throw new Error(data.error ?? "Failed to create order.");
        }

        const { orderId, amount, currency, key } = await orderRes.json();

        // 2. Open Razorpay checkout modal
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay({
            key,
            amount,
            currency,
            order_id: orderId,
            name: "Guru Sishya",
            description: `${PLANS.find((p) => p.id === planType)?.label ?? planType} Pro Plan`,
            image: "/icon.png",
            theme: { color: "#E07B39" }, // saffron
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled.")),
            },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                // 3. Verify payment on the server
                const verifyRes = await fetch("/api/razorpay/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    planType,
                  }),
                });

                const verifyData = await verifyRes.json();

                if (!verifyRes.ok || !verifyData.success) {
                  throw new Error(verifyData.error ?? "Payment verification failed.");
                }

                // 4. Update store with premium status (including planType)
                setPremiumStatus(
                  true,
                  verifyData.premiumUntil,
                  verifyData.paymentId,
                  verifyData.planType ?? planType
                );
                trackEvent("subscription_purchased", {
                  plan_type: verifyData.planType ?? planType,
                  amount: amount as number,
                });
                resolve();
              } catch (verifyErr) {
                reject(verifyErr);
              }
            },
          });

          rzp.open();
        });

        // 5. Redirect to dashboard on success
        router.push("/app/dashboard");
      } catch (err) {
        if (err instanceof Error && err.message !== "Payment cancelled.") {
          setError(err.message);
        }
      } finally {
        setLoadingPlan(null);
      }
    },
    [razorpayLoaded, setPremiumStatus, router]
  );

  const handleFreeTrial = useCallback(() => {
    setTrialLoading(true);
    const result = activateFreeTrial();
    if (!result.success) {
      setError(result.reason ?? "Trial already used. Subscribe to continue.");
      setTrialLoading(false);
      setTrialUsed(true);
      return;
    }
    setTimeout(() => {
      router.push("/app/dashboard");
    }, 800);
  }, [activateFreeTrial, router]);

  return (
    <PageTransition>
      <div className="mx-auto max-w-5xl space-y-12 py-4">
      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-xs font-medium tracking-widest text-saffron uppercase">
          Guru Sishya Pro
        </p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold">
          Stop Guessing. Start Acing Interviews.
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          828 answers, {contentStats.questionCount.toLocaleString()} quiz questions, and {contentStats.sessionCount} lessons across {contentStats.topicCount} topics — everything you need to ace your software engineering interviews.
        </p>

        {isActive && (
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold">
            <Crown className="size-4" />
            You are a Pro member until{" "}
            {new Date(premiumUntil!).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Countdown timer — always show, rolling 3-day window */}
      {countdownEndDate && <CountdownTimer endDate={countdownEndDate} />}
      <p className="text-center text-muted-foreground text-sm mb-8">
        Trusted by software engineers preparing for interviews at top tech companies
      </p>

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.45, ease: "easeOut" }}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
              plan.isLifetime
                ? "border-gold/60 bg-gradient-to-b from-gold/15 via-gold/5 to-background shadow-lg shadow-gold/20 ring-1 ring-gold/30"
                : plan.highlight
                ? "border-saffron/50 bg-gradient-to-b from-saffron/10 via-gold/5 to-background shadow-lg shadow-saffron/10"
                : "border-border/50 bg-surface"
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              plan.isLifetime ? (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold bg-gradient-to-r from-gold to-saffron text-background"
                >
                  {plan.badge}
                </motion.div>
              ) : plan.highlight ? (
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold bg-saffron text-background"
                >
                  {plan.badge}
                </motion.div>
              ) : (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold bg-gold/20 text-gold border border-gold/30"
                >
                  {plan.badge}
                </div>
              )
            )}

            {/* Icon + label */}
            <div
              className={`flex size-10 items-center justify-center rounded-full mb-4 ${
                plan.isLifetime
                  ? "bg-gold/25 text-gold ring-1 ring-gold/40"
                  : plan.highlight
                  ? "bg-saffron/20 text-saffron"
                  : "bg-gold/10 text-gold"
              }`}
            >
              {plan.icon}
            </div>

            <p className="font-heading text-lg font-semibold mb-1">{plan.label}</p>

            {/* Price */}
            <div className="flex items-end gap-2 mb-1">
              <span className="font-heading text-4xl font-bold">
                ₹{plan.price.toLocaleString("en-IN")}
              </span>
              {plan.originalPrice && (
                <span className="text-sm text-muted-foreground line-through mb-1">
                  ₹{plan.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-6">{plan.period}</p>

            <button
              type="button"
              disabled={!!loadingPlan || isActive}
              onClick={() => handleBuyPlan(plan.id)}
              className={`mt-auto w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                plan.isLifetime
                  ? "bg-gradient-to-r from-gold to-saffron text-background hover:opacity-90"
                  : plan.highlight
                  ? "bg-saffron text-background hover:bg-saffron/90"
                  : "border border-saffron/50 text-saffron hover:bg-saffron/10"
              }`}
            >
              {loadingPlan === plan.id
                ? "Processing..."
                : isActive
                ? "Current Plan"
                : hadPaidPlan
                ? `Renew ${plan.label}`
                : `Get ${plan.label}`}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Student discount banner */}
      <div className="text-center p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
        <p className="text-sm font-medium text-indigo-400">
          Student? Get 30% off with your college email
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Email us at{" "}
          <a href="mailto:gurusishya.in@gmail.com" className="text-saffron hover:underline">
            gurusishya.in@gmail.com
          </a>{" "}
          with your .edu/.ac.in email for a discount code
        </p>
      </div>

      {/* Money-back guarantee */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>🛡️</span>
        <span className="font-medium text-foreground/80">7-day money-back guarantee</span>
        <span>— no questions asked</span>
      </div>

      {/* Free trial CTA */}
      {!isActive && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal/30 bg-teal/5 px-6 py-8 text-center">
          <p className="font-heading text-lg font-semibold">Not ready to commit?</p>
          {!session ? (
            <>
              <p className="text-sm text-muted-foreground max-w-md">
                Sign in to start your free 7-day trial — no credit card required.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-teal/50 bg-teal/10 px-6 py-2.5 text-sm font-semibold text-teal transition-all hover:bg-teal/20"
              >
                <LogIn className="size-4" />
                Sign in to start your free trial
              </Link>
            </>
          ) : trialUsed ? (
            <>
              <p className="text-sm text-muted-foreground max-w-md">
                You have already used your free trial. Subscribe to continue accessing Pro features.
              </p>
              <span className="rounded-lg border border-border/50 bg-surface px-6 py-2.5 text-sm font-semibold text-muted-foreground cursor-not-allowed opacity-60">
                Trial Already Used
              </span>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground max-w-md">
                Try all Pro features free for 7 days — no credit card required.
              </p>
              <button
                type="button"
                disabled={trialLoading}
                onClick={handleFreeTrial}
                className="rounded-lg border border-teal/50 bg-teal/10 px-6 py-2.5 text-sm font-semibold text-teal transition-all hover:bg-teal/20 disabled:opacity-60"
              >
                {trialLoading ? "Activating trial..." : "Start 7-Day Free Trial"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Feature comparison table */}
      <section>
        <h2 className="font-heading text-xl font-semibold mb-4 text-center">
          Free vs Starter vs Pro
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th scope="col" className="px-3 sm:px-4 py-3 text-left font-medium text-muted-foreground w-full">
                  Feature
                </th>
                <th scope="col" className="px-3 sm:px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Free
                </th>
                <th scope="col" className="px-3 sm:px-4 py-3 text-center font-semibold text-teal whitespace-nowrap">
                  Starter
                </th>
                <th scope="col" className="px-3 sm:px-4 py-3 text-center font-semibold text-saffron whitespace-nowrap">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feat, i) => (
                <tr
                  key={feat.label}
                  className={`border-b border-border/30 last:border-0 ${
                    i % 2 === 0 ? "bg-transparent" : "bg-surface/40"
                  }`}
                >
                  <td className="px-3 sm:px-4 py-3 text-foreground/80">
                    {feat.label === "All topics + quiz banks" && contentStats.topicCount
                      ? `All ${contentStats.topicCount} topics + quiz banks`
                      : feat.label}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {feat.free === true ? (
                      <Check className="mx-auto size-3.5 sm:size-4 text-teal" />
                    ) : typeof feat.free === "string" ? (
                      <span className="text-xs text-muted-foreground font-medium">{feat.free}</span>
                    ) : (
                      <span className="text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {feat.starter === true ? (
                      <Check className="mx-auto size-3.5 sm:size-4 text-teal" />
                    ) : typeof feat.starter === "string" ? (
                      <span className="text-xs text-teal font-medium">{feat.starter}</span>
                    ) : (
                      <span className="text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-3 text-center">
                    {feat.pro === true ? (
                      <Check className="mx-auto size-3.5 sm:size-4 text-saffron" />
                    ) : typeof feat.pro === "string" ? (
                      <span className="text-xs text-saffron font-medium">{feat.pro}</span>
                    ) : (
                      <span className="text-muted-foreground/40">&mdash;</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Competitor comparison table */}
      <section>
        <h2 className="font-heading text-xl font-semibold mb-2 text-center">
          Why Guru Sishya?
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-6">
          More content, better answers, unique features — at a fraction of the cost
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-surface">
                <th scope="col" className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-muted-foreground">
                  Feature
                </th>
                <th scope="col" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-saffron bg-saffron/5">
                  Guru Sishya
                </th>
                <th scope="col" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
                  LeetCode
                </th>
                <th scope="col" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
                  AlgoExpert
                </th>
                <th scope="col" className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-muted-foreground">
                  NeetCode
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-surface/30"}`}
                >
                  <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium">{row.feature}</td>
                  <td className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-center font-semibold bg-saffron/5 ${row.gsHighlight ? "text-saffron" : "text-foreground"}`}>
                    {row.gs}
                  </td>
                  <CompetitorCell value={row.lc} />
                  <CompetitorCell value={row.ae} />
                  <CompetitorCell value={row.nc} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground/50">
          Prices approximate as of March 2026. LeetCode, AlgoExpert, and NeetCode are independent products.
        </p>
      </section>

      {/* Reassurance footer */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-center text-sm text-muted-foreground">
        {[
          { icon: "🔒", text: "Payments secured by Razorpay" },
          { icon: "📱", text: "Works on all devices, offline-ready" },
          { icon: "♾️", text: "Lifetime access to your purchased plan" },
        ].map(({ icon, text }) => (
          <div
            key={text}
            className="flex flex-col items-center gap-2 rounded-xl border border-border/30 bg-surface/40 p-4"
          >
            <span className="text-2xl">{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Device-sync notice */}
      <p className="text-center text-xs text-muted-foreground/60 pb-2">
        Your subscription is tied to this device. Activate your plan on each device you use — sign in with the same account on multiple devices to sync.
      </p>
    </div>
    </PageTransition>
  );
}
