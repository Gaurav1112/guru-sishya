export default function PricingLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="text-center space-y-2">
        <div className="h-8 w-48 bg-muted/40 rounded mx-auto" />
        <div className="h-4 w-72 bg-muted/30 rounded mx-auto" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border/30 bg-surface p-6 h-72" />
        ))}
      </div>
    </div>
  );
}
