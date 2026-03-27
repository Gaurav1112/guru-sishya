"use client";

import { useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DrumItem {
  index: number;
  label: string;
  status: "unseen" | "known" | "review";
  bookmarked: boolean;
}

interface DrumPickerProps {
  items: DrumItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

const ITEM_HEIGHT = 48;
const VISIBLE_COUNT = 9;

export function DrumPicker({ items, selectedIndex, onSelect, className }: DrumPickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stats
  const knownCount = useMemo(() => items.filter(i => i.status === "known").length, [items]);
  const reviewCount = useMemo(() => items.filter(i => i.status === "review").length, [items]);

  // Scroll to selected index when it changes externally
  useEffect(() => {
    if (isScrollingRef.current) return;
    const container = scrollRef.current;
    if (!container) return;

    const targetScroll = selectedIndex * ITEM_HEIGHT;
    container.scrollTo({ top: targetScroll, behavior: "smooth" });
  }, [selectedIndex]);

  // Handle scroll — detect which item is centered and select it
  const handleScroll = () => {
    isScrollingRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
      const container = scrollRef.current;
      if (!container) return;

      const newIndex = Math.round(container.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, newIndex));

      if (clamped !== selectedIndex) {
        onSelect(clamped);
      }
    }, 100);
  };

  return (
    <div className={cn("select-none", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <span className="text-xs font-semibold text-saffron">
          Q{selectedIndex + 1} <span className="text-muted-foreground font-normal">of {items.length}</span>
        </span>
        <div className="flex gap-2 text-[10px]">
          <span className="text-teal">{knownCount} ✓</span>
          <span className="text-gold">{reviewCount} ⟳</span>
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-y-auto overscroll-contain"
          style={{
            height: VISIBLE_COUNT * ITEM_HEIGHT,
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {/* Top padding so first item can be centered */}
          <div style={{ height: Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT }} />

          {items.map((item) => {
            const isCurrent = item.index === selectedIndex;
            return (
              <button
                key={item.index}
                onClick={() => {
                  onSelect(item.index);
                  scrollRef.current?.scrollTo({ top: item.index * ITEM_HEIGHT, behavior: "smooth" });
                }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 transition-all duration-150",
                  isCurrent && "bg-saffron/15 text-saffron font-bold text-base",
                  !isCurrent && item.status === "unseen" && "text-muted-foreground hover:bg-muted/30 text-sm",
                  !isCurrent && item.status === "known" && "text-teal hover:bg-teal/10 text-sm",
                  !isCurrent && item.status === "review" && "text-gold hover:bg-gold/10 text-sm",
                  item.bookmarked && !isCurrent && "ring-1 ring-inset ring-indigo/30",
                )}
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: "center",
                }}
              >
                <span className={cn(
                  "inline-flex items-center justify-center rounded-lg",
                  isCurrent ? "size-9 bg-saffron/20 ring-2 ring-saffron" : "size-7",
                )}>
                  {item.index + 1}
                </span>
                {isCurrent && item.status !== "unseen" && (
                  <span className="text-xs opacity-70">
                    {item.status === "known" ? "✓ Known" : "⟳ Review"}
                  </span>
                )}
              </button>
            );
          })}

          {/* Bottom padding so last item can be centered */}
          <div style={{ height: Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT }} />
        </div>

        {/* Center indicator line */}
        <div
          className="pointer-events-none absolute left-2 right-2 border-y border-saffron/20 z-10"
          style={{
            top: Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
        />

        {/* Gradient fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-surface to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface to-transparent z-10" />
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 px-3 py-2 border-t border-border/30">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-teal/30" /> Known
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-gold/30" /> Review
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-indigo/30" /> Saved
        </span>
      </div>
    </div>
  );
}
