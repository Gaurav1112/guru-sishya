"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { SocialProof } from "@/components/landing/social-proof";
import { FAQ } from "@/components/landing/faq";
import { EmailCapture } from "@/components/landing/email-capture";
import { ExitIntent } from "@/components/landing/exit-intent";
import { Button } from "@/components/ui/button";
// Content stats are hardcoded on landing page to avoid loading 11MB of JSON

export interface ContentStats {
  topicCount: number;
  questionCount: number;
  sessionCount: number;
}

// ── ScrollReveal — fade-in + slide-up when section enters viewport ─────────────

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

const COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Meta",
  "Apple",
  "Netflix",
  "Flipkart",
  "Razorpay",
  "Uber",
  "Goldman Sachs",
];

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "/contact" },
];

function LandingNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo-mark.png" alt="Guru Sishya" width={32} height={32} className="size-8 rounded-lg" />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/roadmap" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-sm">
              Roadmap
            </Button>
          </Link>
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm" className="text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/app/topics">
            <Button size="sm" className="bg-saffron hover:bg-saffron/90">
              Start Free
            </Button>
          </Link>
          {/* Hamburger — mobile only */}
          <button
            className="sm:hidden ml-1 flex flex-col justify-center items-center w-12 h-12 p-2 gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={`block h-0.5 w-5 bg-foreground transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-0.5 w-5 bg-foreground transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-nav-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="sm:hidden border-t border-border/30 bg-background/95 backdrop-blur-md px-6 pb-4 pt-3 flex flex-col gap-3"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2.5"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-border/30">
              <Link href="/app/roadmap" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  Roadmap
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button variant="ghost" size="sm" className="w-full text-sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function CompanyLogoStrip() {
  return (
    <section className="border-y border-border/30 bg-surface/30 py-6 px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-4">
          Prepare for interviews at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {COMPANIES.map((company) => (
            <span
              key={company}
              className="rounded-full border border-border/50 bg-surface px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-saffron/40 hover:text-foreground transition-colors"
            >
              {company}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainPoints() {
  const PAINS = [
    {
      problem: "Overwhelmed by 2,800+ LeetCode problems",
      solution: "Our Pareto-based plans focus on the 20% of problems that cover 80% of interviews",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      solutionIcon: (
        <svg aria-hidden="true" className="h-6 w-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      problem: "No structure -- jumping between YouTube, blogs, and courses",
      solution: "One platform with 80 topics, 775 lessons, and a visual roadmap from zero to offer",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      solutionIcon: (
        <svg aria-hidden="true" className="h-6 w-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      problem: "Behavioral rounds are a black box -- 40% of candidates fail here",
      solution: "58 pre-written STAR answers for Google, Amazon, Meta, and more -- ready to customize",
      icon: (
        <svg aria-hidden="true" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      solutionIcon: (
        <svg aria-hidden="true" className="h-6 w-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <h2 className="font-heading text-3xl font-bold text-center mb-3">
          Sound Familiar?
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Most engineers waste weeks on unfocused prep. Here is how Guru Sishya fixes that.
        </p>
        <div className="space-y-6">
          {PAINS.map((pain, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                {pain.icon}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-1">The Problem</p>
                  <p className="text-sm text-foreground/90">{pain.problem}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-teal/20 bg-teal/5 p-5">
                {pain.solutionIcon}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal mb-1">Our Solution</p>
                  <p className="text-sm text-foreground/90">{pain.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ stats }: { stats: ContentStats }) {
  return (
    <section className="px-6 py-20 text-center">
      <div className="mx-auto max-w-2xl rounded-2xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-surface to-teal/5 p-12">
        <h2 className="font-heading text-3xl font-bold mb-3">
          Your Next Interview Is Closer Than You Think
        </h2>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          {stats.topicCount} topics, {stats.questionCount.toLocaleString()} questions, 58 STAR behavioral answers — all free. No signup, no credit card.
        </p>
        <p className="text-sm text-foreground/80 font-medium mb-8 max-w-md mx-auto">
          Every day you wait is a day someone else is preparing. Start now and be interview-ready in 12 weeks.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[200px] text-base font-semibold">
              Start Practicing Free Now
            </Button>
          </Link>
          <Link href="/app/pricing">
            <Button variant="outline" size="lg" className="min-w-[200px] text-base">
              Try Pro Free for 7 Days
            </Button>
          </Link>
        </div>
        <p className="mt-5 text-xs text-muted-foreground/60">
          No credit card required &bull; No API key needed &bull; Works offline
        </p>
      </div>
    </section>
  );
}

export default function LandingPage() {
  // Static stats — avoids loading 11MB of content JSON on the landing page
  // Update these when content changes significantly
  const stats: ContentStats = { topicCount: 80, questionCount: 1715, sessionCount: 775 };

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:rounded-lg focus:bg-saffron focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-background">
        Skip to main content
      </a>
      <header>
        <LandingNavbar />
      </header>
      <main id="main-content">
      <Hero />
      <ScrollReveal delay={0}>
        <CompanyLogoStrip />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <PainPoints />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Features />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <SocialProof />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Pricing stats={stats} />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <FAQ />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <FinalCTA stats={stats} />
      </ScrollReveal>
      </main>
      <ExitIntent />
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          {/* Footer grid with organized link sections */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Image src="/logo-mark.png" alt="Guru Sishya" width={24} height={24} className="size-6 rounded" loading="lazy" />
                <span className="font-heading text-base font-semibold text-saffron">GURU SISHYA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Free software engineering interview preparation platform. {stats.topicCount} topics, {stats.questionCount.toLocaleString()} questions, works offline.
              </p>
            </div>

            {/* Prepare */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Prepare</h3>
              <nav aria-label="Preparation links" className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/app/topics" className="hover:text-foreground transition-colors">
                  Browse Topics
                </Link>
                <Link href="/app/questions" className="hover:text-foreground transition-colors">
                  Interview Questions
                </Link>
                <Link href="/app/interview" className="hover:text-foreground transition-colors">
                  Mock Interview
                </Link>
                <Link href="/app/playground" className="hover:text-foreground transition-colors">
                  Code Playground
                </Link>
                <Link href="/app/review" className="hover:text-foreground transition-colors">
                  Flashcard Review
                </Link>
              </nav>
            </div>

            {/* Interview Guides */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Interview Guides</h3>
              <nav aria-label="Interview guide links" className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/dsa-interview-questions" className="hover:text-foreground transition-colors">
                  DSA Interview
                </Link>
                <Link href="/system-design-interview" className="hover:text-foreground transition-colors">
                  System Design
                </Link>
                <Link href="/behavioral-interview" className="hover:text-foreground transition-colors">
                  Behavioral Interview
                </Link>
                <Link href="/cloud-devops-interview" className="hover:text-foreground transition-colors">
                  Cloud & DevOps
                </Link>
                <Link href="/database-interview" className="hover:text-foreground transition-colors">
                  Database Interview
                </Link>
                <Link href="/backend-interview" className="hover:text-foreground transition-colors">
                  Backend Interview
                </Link>
              </nav>
            </div>

            {/* Learn */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Learn</h3>
              <nav aria-label="Learning links" className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/app/roadmap" className="hover:text-foreground transition-colors">
                  Learning Roadmap
                </Link>
                <Link href="/app/dashboard" className="hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/app/leaderboard" className="hover:text-foreground transition-colors">
                  Leaderboard
                </Link>
                <Link href="/app/pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
                <Link href="/leetcode-alternative" className="hover:text-foreground transition-colors">
                  Why Guru Sishya
                </Link>
                <Link href="/top-coding-questions" className="hover:text-foreground transition-colors">
                  Top Coding Questions
                </Link>
              </nav>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
              <nav aria-label="Company links" className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link href="/#features" className="hover:text-foreground transition-colors">
                  About
                </Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <a
                  href="https://github.com/Gaurav1112/guru-sishya"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact & Support
                </Link>
              </nav>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
            <p suppressHydrationWarning>&copy; {new Date().getFullYear()} Guru Sishya. Made in India.</p>
            <p>Payments secured by Razorpay</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
