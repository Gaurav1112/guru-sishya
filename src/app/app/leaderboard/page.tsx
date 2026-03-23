"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  generateSimulatedLeague,
  getLeague,
  getLeagueColor,
  shouldResetLeague,
  LEAGUES,
} from "@/lib/gamification/leaderboard";

// ── League tier badge component ───────────────────────────────────────────────

function LeagueBadge({
  league,
  active,
}: {
  league: string;
  active: boolean;
}) {
  const color = getLeagueColor(league);
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-1 transition-all ${
        active ? "border-2 shadow-lg scale-105" : "border-border/30 opacity-50"
      }`}
      style={
        active
          ? {
              borderColor: color,
              boxShadow: `0 0 10px ${color}44`,
            }
          : {}
      }
    >
      <span
        className="text-xs font-bold"
        style={{ color: active ? color : undefined }}
      >
        {leagueIcon(league)}
      </span>
      <span className="text-[10px] text-muted-foreground">{league}</span>
    </div>
  );
}

function leagueIcon(league: string): string {
  const map: Record<string, string> = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Sapphire: "💙",
    Ruby: "❤️",
    Emerald: "💚",
    Diamond: "💎",
  };
  return map[league] ?? "🏅";
}

// ── Days until next Sunday (weekly reset) ────────────────────────────────────

function daysUntilSunday(): number {
  const today = new Date().getDay(); // 0=Sun, 1=Mon…
  return today === 0 ? 7 : 7 - today;
}

// ── Weekly XP estimate (total / weeks since arbitrary epoch) ─────────────────

function estimateWeeklyXP(totalXP: number): number {
  // Approximate: 1/8 of total XP in the most recent "week"
  return Math.max(10, Math.round(totalXP / 8));
}

// ── Leaderboard page ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { totalXP, level, showOnLeaderboard } = useStore();

  const userWeeklyXP = estimateWeeklyXP(totalXP);
  const userLeague = getLeague(totalXP);
  const leagueColor = getLeagueColor(userLeague);

  // Check if league needs reset (just for display; actual reset is client-side)
  const lastReset =
    typeof window !== "undefined"
      ? localStorage.getItem("leagueLastReset") ?? ""
      : "";
  const today = new Date().toISOString().slice(0, 10);
  const needsReset = shouldResetLeague(lastReset, today);

  const simUsers = useMemo(
    () => generateSimulatedLeague(userWeeklyXP, level),
    [userWeeklyXP, level]
  );

  // Combine simulated + real user, sort by weeklyXP descending
  // If the user has opted out, exclude them from the list
  const allUsers = useMemo(() => {
    const others = simUsers.map((u) => ({ ...u, isMe: false }));
    if (!showOnLeaderboard) return others.sort((a, b) => b.weeklyXP - a.weeklyXP);
    const me = {
      name: "You",
      weeklyXP: userWeeklyXP,
      league: userLeague,
      archetype: "grinder" as const,
      avatarSeed: 0,
      isMe: true,
    };
    return [...others, me].sort((a, b) => b.weeklyXP - a.weeklyXP);
  }, [simUsers, userWeeklyXP, userLeague, showOnLeaderboard]);

  const totalCount = allUsers.length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Weekly XP rankings in your league
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-lg font-bold font-heading"
            style={{ color: leagueColor }}
          >
            {leagueIcon(userLeague)} {userLeague} League
          </p>
          <p className="text-xs text-muted-foreground">
            Resets in {daysUntilSunday()} day{daysUntilSunday() !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* League tier badges */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LEAGUES.map((league) => (
          <LeagueBadge key={league} league={league} active={league === userLeague} />
        ))}
      </div>

      {/* Reset notice */}
      {needsReset && (
        <div className="rounded-lg border border-saffron/30 bg-saffron/10 px-3 py-2 text-xs text-saffron">
          New week — league rankings have been refreshed!
        </div>
      )}

      {/* Privacy opt-out notice */}
      {!showOnLeaderboard && (
        <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
          You&apos;ve opted out of the leaderboard. Enable &quot;Show me on Leaderboard&quot; in{" "}
          <a href="/app/settings" className="text-saffron hover:underline underline-offset-2">
            Settings
          </a>{" "}
          to participate.
        </div>
      )}

      {/* Leaderboard list */}
      <div className="space-y-2">
        {allUsers.map((user, idx) => {
          const rank = idx + 1;
          const isTop5 = rank <= 5;
          const isBottom5 = rank > totalCount - 5;
          const isMe = user.isMe;

          return (
            <div
              key={isMe ? "me" : `${user.name}-${idx}`}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                isMe
                  ? "border-saffron/60 bg-saffron/10"
                  : "border-border/40 bg-surface"
              }`}
            >
              {/* Rank */}
              <span
                className={`w-6 text-center text-sm font-bold tabular-nums ${
                  rank === 1
                    ? "text-gold"
                    : rank === 2
                      ? "text-[#c0c0c0]"
                      : rank === 3
                        ? "text-[#cd7f32]"
                        : "text-muted-foreground"
                }`}
              >
                {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : rank}
              </span>

              {/* Avatar (simple colored circle with seed) */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{
                  backgroundColor: isMe
                    ? getLeagueColor(userLeague)
                    : archetypeColor(user.archetype),
                }}
              >
                {isMe ? "★" : user.name[0]}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isMe ? "text-saffron" : "text-foreground"
                  }`}
                >
                  {isMe ? "You" : user.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.archetype.replace("_", " ")}
                </p>
              </div>

              {/* XP */}
              <span className="text-sm font-bold tabular-nums text-foreground">
                {user.weeklyXP.toLocaleString()} XP
              </span>

              {/* Promotion / demotion indicator */}
              {isTop5 && (
                <span
                  className="text-green-400 text-base"
                  title="Top 5 — promotion zone"
                >
                  ↑
                </span>
              )}
              {isBottom5 && !isTop5 && (
                <span
                  className="text-red-400 text-base"
                  title="Bottom 5 — demotion zone"
                >
                  ↓
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="text-green-400">↑</span> Promotion zone (top 5)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-400">↓</span> Demotion zone (bottom 5)
        </span>
      </div>
    </div>
  );
}

function archetypeColor(archetype: string): string {
  const map: Record<string, string> = {
    grinder: "#6366f1",
    weekend_warrior: "#f59e0b",
    sprinter: "#ef4444",
    casual: "#10b981",
    overachiever: "#8b5cf6",
  };
  return map[archetype] ?? "#6b7280";
}
