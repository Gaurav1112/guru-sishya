"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CATEGORY_PILLS = [
  { label: "System Design Fundamentals", color: "border-saffron/40 bg-saffron/10 text-saffron" },
  { label: "System Design Cases", color: "border-teal/40 bg-teal/10 text-teal" },
  { label: "DS & Algorithms", color: "border-indigo/40 bg-indigo/10 text-indigo" },
  { label: "Core CS & Languages", color: "border-gold/40 bg-gold/10 text-gold" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_8%,transparent),transparent_70%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl"
      >
        <p className="mb-3 text-sm font-medium tracking-[0.3em] text-saffron">
          GURU SISHYA
        </p>
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent">
          Ace Your Software Engineering Interview
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          69 topics, 1,633 quiz questions. System Design, Data Structures,
          Algorithms, and more. 100% free, no signup required.
        </p>

        {/* Category previews */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {CATEGORY_PILLS.map((pill) => (
            <span
              key={pill.label}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${pill.color}`}
            >
              {pill.label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">69</strong> topics
          </span>
          <span className="text-border">•</span>
          <span>
            <strong className="text-foreground">1,633</strong> quiz questions
          </span>
          <span className="text-border">•</span>
          <span>
            <strong className="text-foreground">No API key</strong> needed
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90">
              Start Preparing
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              See Features
            </Button>
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground/70">
          Built with Pareto Principle, Feynman Technique, Bloom&apos;s Taxonomy
          &amp; Spaced Repetition
        </p>
      </motion.div>
    </section>
  );
}
