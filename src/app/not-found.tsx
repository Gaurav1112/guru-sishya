import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist. Browse 138 interview preparation topics or return to your dashboard.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <span className="text-6xl mb-4" role="img" aria-label="Page not found">🔍</span>
      <h1 className="font-heading text-4xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/app/dashboard"
          className="rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/app/topics"
          className="rounded-lg border border-border/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Browse Topics
        </Link>
      </div>
    </div>
  );
}
