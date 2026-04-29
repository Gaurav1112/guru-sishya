export default function ShopLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-32 bg-muted/40 rounded" />
      <div className="h-4 w-64 bg-muted/30 rounded" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-surface p-5 h-40" />
        ))}
      </div>
    </div>
  );
}
