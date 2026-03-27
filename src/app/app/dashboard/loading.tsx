export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="h-4 w-72 bg-muted/60 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="h-40 bg-muted/40 rounded-xl" />
        <div className="h-40 bg-muted/40 rounded-xl" />
        <div className="h-40 bg-muted/40 rounded-xl" />
        <div className="h-40 bg-muted/40 rounded-xl" />
      </div>
    </div>
  );
}
