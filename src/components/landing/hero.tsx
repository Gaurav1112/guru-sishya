"use client";
import { lazy, Suspense, useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { Button } from "@/components/ui/button";

const HeroCanvas = lazy(() =>
  import("./hero-canvas").then((m) => ({ default: m.HeroCanvas }))
);

const TRUST_BADGES = [
  "100% free to start",
  "No signup required",
  "Works offline",
];

const STATS = [
  { value: 80, label: "Topics", suffix: "" },
  { value: 1715, label: "Questions", suffix: "+" },
  { value: 58, label: "STAR Answers", suffix: "" },
  { value: 5, label: "Skill Levels", suffix: "" },
];

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString() + suffix;
      },
    });
    return controls.stop;
  }, [inView, motionVal, value, suffix]);

  return <span ref={ref}>0{suffix}</span>;
}

export function Hero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center px-4 sm:px-6 text-center">
      {/* Three.js particle network — lazy loaded, doesn't block LCP */}
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>

      {/* Radial gradient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_8%,transparent),transparent_70%)]" />

      <div className="relative z-10 max-w-3xl">
        {/* Social proof line */}
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="mb-5 text-sm tracking-wide text-muted-foreground"
        >
          Used by engineers who landed offers at{" "}
          <span className="font-semibold text-foreground">Google, Amazon, Meta</span> &amp; more
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="font-heading text-3xl font-bold leading-tight sm:text-4xl md:text-6xl bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent"
        >
          Ace Your Next Tech Interview
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Practice <span className="font-semibold text-foreground">DSA, System Design, and Behavioral</span> questions
          in one place. 80 topics. 1,715 questions with answers. Start in 10 seconds.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 220, damping: 20 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href="/app/topics">
            <Button
              size="lg"
              className="min-w-[220px] bg-saffron text-base font-semibold hover:bg-saffron/90 sm:min-w-[280px] btn-press"
            >
              Browse Topics — It&apos;s Free
            </Button>
          </a>
          <a
            href="/app/interview"
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            or try a mock interview
          </a>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-4"
        >
          {TRUST_BADGES.map((badge) => (
            <span key={badge} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 flex-shrink-0 text-teal"
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

        {/* Animated stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border/40 bg-surface/60 px-4 py-3 backdrop-blur-sm"
            >
              <div className="font-heading text-2xl font-bold text-saffron">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
