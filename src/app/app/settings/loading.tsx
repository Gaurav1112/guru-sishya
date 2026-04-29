export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-40 bg-muted/40 rounded" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-surface p-5">
            <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
            <div className="h-10 w-full bg-muted/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
