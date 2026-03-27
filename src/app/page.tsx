"use client";

import Link from "next/link";
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
    <nav className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading text-lg font-bold text-saffron tracking-wider hover:opacity-80 transition-opacity">
            GURU SISHYA
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
            className="sm:hidden ml-1 flex flex-col justify-center items-center w-12 h-12 p-2 gap-1.5 rounded focus:outline-none"
            aria-label="Toggle menu"
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
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
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

function FinalCTA() {
  return (
    <section className="px-6 py-20 text-center">
      <div className="mx-auto max-w-2xl rounded-2xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-surface to-teal/5 p-12">
        <h2 className="font-heading text-3xl font-bold mb-3">
          Ready to Crack Your Interview?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          56 topics, 710+ questions, 58 STAR behavioral answers — all free. No signup, no credit card.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[160px] text-base font-semibold">
              Start Free Today
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="min-w-[160px] text-base">
              Sign In
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
  return (
    <div className="min-h-screen">
      <header>
        <LandingNavbar />
      </header>
      <main>
      <Hero />
      <ScrollReveal delay={0}>
        <CompanyLogoStrip />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Features />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <SocialProof />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Testimonials />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <Pricing />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <FAQ />
      </ScrollReveal>
      <ScrollReveal delay={0}>
        <FinalCTA />
      </ScrollReveal>
      </main>
      <ExitIntent />
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="mx-auto max-w-5xl">
          {/* Footer grid with organized link sections */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="font-heading text-base font-semibold text-saffron mb-2">
                GURU SISHYA
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Free software engineering interview preparation platform. 56 topics, 710+ questions, works offline.
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
            <p>&copy; {new Date().getFullYear()} Guru Sishya. Made in India.</p>
            <p>Payments secured by Razorpay</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
