"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PlanFeature {
  text: string;
  pro?: boolean;
}

const FREE_FEATURES: PlanFeature[] = [
  { text: "54 topics with full lessons" },
  { text: "1,301 quiz questions" },
  { text: "Code playground — no setup" },
  { text: "Progress tracking & gamification" },
  { text: "Learning ladder (5 levels per topic)" },
  { text: "Visual cheat sheets" },
  { text: "Curated resource library" },
];

const PRO_FEATURES: PlanFeature[] = [
  { text: "Everything in Free", pro: false },
  { text: "AI-powered Feynman Technique", pro: true },
  { text: "Custom topic generation", pro: true },
  { text: "Priority support", pro: true },
  { text: "Certificate of completion", pro: true },
];

function CheckIcon({ pro }: { pro?: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 ${pro ? "text-saffron" : "text-teal"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function Pricing() {
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

      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
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
              Start Free
            </Button>
          </Link>
        </motion.div>

        {/* Pro plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          viewport={{ once: true }}
          className="rounded-2xl border-2 border-saffron/50 bg-gradient-to-br from-saffron/10 via-surface to-surface p-7 flex flex-col relative overflow-hidden"
        >
          {/* Most popular badge */}
          <div className="absolute top-4 right-4">
            <span className="rounded-full bg-saffron px-3 py-1 text-xs font-bold text-white">
              Coming Soon
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs font-semibold tracking-widest text-saffron uppercase mb-2">
              Pro
            </p>
            <div className="flex items-end gap-1">
              <span className="font-heading text-4xl font-bold text-saffron">₹129</span>
              <span className="text-muted-foreground mb-1">/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Less than a cup of coffee a week
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-start gap-2.5 text-sm">
                <CheckIcon pro={f.pro} />
                <span className={f.pro ? "text-foreground font-medium" : "text-muted-foreground"}>
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Button
            disabled
            className="w-full bg-saffron hover:bg-saffron/90 opacity-70 cursor-not-allowed"
            size="lg"
          >
            Notify Me at Launch
          </Button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            No payment needed now
          </p>
        </motion.div>
      </div>
    </section>
  );
}
