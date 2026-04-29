export default function AdminLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted/40 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted/30 rounded-xl border border-border/30" />
        ))}
      </div>
      <div className="h-64 bg-muted/20 rounded-xl border border-border/30" />
    </div>
  );
}
