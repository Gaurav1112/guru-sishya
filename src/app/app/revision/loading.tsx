export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-36 bg-muted/40 rounded" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-surface p-4">
            <div className="h-4 w-3/4 bg-muted/40 rounded mb-2" />
            <div className="h-3 w-1/2 bg-muted/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
