"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRUST_BADGES = [
  "No credit card required",
  "No API key needed",
  "Works offline",
];

const STATS = [
  { value: "56", label: "Topics", color: "text-saffron" },
  { value: "710+", label: "Questions", color: "text-teal" },
  { value: "591", label: "Lessons", color: "text-gold" },
  { value: "100%", label: "Free", color: "text-indigo" },
];

const FAANG_COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Netflix",
];

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_6%,transparent),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl"
      >
        {/* Social proof pill */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-saffron/30 bg-saffron/10 px-4 py-1.5"
        >
          <span className="h-2 w-2 rounded-full bg-saffron animate-pulse" />
          <span className="text-xs font-semibold text-saffron tracking-wide">
            Built for FAANG interview prep
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent">
          Crack Your Software Engineering Interview
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground leading-relaxed">
          <span className="text-foreground font-semibold">56 topics</span>,{" "}
          <span className="text-foreground font-semibold">710+ curated questions</span>,{" "}
          <span className="text-foreground font-semibold">STAR behavioral prep</span> for Google, Amazon, Microsoft, Meta &mdash; all free
        </p>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mt-6 grid grid-cols-4 gap-3 max-w-lg mx-auto"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/50 bg-surface/60 px-3 py-3"
            >
              <div className={`font-heading text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Primary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[140px] text-base font-semibold">
              Start Free
            </Button>
          </Link>
          <Link href="/app/roadmap">
            <Button variant="outline" size="lg" className="min-w-[140px] text-base">
              View Roadmap
            </Button>
          </Link>
        </motion.div>

        {/* FAANG company badges */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-muted-foreground/70 mr-1">Prepare for:</span>
          {FAANG_COMPANIES.map((company, i) => (
            <span
              key={company}
              className="rounded-full border border-border/50 bg-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-saffron/40 hover:text-foreground transition-colors"
            >
              {company}
            </span>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-3"
        >
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <svg
                className="h-3.5 w-3.5 text-teal flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {badge}
            </span>
          ))}
        </motion.div>

        {/* Technique tags */}
        <p className="mt-5 text-xs text-muted-foreground/60">
          Powered by Pareto Principle &bull; Feynman Technique &bull; Bloom&apos;s Taxonomy &bull; Spaced Repetition
        </p>
      </motion.div>
    </section>
  );
}
