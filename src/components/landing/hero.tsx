"use client";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const TRUST_BADGES = [
  "No credit card required",
  "No API key needed",
  "Works offline",
];

const STATS = [
  { value: 53, display: "53", label: "Topics", color: "text-saffron" },
  { value: 1290, display: "1290+", label: "Questions", color: "text-teal" },
  { value: 315, display: "315", label: "Lessons", color: "text-gold" },
  { value: 6, display: "6", label: "FAANG Companies", color: "text-indigo", suffix: "" },
];

const FAANG_COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Netflix",
];

// ── Animated counter ──────────────────────────────────────────────────────────

function AnimatedCounter({
  target,
  display,
  suffix,
  color,
  label,
  delay,
}: {
  target: number;
  display: string;
  suffix?: string;
  color: string;
  label: string;
  delay: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1200;
    const steps = 40;
    const stepDuration = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (step >= steps) clearInterval(timer);
    }, stepDuration);

    return () => clearInterval(timer);
  }, [inView, target]);

  // For "100%" we show the % sign; for "710+" we show the + sign
  const hasPlus = display.endsWith("+");
  const hasPct = display.endsWith("%");

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="rounded-xl border border-border/50 bg-surface/60 px-3 py-3"
    >
      <div className={`font-heading text-xl font-bold tabular-nums ${color}`}>
        {inView ? count : 0}
        {hasPlus && "+"}
        {hasPct && "%"}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </motion.div>
  );
}

// ── Staggered headline words ──────────────────────────────────────────────────

function StaggeredHeadline({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-6xl text-saffron bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_6%,transparent),transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
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

        {/* Headline — word-by-word stagger */}
        <StaggeredHeadline text="Crack Your Software Engineering Interview With Confidence" />

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground leading-relaxed"
        >
          <span className="text-foreground font-semibold">53 topics</span>,{" "}
          <span className="text-foreground font-semibold">1290+ curated questions</span>,{" "}
          <span className="text-foreground font-semibold">STAR behavioral prep</span> for Google, Amazon, Microsoft, Meta &mdash; trusted by engineers
        </motion.p>

        {/* Stats grid — counter animation */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
          {STATS.map((stat, i) => (
            <AnimatedCounter
              key={stat.label}
              target={stat.value}
              display={stat.display}
              suffix={stat.suffix}
              color={stat.color}
              label={stat.label}
              delay={0.8 + i * 0.07}
            />
          ))}
        </div>

        {/* Primary CTAs — bounce on mount */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.5, type: "spring", stiffness: 200, damping: 18 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[140px] text-base font-semibold btn-press">
              Get Started
            </Button>
          </Link>
          <Link href="/app/roadmap">
            <Button variant="outline" size="lg" className="min-w-[140px] text-base btn-outline-glow">
              View Roadmap
            </Button>
          </Link>
        </motion.div>

        {/* FAANG company badges — staggered slide from bottom */}
        <motion.div
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07, delayChildren: 1.2 } } }}
        >
          <motion.span
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="text-xs text-muted-foreground/70 mr-1"
          >
            Prepare for:
          </motion.span>
          {FAANG_COMPANIES.map((company) => (
            <motion.span
              key={company}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
              }}
              className="rounded-full border border-border/50 bg-surface/80 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-saffron/40 hover:text-foreground transition-colors"
            >
              {company}
            </motion.span>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.5 }}
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
          transition={{ delay: 1.8, duration: 0.5 }}
          className="mt-5 text-xs text-muted-foreground/60"
        >
          Powered by Pareto Principle &bull; Feynman Technique &bull; Bloom&apos;s Taxonomy &bull; Spaced Repetition
        </motion.p>
      </div>
    </section>
  );
}
