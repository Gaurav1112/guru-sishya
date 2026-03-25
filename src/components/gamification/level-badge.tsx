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
  Shishya: "border-gray-500 text-gray-300",
  Sadhak: "border-teal text-teal",
  Vidyarthi: "border-blue-400 text-blue-400",
  Pandit: "border-saffron text-saffron",
  Acharya: "border-purple-400 text-purple-400",
  Guru: "border-gold text-gold",
  Maharishi: "border-white text-white",
};

const SIZE_MAP = {
  sm: "text-xs px-2 py-0.5 border",
  md: "text-sm px-3 py-1 border",
  lg: "text-base px-4 py-1.5 border-2",
};

export function LevelBadge({ level, size = "md", className = "" }: LevelBadgeProps) {
  const info = getLevelInfo(level);
  const colorClass = TIER_BORDER[info.tier] ?? TIER_BORDER.Shishya;
  const sizeClass = SIZE_MAP[size];
  const { data: session } = useSession();
  const displayName = useStore((s) => s.displayName);

  // Show "Shishya Gaurav" instead of "Shishya I"
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
