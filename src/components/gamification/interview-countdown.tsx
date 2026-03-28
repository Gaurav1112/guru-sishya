"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";
import { CalendarClock, Settings } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr + "T23:59:59");
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function recommendedHours(daysLeft: number): string {
  if (daysLeft <= 0) return "Review key topics today";
  if (daysLeft <= 3) return "6-8 hrs/day — intense revision";
  if (daysLeft <= 7) return "4-6 hrs/day — focus on weak areas";
  if (daysLeft <= 14) return "3-4 hrs/day — balanced practice";
  if (daysLeft <= 30) return "2-3 hrs/day — steady progress";
  return "1-2 hrs/day — build strong foundations";
}

// ── Progress Ring SVG ────────────────────────────────────────────────────────

function ProgressRing({
  percent,
  size = 48,
  stroke = 4,
  color,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="rotate-90 origin-center fill-current text-foreground"
        fontSize={size * 0.22}
        fontWeight={700}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}

// ── Main Widget ──────────────────────────────────────────────────────────────

export function InterviewCountdown() {
  const { interviewDate, interviewCompany, totalXP } = useStore();

  // No date set — show a nudge
  if (!interviewDate) {
    return (
      <Link
        href="/app/settings"
        className="group flex items-center gap-4 rounded-xl border border-border/50 bg-surface hover:bg-surface-hover p-4 transition-all"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/50 bg-muted/10">
          <CalendarClock className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Set your interview date</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Add a target date in Settings to see a countdown and personalized study recommendations.
          </p>
        </div>
        <Settings className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
    );
  }

  const days = daysUntil(interviewDate);
  const isPast = days <= 0;

  // Color coding based on urgency
  let borderClass: string;
  let bgClass: string;
  let accentColor: string; // for ring SVG
  let textClass: string;
  let pulseClass = "";

  if (isPast) {
    borderClass = "border-muted-foreground/30";
    bgClass = "bg-muted/5";
    accentColor = "hsl(var(--muted-foreground))";
    textClass = "text-muted-foreground";
  } else if (days <= 7) {
    borderClass = "border-red-500/40";
    bgClass = "bg-red-500/5";
    accentColor = "#ef4444";
    textClass = "text-red-400";
    pulseClass = "animate-pulse";
  } else if (days <= 30) {
    borderClass = "border-gold/40";
    bgClass = "bg-gold/5";
    accentColor = "hsl(var(--gold))";
    textClass = "text-gold";
  } else {
    borderClass = "border-teal/30";
    bgClass = "bg-teal/5";
    accentColor = "hsl(var(--teal))";
    textClass = "text-teal";
  }

  // Rough prep completion heuristic based on XP
  // ~5000 XP = well-prepared for one topic area; ~25000 XP = solid across the board
  const prepPercent = Math.min(100, Math.round((totalXP / 25000) * 100));

  const companyLabel = interviewCompany || "Interview";
  const recommendation = recommendedHours(days);

  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 transition-all`}>
      <div className="flex items-center gap-4">
        {/* Progress Ring */}
        <ProgressRing percent={prepPercent} color={accentColor} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${textClass} ${pulseClass}`}>
              {isPast
                ? `${companyLabel} date has passed`
                : `${companyLabel} in ${days} day${days !== 1 ? "s" : ""}`}
            </p>
          </div>

          {!isPast && (
            <p className="text-xs text-muted-foreground mt-1">{recommendation}</p>
          )}

          {isPast && (
            <p className="text-xs text-muted-foreground mt-1">
              Update your interview date in{" "}
              <Link href="/app/settings" className="text-saffron hover:underline">
                Settings
              </Link>
            </p>
          )}
        </div>

        {/* Days badge */}
        {!isPast && (
          <div
            className={`flex flex-col items-center justify-center rounded-lg border ${borderClass} ${bgClass} px-3 py-2 min-w-[56px]`}
          >
            <span className={`font-heading text-2xl font-bold leading-none ${textClass}`}>
              {days}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {days === 1 ? "day" : "days"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
