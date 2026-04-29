export default function ChallengeLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted/40 rounded" />
      <div className="h-4 w-72 bg-muted/30 rounded" />
      <div className="h-64 bg-muted/20 rounded-xl border border-border/30" />
    </div>
  );
}
