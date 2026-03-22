"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      {/* Radial gradient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--color-saffron)_8%,transparent),transparent_70%)] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
        <p className="mb-3 text-sm font-medium tracking-[0.3em] text-saffron">GURU SISHYA</p>
        <h1 className="font-heading text-4xl font-bold leading-tight md:text-6xl bg-gradient-to-r from-saffron via-gold to-teal bg-clip-text text-transparent">Master Any Subject</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">Learn the critical 20% of any subject in 20 focused hours — not 200</p>
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
          <span className="rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-sm font-medium text-teal">No setup required</span>
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-sm font-medium text-gold">66 topics ready instantly</span>
          <span className="rounded-full border border-saffron/40 bg-saffron/10 px-3 py-1 text-sm font-medium text-saffron">No API key needed</span>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/app/dashboard"><Button size="lg" className="bg-saffron hover:bg-saffron/90">Start Learning — Free</Button></Link>
          <Link href="#features"><Button variant="outline" size="lg">See Features</Button></Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground/70">Built with Pareto Principle, Feynman Technique, Bloom&apos;s Taxonomy &amp; Spaced Repetition</p>
      </motion.div>
    </section>
  );
}
