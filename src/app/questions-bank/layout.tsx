import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | Guru Sishya Questions Bank",
    default:
      "Software Engineering Interview Questions Bank | Guru Sishya",
  },
  description:
    "200+ curated software engineering interview questions on system design, data structures, algorithms, and core CS.",
};

// ── Simple public navbar (server component, no interactivity) ────────────────

function QuestionsNavbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30"
    >
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="Guru Sishya"
              className="size-8 rounded-lg"
              width={32}
              height={32}
            />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">
              GURU SISHYA
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/learn"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Topics
            </Link>
            <Link
              href="/questions-bank"
              className="text-sm text-foreground font-medium"
            >
              Questions
            </Link>
            <Link
              href="/#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/app/topics"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-saffron hover:bg-saffron/90 text-white transition-colors"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── Footer ──────────────────────────────────────────────────────────────────

function QuestionsFooter() {
  return (
    <footer className="border-t border-border/30 bg-background/50 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="Guru Sishya"
              className="size-6 rounded"
              width={24}
              height={24}
            />
            <span className="text-sm text-muted-foreground">
              Guru Sishya &mdash; Free Interview Prep for Engineers
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Layout ──────────────────────────────────────────────────────────────────

export default function QuestionsBankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <QuestionsNavbar />
      <main className="flex-1">{children}</main>
      <QuestionsFooter />
    </div>
  );
}
