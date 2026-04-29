"use client";
import { getLevelInfo } from "@/lib/gamification/xp";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";

interface LevelBadgeProps {
  level: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const TIER_BORDER: Record<string, string> = {
  Beginner: "border-gray-500 text-gray-300",
  Apprentice: "border-teal text-teal",
  Scholar: "border-blue-400 text-blue-400",
  Expert: "border-saffron text-saffron",
  Master: "border-purple-400 text-purple-400",
  Legend: "border-gold text-gold",
  Grandmaster: "border-white text-white",
};

const SIZE_MAP = {
  sm: "text-xs px-2 py-0.5 border",
  md: "text-sm px-3 py-1 border",
  lg: "text-base px-4 py-1.5 border-2",
};

export function LevelBadge({ level, size = "md", className = "" }: LevelBadgeProps) {
  const info = getLevelInfo(level);
  const colorClass = TIER_BORDER[info.tier] ?? TIER_BORDER.Beginner;
  const sizeClass = SIZE_MAP[size];
  const { data: session } = useSession();
  const displayName = useStore((s) => s.displayName);

  // Show "Beginner Gaurav" instead of "Beginner I"
  const firstName =
    session?.user?.name?.split(" ")[0] ??
    (displayName ? displayName.split(" ")[0] : null);

  const label = firstName ? `${info.tier} ${firstName}` : `${info.tier} ${info.subLevel}`;

  return (
    <span
      className={`inline-flex items-center rounded-full font-heading font-semibold tracking-wide ${sizeClass} ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
}
