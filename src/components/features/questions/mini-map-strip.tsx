"use client";

import { useRef, useEffect, useCallback } from "react";

interface MiniMapItem {
  status: "unseen" | "known" | "review";
}

interface MiniMapStripProps {
  items: MiniMapItem[];
  currentIndex: number;
  onSeek: (index: number) => void;
}

const STATUS_COLORS: Record<string, string> = {
  unseen: "#3a3a4a",    // dark muted
  known: "#2dd4a8",     // teal
  review: "#f59e0b",    // amber/gold
};
const CURRENT_COLOR = "#E85D26"; // saffron

export function MiniMapStrip({ items, currentIndex, onSeek }: MiniMapStripProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const segW = w / items.length;

    // Draw segments
    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = STATUS_COLORS[items[i].status] || STATUS_COLORS.unseen;
      ctx.fillRect(i * segW, 0, Math.max(segW, 1), h);
    }

    // Draw current position indicator
    const cx = currentIndex * segW + segW / 2;
    ctx.fillStyle = CURRENT_COLOR;
    ctx.fillRect(Math.max(0, cx - 2), 0, 4, h);
  }, [items, currentIndex]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.floor((x / rect.width) * items.length);
    if (index >= 0 && index < items.length) onSeek(index);
  };

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-2 rounded-full cursor-pointer hover:h-3 transition-all"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Hover tooltip would go here */}
    </div>
  );
}
