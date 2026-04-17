"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmailCapture } from "./email-capture";

const TRUST_BADGES = [
  "No credit card required",
  "No API key needed",
  "Works offline",
];

// ── Staggered headline words ──────────────────────────────────────────────────

function StaggeredHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-6xl text-saffron bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent">
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-4 sm:px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_6%,transparent),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Social proof line */}
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-5 text-sm text-muted-foreground tracking-wide"
        >
          Join <span className="text-foreground font-semibold">1,000+</span> engineers preparing for{" "}
          <span className="text-foreground font-semibold">Google, Amazon, Meta</span> &amp; more
        </motion.p>

        {/* Headline — outcome-driven, word-by-word stagger */}
        <StaggeredHeadline text="From Zero to FAANG Offer in 12 Weeks" />

        {/* Subheadline — value prop */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          The only platform with{" "}
          <span className="text-foreground font-semibold">DSA + System Design + Behavioral</span> prep.{" "}
          Java &amp; Python code. 141 topics. Free to start.
        </motion.p>

        {/* Primary CTAs — action-oriented */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5, type: "spring", stiffness: 200, damping: 18 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/app/interview">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[220px] sm:min-w-[260px] text-base font-semibold btn-press">
              Start Your First Mock Interview
            </Button>
          </Link>
          <Link href="/app/topics">
            <Button variant="outline" size="lg" className="min-w-[180px] text-base btn-outline-glow">
              Browse 141 Topics
            </Button>
          </Link>
        </motion.div>

        {/* Email capture — moved higher, visible without scrolling */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-6 flex flex-col items-center gap-1.5"
        >
          <p className="text-xs text-muted-foreground/70 mb-1">
            Get our free DSA Cheatsheet PDF &mdash; no signup needed
          </p>
          <EmailCapture />
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-3"
        >
          {TRUST_BADGES.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <svg
                aria-hidden="true"
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="mt-5 text-xs text-muted-foreground/60"
        >
          Powered by Pareto Principle &bull; Guru Mode &bull; Bloom&apos;s Taxonomy &bull; Spaced Repetition
        </motion.p>
      </div>
    </section>
  );
}
