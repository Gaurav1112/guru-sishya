"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
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

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 7;
const HALF = Math.floor(VISIBLE_COUNT / 2);

const STATUS_COLORS = {
  unseen: { bg: "bg-muted/30", text: "text-muted-foreground" },
  known: { bg: "bg-teal/15", text: "text-teal" },
  review: { bg: "bg-gold/15", text: "text-gold" },
};

export function DrumPicker({ items, selectedIndex, onSelect, className }: DrumPickerProps) {
  const scrollY = useMotionValue(-selectedIndex * ITEM_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalIndex, setInternalIndex] = useState(selectedIndex);

  // Sync external selectedIndex
  useEffect(() => {
    animate(scrollY, -selectedIndex * ITEM_HEIGHT, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
    setInternalIndex(selectedIndex);
  }, [selectedIndex, scrollY]);

  // Get the currently "snapped" index from a y value
  const getSnappedIndex = useCallback((y: number) => {
    const idx = Math.round(-y / ITEM_HEIGHT);
    return Math.max(0, Math.min(items.length - 1, idx));
  }, [items.length]);

  // Handle drag (pan)
  const handlePan = useCallback((_: PointerEvent, info: PanInfo) => {
    const current = scrollY.get();
    scrollY.set(current + info.delta.y);
  }, [scrollY]);

  const handlePanEnd = useCallback((_: PointerEvent, info: PanInfo) => {
    const current = scrollY.get();
    const velocity = info.velocity.y;

    // Project where the scroll will land given velocity
    const projected = current + velocity * 0.3;
    const targetIndex = getSnappedIndex(projected);
    const targetY = -targetIndex * ITEM_HEIGHT;

    animate(scrollY, targetY, {
      type: "spring",
      stiffness: 400,
      damping: 35,
      velocity: velocity,
      onComplete: () => {
        setInternalIndex(targetIndex);
        onSelect(targetIndex);
      },
    });
  }, [scrollY, getSnappedIndex, onSelect]);

  // Handle wheel scroll
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const current = scrollY.get();
    const delta = e.deltaY > 0 ? -ITEM_HEIGHT : ITEM_HEIGHT;
    const newY = current + delta;
    const targetIndex = getSnappedIndex(newY);

    animate(scrollY, -targetIndex * ITEM_HEIGHT, {
      type: "spring",
      stiffness: 400,
      damping: 35,
      onComplete: () => {
        setInternalIndex(targetIndex);
        onSelect(targetIndex);
      },
    });
  }, [scrollY, getSnappedIndex, onSelect]);

  // Click to select
  const handleItemClick = useCallback((index: number) => {
    animate(scrollY, -index * ITEM_HEIGHT, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      onComplete: () => {
        setInternalIndex(index);
        onSelect(index);
      },
    });
  }, [scrollY, onSelect]);

  // Render visible items around the current position
  const visibleItems = [];
  const startIdx = Math.max(0, internalIndex - HALF - 2);
  const endIdx = Math.min(items.length - 1, internalIndex + HALF + 2);

  for (let i = startIdx; i <= endIdx; i++) {
    const item = items[i];
    const offset = i - internalIndex;
    const absOffset = Math.abs(offset);

    // 3D transforms based on distance from center
    const rotateX = offset * -18; // degrees — curves items away
    const scale = absOffset === 0 ? 1.0 : absOffset === 1 ? 0.88 : absOffset === 2 ? 0.75 : 0.6;
    const opacity = absOffset === 0 ? 1.0 : absOffset === 1 ? 0.7 : absOffset === 2 ? 0.4 : 0.2;
    const isCurrent = i === internalIndex;
    const colors = STATUS_COLORS[item.status];

    visibleItems.push(
      <motion.button
        key={item.index}
        onClick={() => handleItemClick(i)}
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center rounded-xl transition-colors",
          isCurrent ? "ring-2 ring-saffron shadow-lg shadow-saffron/20" : "",
          isCurrent ? "bg-saffron/20 text-saffron" : colors.bg + " " + colors.text,
          item.bookmarked && !isCurrent ? "ring-1 ring-indigo/40" : "",
        )}
        style={{
          height: ITEM_HEIGHT,
          top: `calc(50% + ${offset * ITEM_HEIGHT}px - ${ITEM_HEIGHT / 2}px)`,
          transform: `perspective(800px) rotateX(${rotateX}deg) scale(${scale})`,
          opacity,
          zIndex: 10 - absOffset,
        }}
      >
        <span className={cn("font-bold", isCurrent ? "text-lg" : "text-sm")}>
          Q{item.label}
        </span>
        {isCurrent && (
          <span className="ml-2 text-xs text-muted-foreground">
            {item.status === "known" ? "✓" : item.status === "review" ? "⟳" : ""}
          </span>
        )}
      </motion.button>
    );
  }

  return (
    <div className={cn("relative select-none", className)}>
      {/* Header */}
      <div className="text-center mb-2">
        <span className="text-xs text-muted-foreground">
          {items.filter(i => i.status === "known").length}/{items.length} mastered
        </span>
      </div>

      {/* Drum container with ornamental border */}
      <div
        className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-b from-surface/90 via-background to-surface/90"
        style={{ height: VISIBLE_COUNT * ITEM_HEIGHT, perspective: "800px" }}
      >
        {/* Gradient fades at top and bottom */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

        {/* Center highlight slot */}
        <div
          className="absolute inset-x-2 z-10 pointer-events-none"
          style={{ top: `calc(50% - ${ITEM_HEIGHT / 2}px)`, height: ITEM_HEIGHT }}
        >
          <div className="h-full rounded-xl border border-saffron/30 bg-saffron/5" />
        </div>

        {/* Scrollable drum area */}
        <motion.div
          ref={containerRef}
          className="relative h-full cursor-grab active:cursor-grabbing px-2"
          onPan={handlePan}
          onPanEnd={handlePanEnd}
          onWheel={handleWheel}
        >
          {visibleItems}
        </motion.div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-teal/30" /> Known
        </span>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="size-2 rounded-sm bg-gold/30" /> Review
        </span>
      </div>
    </div>
  );
}
