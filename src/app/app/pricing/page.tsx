"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Crown, Zap } from "lucide-react";
import { useStore } from "@/lib/store";
import { PageTransition } from "@/components/page-transition";

// ── Types ─────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

type PlanType = "monthly" | "semester" | "annual";

// ── Plan data ─────────────────────────────────────────────────────────────────

const PLANS: {
  id: PlanType;
  label: string;
  price: number;
  originalPrice?: number;
  period: string;
  savingsPct?: number;
  highlight: boolean;
  icon: React.ReactNode;
  badge?: string;
}[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: 129,
    period: "per month",
    highlight: false,
    icon: <Zap className="size-5" />,
  },
  {
    id: "semester",
    label: "Semester",
    price: 599,
    originalPrice: 129 * 6,
    period: "for 6 months",
    savingsPct: Math.round((1 - 599 / (129 * 6)) * 100),
    highlight: false,
    icon: <Sparkles className="size-5" />,
    badge: "Save 23%",
  },
  {
    id: "annual",
    label: "Annual",
    price: 999,
    originalPrice: 129 * 12,
    period: "per year",
    savingsPct: Math.round((1 - 999 / (129 * 12)) * 100),
    highlight: true,
    icon: <Crown className="size-5" />,
    badge: "Most Popular · Save 36%",
  },
];

// ── Feature comparison data ───────────────────────────────────────────────────

const FEATURES = [
  { label: "All 54 topics + quiz banks", free: true, pro: true },
  { label: "First 5 interview Q&A answers per topic", free: true, pro: true },
  { label: "First 2 learning sessions per topic", free: true, pro: true },
  { label: "First 3 STAR method answers", free: true, pro: true },
  { label: "Easy & medium quiz difficulty", free: true, pro: true },
  { label: "Up to 50 flashcards", free: true, pro: true },
  { label: "Gamification (XP, streaks, badges)", free: true, pro: true },
  { label: "Full interview Q&A answers (unlimited)", free: false, pro: true },
  { label: "All learning sessions (unlimited)", free: false, pro: true },
  { label: "All STAR method answers", free: false, pro: true },
  { label: "Hard difficulty + timed quiz mode", free: false, pro: true },
  { label: "Full Learning Ladder (levels 2–5)", free: false, pro: true },
  { label: "Feynman Technique sessions", free: false, pro: true },
  { label: "Unlimited flashcards", free: false, pro: true },
];

// ── Razorpay script loader ────────────────────────────────────────────────────

function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Razorpay) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
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

  // Re-check expiry on mount
  useEffect(() => {
    checkPremiumExpiry();
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
    activateFreeTrial();
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
          Unlock Your Full Potential
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything you need to crack software engineering interviews — unlimited access to all
          lessons, answers, and advanced features.
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

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
              plan.highlight
                ? "border-saffron/50 bg-gradient-to-b from-saffron/10 via-gold/5 to-background shadow-lg shadow-saffron/10"
                : "border-border/50 bg-surface"
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                  plan.highlight
                    ? "bg-saffron text-background"
                    : "bg-gold/20 text-gold border border-gold/30"
                }`}
              >
                {plan.badge}
              </div>
            )}

            {/* Icon + label */}
            <div
              className={`flex size-10 items-center justify-center rounded-full mb-4 ${
                plan.highlight
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
                plan.highlight
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
          </div>
        ))}
      </div>

      {/* Free trial CTA */}
      {!isActive && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal/30 bg-teal/5 px-6 py-8 text-center">
          <p className="font-heading text-lg font-semibold">Not ready to commit?</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Try all Pro features free for 5 days — no credit card required.
          </p>
          <button
            type="button"
            disabled={trialLoading}
            onClick={handleFreeTrial}
            className="rounded-lg border border-teal/50 bg-teal/10 px-6 py-2.5 text-sm font-semibold text-teal transition-all hover:bg-teal/20 disabled:opacity-60"
          >
            {trialLoading ? "Activating trial..." : "Start 5-Day Free Trial"}
          </button>
        </div>
      )}

      {/* Feature comparison table */}
      <section>
        <h2 className="font-heading text-xl font-semibold mb-4 text-center">
          Free vs Pro
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-full">
                  Feature
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                  Free
                </th>
                <th className="px-4 py-3 text-center font-semibold text-saffron whitespace-nowrap">
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
                  <td className="px-4 py-3 text-foreground/80">{feat.label}</td>
                  <td className="px-4 py-3 text-center">
                    {feat.free ? (
                      <Check className="mx-auto size-4 text-teal" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {feat.pro ? (
                      <Check className="mx-auto size-4 text-saffron" />
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reassurance footer */}
      <div className="grid gap-4 sm:grid-cols-3 text-center text-sm text-muted-foreground">
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
    </div>
    </PageTransition>
  );
}
