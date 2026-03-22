import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Button } from "@/components/ui/button";

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
        <Link href="/app/topics">
          <Button size="sm" className="bg-saffron hover:bg-saffron/90">
            Start Free
          </Button>
        </Link>
      </div>
    </nav>
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
          Join thousands of developers who used Guru Sishya to land their dream job. No signup, no credit card.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/app/topics">
            <Button size="lg" className="bg-saffron hover:bg-saffron/90 min-w-[160px] text-base font-semibold">
              Start Free Today
            </Button>
          </Link>
          <Link href="/app/roadmap">
            <Button variant="outline" size="lg" className="min-w-[160px] text-base">
              View Roadmap
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
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p className="font-heading text-base font-semibold text-saffron mb-1">
          GURU SISHYA
        </p>
        <p>Ace Your Software Engineering Interview &mdash; Free, Always.</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
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
        </div>
      </footer>
    </main>
  );
}
