"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRUST_BADGES = [
  "100% free to start",
  "No signup required",
  "Works offline",
];

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 sm:px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_6%,transparent),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Social proof line */}
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-5 text-sm text-muted-foreground tracking-wide"
        >
          Used by engineers who landed offers at{" "}
          <span className="text-foreground font-semibold">Google, Amazon, Meta</span> &amp; more
        </motion.p>

        {/* Headline — instantly visible, no word-by-word stagger */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
          className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-6xl bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent"
        >
          Ace Your Next Tech Interview
        </motion.h1>

        {/* Subheadline — value prop, plain language */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="mx-auto mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Practice <span className="text-foreground font-semibold">DSA, System Design, and Behavioral</span> questions
          in one place. 80 topics. 1,715 questions with answers. Start in 10 seconds.
        </motion.p>

        {/* Single primary CTA + lightweight secondary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200, damping: 18 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[220px] sm:min-w-[280px] text-base font-semibold btn-press">
              Browse Topics &mdash; It&apos;s Free
            </Button>
          </Link>
          <Link href="/app/interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
            or try a mock interview
          </Link>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
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
      </div>
    </section>
  );
}
