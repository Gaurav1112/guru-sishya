"use client";

import { useEffect, useState, useCallback } from "react";
import { useStore } from "@/lib/store";
import {
  calculateWeeklyDigest,
  type WeeklyDigest as WeeklyDigestData,
} from "@/lib/gamification/weekly-digest";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ────────────────────────────────────────────────────────────────────────────
// Trend arrow helper
// ────────────────────────────────────────────────────────────────────────────

function TrendIndicator({
  trend,
}: {
  trend: WeeklyDigestData["accuracyTrend"];
}) {
  switch (trend) {
    case "up":
      return <span className="text-green-600 font-semibold">&#9650; Up</span>;
    case "down":
      return <span className="text-red-600 font-semibold">&#9660; Down</span>;
    case "stable":
      return <span className="text-gray-500 font-semibold">&#8212; Stable</span>;
    case "new":
      return <span className="text-gray-400 text-sm">First week!</span>;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function WeeklyDigestPreview() {
  const { currentStreak, totalXP, weeklyDigestEnabled, setWeeklyDigestEnabled } =
    useStore();
  const [digest, setDigest] = useState<WeeklyDigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    calculateWeeklyDigest({ currentStreak, totalXP })
      .then((d) => {
        if (!cancelled) setDigest(d);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentStreak, totalXP]);

  const toggleDigest = useCallback(() => {
    setWeeklyDigestEnabled(!weeklyDigestEnabled);
  }, [weeklyDigestEnabled, setWeeklyDigestEnabled]);

  if (loading) {
    return (
      <Card className="bg-surface border-border/50 animate-pulse">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Digest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 rounded bg-muted/20" />
        </CardContent>
      </Card>
    );
  }

  if (!digest) return null;

  const weekLabel = `${new Date(digest.weekStart).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} - ${new Date(digest.weekEnd).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;

  return (
    <Card className="bg-surface border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Weekly Digest</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleDigest}
          className={weeklyDigestEnabled ? "border-saffron/50 text-saffron" : ""}
        >
          {weeklyDigestEnabled ? "Enabled" : "Disabled"}
        </Button>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Preview of your weekly progress report ({weekLabel})
        </p>

        {/* ── Email-style card (white bg, dark text -- email compatible) ── */}
        <div
          className="rounded-xl border border-border/30 overflow-hidden"
          style={{ backgroundColor: "#ffffff", color: "#1a1a1a" }}
        >
          {/* Header */}
          <div
            className="px-6 py-4"
            style={{ backgroundColor: "#0C0A15", color: "#ffffff" }}
          >
            <div className="font-bold text-lg" style={{ color: "#E85D26" }}>
              Guru Sishya
            </div>
            <div className="text-sm" style={{ color: "#cccccc" }}>
              Your Weekly Progress -- {weekLabel}
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatBox
                label="Questions"
                value={String(digest.questionsAnswered)}
              />
              <StatBox
                label="Accuracy"
                value={
                  digest.averageAccuracy !== null
                    ? `${digest.averageAccuracy}%`
                    : "--"
                }
              />
              <StatBox
                label="Streak"
                value={`${digest.currentStreak} day${digest.currentStreak !== 1 ? "s" : ""}`}
                highlight={digest.streakActive}
              />
              <StatBox
                label="Sessions"
                value={String(digest.sessionsCompleted)}
              />
            </div>

            {/* Accuracy trend */}
            <div
              className="flex items-center justify-between rounded-lg px-4 py-3"
              style={{ backgroundColor: "#f5f5f5" }}
            >
              <span className="text-sm font-medium" style={{ color: "#333" }}>
                Accuracy Trend
              </span>
              <TrendIndicator trend={digest.accuracyTrend} />
            </div>

            {/* Topics studied */}
            {digest.topicsStudied.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#333" }}
                >
                  Topics Studied
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {digest.topicsStudied.map((t) => (
                    <span
                      key={t}
                      className="inline-block rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: "#E85D26",
                        color: "#ffffff",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Badges earned */}
            {digest.badgesEarned.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#333" }}
                >
                  Badges Earned
                </h4>
                <div className="space-y-1.5">
                  {digest.badgesEarned.map((b) => (
                    <div
                      key={b.name}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span>{b.icon}</span>
                      <span className="font-medium" style={{ color: "#1a1a1a" }}>
                        {b.name}
                      </span>
                      <span style={{ color: "#666" }}>-- {b.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weak areas */}
            {digest.weakAreas.length > 0 && (
              <div>
                <h4
                  className="text-sm font-semibold mb-2"
                  style={{ color: "#cc3300" }}
                >
                  Needs Review (below 60%)
                </h4>
                <div className="space-y-1">
                  {digest.weakAreas.slice(0, 5).map((w) => (
                    <div
                      key={w.topic}
                      className="flex items-center justify-between text-sm rounded px-3 py-1.5"
                      style={{ backgroundColor: "#fff0f0" }}
                    >
                      <span style={{ color: "#1a1a1a" }}>{w.topic}</span>
                      <span
                        className="font-mono font-semibold"
                        style={{ color: "#cc3300" }}
                      >
                        {w.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {digest.questionsAnswered === 0 &&
              digest.sessionsCompleted === 0 &&
              digest.topicsStudied.length === 0 && (
                <div
                  className="text-center py-6 text-sm"
                  style={{ color: "#999" }}
                >
                  No activity this week yet. Start a quiz or session to see your
                  progress here!
                </div>
              )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 text-center text-xs"
            style={{ backgroundColor: "#f9f9f9", color: "#999" }}
          >
            guru-sishya.in -- Your interview prep companion
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stat box (email-safe inline styles)
// ────────────────────────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-3 text-center"
      style={{ backgroundColor: "#f5f5f5" }}
    >
      <div
        className="text-xl font-bold"
        style={{ color: highlight ? "#E85D26" : "#1a1a1a" }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: "#666" }}>
        {label}
      </div>
    </div>
  );
}
