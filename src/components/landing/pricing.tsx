"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ContentStats } from "@/app/page";

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

function getFreeFeatures(stats: ContentStats): PlanFeature[] {
  return [
    { text: `${stats.topicCount} topics with full lessons` },
    { text: `${stats.questionCount.toLocaleString()} quiz questions with answers` },
    { text: `${stats.sessionCount} complete sessions` },
    { text: "Progress tracking & gamification" },
    { text: "Learning ladder (5 levels per topic)" },
    { text: "Visual cheat sheets" },
    { text: "Curated resource library" },
    { text: "Works offline — no setup" },
  ];
}

const STARTER_FEATURES: PlanFeature[] = [
  { text: "Everything in Free" },
  { text: "Unlimited quizzes (Easy + Medium)", highlight: true },
  { text: "10 Study Buddy AI messages/day", highlight: true },
  { text: "3 sessions per topic", highlight: true },
  { text: "Cheatsheet view (no export)" },
];

const PRO_MONTHLY_FEATURES: PlanFeature[] = [
  { text: "Everything in Starter" },
  { text: "AI-powered Teach Mode", highlight: true },
  { text: "Hard difficulty + timed quiz", highlight: true },
  { text: "Mock interview + Java playground", highlight: true },
  { text: "Certificates + cheatsheet export", highlight: true },
];

const PRO_SEMESTER_FEATURES: PlanFeature[] = [
  { text: "Everything in Pro Monthly" },
  { text: "Save 22% vs monthly", highlight: true },
  { text: "6 months of DSA + System Design prep", highlight: true },
  { text: "Priority support", highlight: true },
  { text: "Shareable LinkedIn certificate", highlight: true },
];

const PRO_ANNUAL_FEATURES: PlanFeature[] = [
  { text: "Everything in Pro Monthly" },
  { text: "Save ₹589 vs monthly", highlight: true },
  { text: "Full FAANG interview prep access", highlight: true },
  { text: "Early access to new coding topics", highlight: true },
  { text: "Priority support", highlight: true },
];

const PRO_LIFETIME_FEATURES: PlanFeature[] = [
  { text: "Everything in Pro Annual" },
  { text: "Pay once, access forever", highlight: true },
  { text: "All future DSA & System Design topics", highlight: true },
  { text: "Priority support — forever", highlight: true },
  { text: "Lifetime interview prep access", highlight: true },
];

function CheckIcon({ highlight }: { highlight?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`h-4 w-4 flex-shrink-0 ${highlight ? "text-saffron" : "text-teal"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Pricing({ stats }: { stats: ContentStats }) {
  const FREE_FEATURES = useMemo(() => getFreeFeatures(stats), [stats]);

  return (
    <section id="pricing" className="px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl font-bold mb-3">
          Simple, Honest Pricing
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Start free — no card required. Upgrade for AI-powered features when you&apos;re ready.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3 lg:grid-cols-6">
        {/* Free plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-border/60 bg-surface p-7 flex flex-col"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Free Forever
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold">₹0</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">No credit card needed</p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon />
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <Link href="/app/topics">
            <Button variant="outline" className="w-full" size="lg">
              Get Started Free
            </Button>
          </Link>
        </motion.div>

        {/* Starter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-teal/50 bg-gradient-to-br from-teal/10 via-surface to-surface p-7 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <span className="rounded-full bg-teal/20 border border-teal/40 px-3 py-1 text-xs font-bold text-teal">
              New
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-teal uppercase mb-2">
              Starter
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-teal">₹49</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Less than a samosa a day
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {STARTER_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon highlight={f.highlight} />
                <span className={f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/pricing">
            <Button className="w-full bg-teal hover:bg-teal/90 text-background" size="lg">
              Get Starter
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Cancel anytime
          </p>
        </motion.div>

        {/* Pro Monthly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-saffron/50 bg-gradient-to-br from-saffron/10 via-surface to-surface p-7 flex flex-col relative overflow-hidden"
        >
          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-saffron uppercase mb-2">
              Pro Monthly
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-saffron">₹149</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Less than a cup of coffee a week
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_MONTHLY_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon highlight={f.highlight} />
                <span className={f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/pricing">
            <Button className="w-full bg-saffron hover:bg-saffron/90" size="lg">
              Get Started
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Cancel anytime
          </p>
        </motion.div>

        {/* Pro Semester */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-saffron/60 bg-gradient-to-br from-saffron/15 via-surface to-surface p-7 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <span className="rounded-full bg-saffron px-3 py-1 text-xs font-bold text-white">
              Most Popular
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-saffron uppercase mb-2">
              Pro Semester
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-saffron">₹699</span>
              <span className="text-muted-foreground mb-1">/6 mo</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹117/month &mdash; save 22% vs monthly
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_SEMESTER_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon highlight={f.highlight} />
                <span className={f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/pricing">
            <Button
              className="w-full bg-saffron hover:bg-saffron/90"
              size="lg"
            >
              Get Started
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Billed once for 6 months
          </p>
        </motion.div>

        {/* Pro Annual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-gold/8 via-surface to-surface p-7 flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <span className="rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-xs font-bold text-gold">
              Save 33%
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-gold uppercase mb-2">
              Pro Annual
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-gold">₹1,199</span>
              <span className="text-muted-foreground mb-1">/year</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹100/month &mdash; save ₹589 vs monthly
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_ANNUAL_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon highlight={f.highlight} />
                <span className={f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/pricing">
            <Button
              variant="outline"
              className="w-full border-gold/50 text-gold hover:bg-gold/10 hover:text-gold"
              size="lg"
            >
              Get Started
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Billed once annually
          </p>
        </motion.div>

        {/* Pro Lifetime */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-gold/60 bg-gradient-to-br from-gold/15 via-surface to-surface p-7 flex flex-col relative overflow-hidden ring-1 ring-gold/30"
        >
          <div className="absolute top-4 right-4">
            <motion.span
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block rounded-full bg-gradient-to-r from-gold to-saffron px-3 py-1 text-xs font-bold text-white"
            >
              Best Value
            </motion.span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-gold uppercase mb-2">
              Pro Lifetime
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-gold">₹2,999</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              One-time payment — yours forever
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_LIFETIME_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon highlight={f.highlight} />
                <span className={f.highlight ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Link href="/app/pricing">
            <Button
              className="w-full bg-gradient-to-r from-gold to-saffron text-background hover:opacity-90"
              size="lg"
            >
              Get Lifetime Access
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Pay once, never pay again
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        viewport={{ once: true }}
        className="mt-6 text-center space-y-1"
      >
        <p className="text-sm text-muted-foreground">
          Not ready to commit?{" "}
          <Link href="/app/pricing" className="text-teal hover:underline font-medium">
            Start a 7-day free trial
          </Link>{" "}
          &mdash; no credit card required.
        </p>
        <p className="text-xs text-muted-foreground/60">
          Payments secured by Razorpay &bull; 7-day money-back guarantee on Pro plans
        </p>
      </motion.div>
    </section>
  );
}
