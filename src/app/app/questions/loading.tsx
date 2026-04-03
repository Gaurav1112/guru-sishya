export default function QuestionsLoading() {
  return (
    <div className="space-y-4 pb-8 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-muted/40 rounded" />
          <div className="h-4 w-72 bg-muted/30 rounded" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
          <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
          <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-hidden pb-1">
        {[80, 96, 72, 88, 64, 80].map((w, i) => (
          <div
            key={i}
            className="shrink-0 h-7 bg-muted/30 rounded-lg"
            style={{ width: `${w}px` }}
          />
        ))}
      </div>

      {/* Search + controls bar */}
      <div className="flex items-center gap-2">
        <div className="h-9 flex-1 max-w-sm bg-muted/30 rounded-lg" />
        <div className="h-9 w-20 bg-muted/30 rounded-lg" />
        <div className="h-9 w-20 bg-muted/30 rounded-lg" />
        <div className="h-9 w-20 bg-muted/30 rounded-lg" />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="h-3 w-28 bg-muted/30 rounded" />
          <div className="h-3 w-40 bg-muted/20 rounded" />
        </div>
        <div className="h-1 w-full bg-muted/30 rounded-full" />
      </div>

      {/* Flip card */}
      <div
        className="w-full max-w-2xl mx-auto rounded-2xl border border-border/30 bg-surface p-6 sm:p-8"
        style={{ minHeight: "380px" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-20 bg-muted/30 rounded-full" />
          <div className="h-5 w-14 bg-muted/20 rounded-full" />
        </div>
        <div className="flex items-center py-8">
          <div className="w-full space-y-3">
            <div className="h-6 w-5/6 bg-muted/40 rounded" />
            <div className="h-6 w-4/6 bg-muted/30 rounded" />
          </div>
        </div>
        <div className="pt-3 border-t border-border/20 flex justify-between items-center">
          <div className="h-3 w-28 bg-muted/20 rounded" />
          <div className="h-3 w-16 bg-muted/20 rounded" />
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-4">
        <div className="h-10 w-28 bg-muted/30 rounded-xl" />
        <div className="h-10 w-28 bg-muted/30 rounded-xl" />
      </div>
    </div>
  );
}
