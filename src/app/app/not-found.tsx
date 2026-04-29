import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <span className="text-5xl" role="img" aria-label="Not found">
        🔍
      </span>
      <h2 className="font-heading text-xl font-semibold">Page Not Found</h2>
      <p className="text-sm text-muted-foreground max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          href="/app/dashboard"
          className="rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background hover:bg-saffron/90 transition-colors"
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
