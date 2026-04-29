"use client";

import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import {
  buildLeaderboard,
  getLeague,
  getLeagueColor,
  shouldResetLeague,
  LEAGUES,
  type LeaderboardEntry,
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
    Bronze: "\u{1F949}",
    Silver: "\u{1F948}",
    Gold: "\u{1F947}",
    Sapphire: "\u{1F499}",
    Ruby: "\u{2764}\uFE0F",
    Emerald: "\u{1F49A}",
    Diamond: "\u{1F48E}",
  };
  return map[league] ?? "\u{1F3C5}";
}

// ── Days until next Sunday (weekly reset) ────────────────────────────────────

function computeDaysUntilSunday(): number {
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  return today === 0 ? 7 : 7 - today;
}

// ── Leaderboard page ─────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { totalXP, level, weeklyXP, weeklyXPWeek, showOnLeaderboard, displayName } = useStore();
  const { data: session } = useSession();

  // Resolve the user's first name for the leaderboard entry
  const myName =
    session?.user?.name?.split(" ")[0] ??
    (displayName ? displayName.split(" ")[0] : null) ??
    "You";

  // Use actual weekly XP from store; fall back to estimate for old users
  // who don't have weeklyXP tracked yet
  const [currentWeekId, setCurrentWeekId] = useState("");
  const [needsReset, setNeedsReset] = useState(false);
  const [daysUntilSunday, setDaysUntilSunday] = useState(7);

  useEffect(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    setCurrentWeekId(`${now.getFullYear()}-${String(week).padStart(2, "0")}`);

    const lastReset = localStorage.getItem("leagueLastReset") ?? "";
    const today = now.toISOString().slice(0, 10);
    setNeedsReset(shouldResetLeague(lastReset, today));

    setDaysUntilSunday(computeDaysUntilSunday());
  }, []);

  const userWeeklyXP = currentWeekId && weeklyXPWeek === currentWeekId && weeklyXP > 0
    ? weeklyXP
    : Math.max(10, Math.round(totalXP / 8)); // fallback estimate

  const userLeague = getLeague(totalXP);
  const leagueColor = getLeagueColor(userLeague);

  const { entries: allUsers, userRank } = useMemo(
    () =>
      buildLeaderboard({
        userWeeklyXP,
        userLevel: level,
        userLeague,
        userName: myName,
        showOnLeaderboard,
      }),
    [userWeeklyXP, level, userLeague, showOnLeaderboard, myName]
  );

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
            Resets in {daysUntilSunday} day{daysUntilSunday !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* AI Practice Partners info */}
      <div className="rounded-lg border border-border/50 bg-surface/50 px-4 py-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">AI Practice Partners</span>
        {" \u2014 "}
        Compete against AI-generated practice partners calibrated to your skill level.
        Earn XP to climb the ranks and get promoted each week.
      </div>

      {/* User rank highlight */}
      {showOnLeaderboard && userRank > 0 && (
        <div
          className="rounded-lg border-2 px-4 py-3 text-center text-sm font-semibold"
          style={{ borderColor: leagueColor, backgroundColor: `${leagueColor}15` }}
        >
          You are <span className="text-lg font-bold" style={{ color: leagueColor }}>#{userRank}</span> this week
          {" \u2014 "}{userWeeklyXP.toLocaleString()} XP earned
        </div>
      )}

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
        {allUsers.map((user: LeaderboardEntry, idx: number) => {
          const rank = idx + 1;
          const isTop5 = rank <= 5;
          const isBottom5 = rank > totalCount - 5;
          const isMe = user.isMe;

          return (
            <div
              key={isMe ? "me" : `${user.name}-${idx}`}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                isMe
                  ? "border-saffron/60 bg-saffron/10 ring-1 ring-saffron/30"
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
                {rank <= 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][rank - 1] : rank}
              </span>

              {/* Avatar (simple colored circle with seed) */}
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 relative"
                style={{
                  backgroundColor: isMe
                    ? getLeagueColor(userLeague)
                    : archetypeColor(user.archetype),
                }}
              >
                {isMe ? "\u2605" : user.name[0]}
              </div>

              {/* Name + label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isMe ? "text-saffron" : "text-foreground"
                    }`}
                  >
                    {isMe ? `${user.name} (You)` : user.name}
                  </p>
                  {user.isAI && (
                    <span
                      className="inline-flex items-center rounded bg-muted/50 px-1 py-0.5 text-[10px] text-muted-foreground"
                      title="AI Practice Partner"
                    >
                      {"\u{1F916}"} AI
                    </span>
                  )}
                </div>
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
                  {"\u2191"}
                </span>
              )}
              {isBottom5 && !isTop5 && (
                <span
                  className="text-red-400 text-base"
                  title="Bottom 5 — demotion zone"
                >
                  {"\u2193"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="text-green-400">{"\u2191"}</span> Promotion zone (top 5)
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-400">{"\u2193"}</span> Demotion zone (bottom 5)
        </span>
        <span className="flex items-center gap-1">
          {"\u{1F916}"} AI Practice Partner
        </span>
      </div>

      {/* Weekly tip */}
      <div className="rounded-lg border border-border/40 bg-surface/30 px-4 py-3 text-center text-xs text-muted-foreground">
        Top 5 earn a promotion to the next league. Bottom 5 risk demotion. Rankings reset every Sunday.
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
