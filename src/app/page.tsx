import Link from "next/link";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Button } from "@/components/ui/button";

function LandingNavbar() {
  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between bg-background/60 px-6 backdrop-blur-md border-b border-border/30">
      <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
      <Link href="/app/topics">
        <Button size="sm" className="bg-saffron hover:bg-saffron/90">Start Preparing</Button>
      </Link>
    </nav>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingNavbar />
      <Hero />
      <Features />
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        Guru Sishya — Ace Your Software Engineering Interview
      </footer>
    </main>
  );
}
