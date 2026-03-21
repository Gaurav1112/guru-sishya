"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      {/* Subtle decorative circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-saffron/10" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full border border-indigo/10" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10">
        <p className="mb-3 text-sm font-medium tracking-[0.3em] text-saffron">GURU SISHYA</p>
        <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-6xl">Master Any Subject</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">AI-powered learning combining Pareto Principle, Feynman Technique, and spaced repetition. Learn the critical 20% in just 20 focused hours.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/app/dashboard"><Button size="lg" className="bg-saffron hover:bg-saffron/90">Start Learning</Button></Link>
          <Link href="#features"><Button variant="outline" size="lg">See Features</Button></Link>
        </div>
      </motion.div>
    </section>
  );
}
