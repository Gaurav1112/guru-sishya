export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-20 bg-muted/40 rounded" />
        <div className="h-6 w-40 bg-muted/40 rounded" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/30 bg-surface p-4">
          <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
          <div className="h-32 bg-muted/10 rounded" />
        </div>
        <div className="rounded-xl border border-border/30 bg-surface p-4">
          <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
          <div className="h-32 bg-muted/10 rounded" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border/30 bg-surface p-4">
          <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
          <div className="h-32 bg-muted/10 rounded" />
        </div>
        <div className="rounded-xl border border-border/30 bg-surface p-4">
          <div className="h-4 w-32 bg-muted/40 rounded mb-3" />
          <div className="h-32 bg-muted/10 rounded" />
        </div>
      </div>
    </div>
  );
}
