"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Button } from "@/components/ui/button";

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
            className="sm:hidden ml-1 flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded focus:outline-none"
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
    <main className="min-h-screen">
      <LandingNavbar />
      <Hero />
      <CompanyLogoStrip />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="text-center md:text-left">
              <p className="font-heading text-base font-semibold text-saffron mb-1">
                GURU SISHYA
              </p>
              <p className="text-sm text-muted-foreground">
                Ace Your Software Engineering Interview &mdash; Free, Always.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <Link href="/app/topics" className="hover:text-foreground transition-colors">
                Topics
              </Link>
              <Link href="/app/roadmap" className="hover:text-foreground transition-colors">
                Roadmap
              </Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/#features" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <a
                href="https://github.com/Gaurav1112/guru-sishya"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="mailto:kgauravis016@gmail.com"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/60">
            <p>Made with ❤️ in India</p>
            <p>Payments secured by Razorpay</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
