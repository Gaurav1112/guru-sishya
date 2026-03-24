import Link from "next/link";
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

function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between bg-background/60 px-6 backdrop-blur-md border-b border-border/30">
      <div className="flex items-center gap-6">
        <span className="font-heading text-lg font-bold text-saffron tracking-wider">
          GURU SISHYA
        </span>
        <div className="hidden sm:flex items-center gap-4">
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link href="/app/roadmap">
          <Button variant="ghost" size="sm" className="text-sm">
            Roadmap
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-sm">
            Sign In
          </Button>
        </Link>
        <Link href="/app/topics">
          <Button size="sm" className="bg-saffron hover:bg-saffron/90">
            Start Free
          </Button>
        </Link>
      </div>
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
              <Link href="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
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
