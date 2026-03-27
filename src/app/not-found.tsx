import Link from "next/link";

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
