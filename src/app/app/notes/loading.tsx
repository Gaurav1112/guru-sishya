export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted/40 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-surface p-4">
            <div className="h-4 w-24 bg-muted/40 rounded mb-3" />
            <div className="h-16 w-full bg-muted/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
