import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Features />
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">Guru Sishya — Master Any Subject</footer>
    </main>
  );
}
