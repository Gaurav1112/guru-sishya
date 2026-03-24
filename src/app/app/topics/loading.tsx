export default function TopicsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page heading skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-40 bg-muted/40 rounded" />
        <div className="h-4 w-64 bg-muted/30 rounded" />
      </div>

      {/* Search + filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-9 flex-1 max-w-sm bg-muted/30 rounded-lg" />
        <div className="h-9 w-24 bg-muted/30 rounded-lg" />
      </div>

      {/* Tab strip skeleton */}
      <div className="flex gap-2 border-b border-border/30 pb-2">
        {[72, 96, 88, 80].map((w, i) => (
          <div
            key={i}
            className="h-8 bg-muted/30 rounded-lg"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Topic card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/30 bg-surface p-5 flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="h-4 w-3/4 bg-muted/40 rounded" />
              <div className="h-5 w-16 bg-muted/30 rounded-full" />
            </div>
            <div className="h-3 w-full bg-muted/30 rounded" />
            <div className="h-3 w-2/3 bg-muted/20 rounded" />
            <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border/20">
              <div className="h-3 w-20 bg-muted/20 rounded" />
              <div className="ml-auto h-7 w-20 bg-muted/30 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
