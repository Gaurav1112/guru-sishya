"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-heading text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-background"
      >
        Try Again
      </button>
    </div>
  );
}
