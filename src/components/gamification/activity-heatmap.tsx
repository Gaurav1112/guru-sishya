"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a given Date in local time. */
function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns a Date for today with time zeroed out (local). */
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Add `n` days to a date (returns a new Date). */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Build the ordered list of 90 date-keys ending today. */
function buildDateRange(): string[] {
  const t = today();
  const keys: string[] = [];
  for (let i = 89; i >= 0; i--) {
    keys.push(toDateKey(addDays(t, -i)));
  }
  return keys;
}

// ── Color intensity ───────────────────────────────────────────────────────────

function cellColor(count: number): string {
  if (count === 0) return "bg-muted/30 border-border/20";
  if (count <= 2) return "bg-saffron/25 border-saffron/30";
  if (count <= 5) return "bg-saffron/55 border-saffron/50";
  return "bg-saffron border-saffron/80 shadow-[0_0_6px_rgba(255,171,0,0.35)]";
}

// ── Month labels ──────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

// ── Types ────────────────────────────────────────────────────────────────────

interface DayCell {
  dateKey: string;
  count: number;
  label: string; // e.g. "March 24 · 5 activities"
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? -6 : -4 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 whitespace-nowrap rounded-md border border-border/60 bg-popover px-2.5 py-1 text-[11px] font-medium text-popover-foreground shadow-lg"
    >
      {text}
    </motion.div>
  );
}

// ── Cell ──────────────────────────────────────────────────────────────────────

function HeatCell({ cell }: { cell: DayCell }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        className={`size-3.5 rounded-sm border cursor-default transition-colors duration-150 ${cellColor(cell.count)}`}
        whileHover={{ scale: 1.25 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />
      <Tooltip text={cell.label} visible={hovered} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ActivityHeatmap() {
  // Pull raw data from Dexie (live queries)
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const planSessions = useLiveQuery(() => db.planSessions.toArray(), []);
  const flashcards = useLiveQuery(() => db.flashcards.toArray(), []);

  // Read current streak from store
  const { currentStreak } = useStore();

  // Build the activity map: dateKey → count
  const activityMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};

    // Quiz attempts
    for (const attempt of quizAttempts ?? []) {
      if (!attempt.completedAt) continue;
      const key = toDateKey(new Date(attempt.completedAt));
      map[key] = (map[key] ?? 0) + 1;
    }

    // Plan sessions completed
    for (const session of planSessions ?? []) {
      if (!session.completed) continue;
      const dateSource = session.completedAt;
      if (!dateSource) continue;
      const key = toDateKey(new Date(dateSource));
      map[key] = (map[key] ?? 0) + 1;
    }

    // Flashcard reviews — a card was reviewed if repetitions > 0
    // We use nextReviewAt minus its interval as a rough proxy for last review
    // but the simplest accurate signal is: any card with repetitions > 0 that
    // has nextReviewAt set. We'll count the card as active on the day it was
    // last calculated (nextReviewAt minus interval in days is approximate).
    // Best available: use nextReviewAt date as a lower-bound review signal.
    for (const card of flashcards ?? []) {
      if (!card.nextReviewAt || (card.repetitions ?? 0) === 0) continue;
      // nextReviewAt is in the future; last review was roughly (interval) days ago
      const interval = card.interval ?? 1;
      const lastReview = addDays(new Date(card.nextReviewAt), -interval);
      const key = toDateKey(lastReview);
      map[key] = (map[key] ?? 0) + 1;
    }

    return map;
  }, [quizAttempts, planSessions, flashcards]);

  // Build the 90-day ordered key list
  const dateKeys = useMemo(() => buildDateRange(), []);

  // Compute stats
  const { totalSessions, activeDays, streakDays } = useMemo(() => {
    let total = 0;
    let active = 0;
    for (const key of dateKeys) {
      const count = activityMap[key] ?? 0;
      if (count > 0) {
        total += count;
        active += 1;
      }
    }

    // Current streak: consecutive days from today backwards
    let streak = 0;
    const t = today();
    for (let i = 0; i < 90; i++) {
      const key = toDateKey(addDays(t, -i));
      if ((activityMap[key] ?? 0) > 0) {
        streak++;
      } else if (i === 0) {
        // Today has no activity yet — don't break streak, check yesterday
        continue;
      } else {
        break;
      }
    }

    return { totalSessions: total, activeDays: active, streakDays: streak };
  }, [activityMap, dateKeys]);

  // Build grid: pad so first cell aligns to its day-of-week (Mon=0)
  // We need 13 columns (weeks): pad the start with empty cells
  const cells = useMemo<(DayCell | null)[]>(() => {
    const firstKey = dateKeys[0];
    const firstDate = new Date(firstKey + "T00:00:00");
    // getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon=0
    const dow = (firstDate.getDay() + 6) % 7;
    const padded: (DayCell | null)[] = Array(dow).fill(null);

    for (const key of dateKeys) {
      const count = activityMap[key] ?? 0;
      const d = new Date(key + "T00:00:00");
      const label = `${MONTH_SHORT[d.getMonth()]} ${d.getDate()} · ${count} ${count === 1 ? "activity" : "activities"}`;
      padded.push({ dateKey: key, count, label });
    }

    return padded;
  }, [dateKeys, activityMap]);

  // Build month header labels: track which column each month first appears in
  const monthHeaders = useMemo(() => {
    const firstKey = dateKeys[0];
    const firstDate = new Date(firstKey + "T00:00:00");
    const dow = (firstDate.getDay() + 6) % 7;

    const headers: { col: number; label: string }[] = [];
    let lastMonth = -1;

    for (let i = 0; i < dateKeys.length; i++) {
      const d = new Date(dateKeys[i] + "T00:00:00");
      const month = d.getMonth();
      if (month !== lastMonth) {
        const col = Math.floor((dow + i) / 7);
        headers.push({ col, label: MONTH_SHORT[month] });
        lastMonth = month;
      }
    }

    return headers;
  }, [dateKeys]);

  // Total columns needed
  const firstKey = dateKeys[0];
  const firstDate = new Date(firstKey + "T00:00:00");
  const leadPad = (firstDate.getDay() + 6) % 7;
  const totalCols = Math.ceil((leadPad + dateKeys.length) / 7);

  const isLoading = quizAttempts === undefined || planSessions === undefined || flashcards === undefined;

  return (
    <div className="rounded-2xl border border-border/50 bg-surface p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🔥</span>
        <h2 className="font-heading text-base font-semibold">Your Learning Journey</h2>
      </div>

      {isLoading ? (
        <div className="h-28 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
          Loading activity...
        </div>
      ) : (
        <>
          {/* Scrollable heatmap wrapper (mobile-friendly) */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              {/* Month labels row */}
              <div
                className="grid mb-1 pl-9"
                style={{ gridTemplateColumns: `repeat(${totalCols}, 1.125rem)` }}
              >
                {Array.from({ length: totalCols }, (_, colIdx) => {
                  const header = monthHeaders.find((h) => h.col === colIdx);
                  return (
                    <div key={colIdx} className="text-[9px] text-muted-foreground font-medium">
                      {header ? header.label : ""}
                    </div>
                  );
                })}
              </div>

              {/* Grid with day labels on the left */}
              <div className="flex gap-1.5">
                {/* Day-of-week labels */}
                <div className="flex flex-col gap-[3px] pt-[1px]">
                  {DAY_LABELS.map((label, i) => (
                    <div
                      key={i}
                      className="h-3.5 flex items-center justify-end pr-1 text-[9px] text-muted-foreground font-medium w-7"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Cell columns */}
                <div
                  className="grid gap-[3px]"
                  style={{
                    gridTemplateRows: "repeat(7, 0.875rem)",
                    gridTemplateColumns: `repeat(${totalCols}, 0.875rem)`,
                    gridAutoFlow: "column",
                  }}
                >
                  {cells.map((cell, idx) =>
                    cell === null ? (
                      <div key={`pad-${idx}`} className="size-3.5" />
                    ) : (
                      <HeatCell key={cell.dateKey} cell={cell} />
                    )
                  )}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 pl-9">
                <span className="text-[10px] text-muted-foreground">Less</span>
                {[0, 1, 3, 6].map((level) => (
                  <div
                    key={level}
                    className={`size-3.5 rounded-sm border ${cellColor(level)}`}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground">More</span>
              </div>
            </div>
          </div>

          {/* Stats summary */}
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/30 pt-4">
            <div className="text-center">
              <p className="font-heading text-xl font-bold text-saffron tabular-nums">
                {currentStreak > 0 ? currentStreak : streakDays}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">day streak</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-xl font-bold tabular-nums">{totalSessions}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">total sessions</p>
            </div>
            <div className="text-center">
              <p className="font-heading text-xl font-bold text-gold tabular-nums">{activeDays}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">active days (90d)</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
