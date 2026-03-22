"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { getLevelInfo, xpProgressInLevel } from "@/lib/gamification/xp";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { LevelBadge } from "@/components/gamification/level-badge";
import { BadgeMandir } from "@/components/gamification/badge-mandir";
import { ShareButton } from "@/components/share-button";

// ────────────────────────────────────────────────────────────────────────────
// 30-day dot calendar
// ────────────────────────────────────────────────────────────────────────────

function StreakCalendar() {
  const today = new Date();
  const streakHistory = useLiveQuery(() => db.streakHistory.toArray(), []);

  const activeDates = new Set((streakHistory ?? []).map((e) => e.date));

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { dateStr, active: activeDates.has(dateStr) };
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {days.map(({ dateStr, active }) => (
        <div
          key={dateStr}
          title={dateStr}
          className={`h-4 w-4 rounded-sm ${active ? "bg-green-500" : "bg-muted/60"}`}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Coin balance section
// ────────────────────────────────────────────────────────────────────────────

function CoinBalanceSection() {
  const coins = useStore((s) => s.coins);
  const transactions = useLiveQuery(
    () => db.coinTransactions.orderBy("createdAt").reverse().limit(10).toArray(),
    []
  );

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🪙</span>
        <div>
          <h3 className="font-heading font-bold">Coin Balance</h3>
          <p className="text-sm text-muted-foreground">{coins.toLocaleString()} coins</p>
        </div>
      </div>

      {transactions && transactions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Transactions</p>
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[200px]">{tx.reason}</span>
              <span className={tx.type === "earn" ? "text-green-400" : "text-red-400"}>
                {tx.type === "earn" ? "+" : "-"}{tx.amount}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No transactions yet</p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stats grid
// ────────────────────────────────────────────────────────────────────────────

function StatsGrid() {
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const topics = useLiveQuery(() => db.topics.count(), []);
  const chatSessions = useLiveQuery(
    () => db.chatSessions.where("technique").equals("feynman").count(),
    []
  );
  const learningPlans = useLiveQuery(() => db.learningPlans.toArray(), []);

  const questionsAnswered = (quizAttempts ?? []).reduce(
    (acc, q) => acc + (q.questions?.length ?? 0),
    0
  );

  const totalScore = (quizAttempts ?? []).reduce((acc, q) => acc + q.score, 0);
  const attemptCount = quizAttempts?.length ?? 0;
  const accuracy = attemptCount > 0 ? Math.round(totalScore / attemptCount) : 0;

  const planSessions = (learningPlans ?? []).reduce(
    (acc, p) => acc + (p.sessions?.length ?? 0),
    0
  );
  const estimatedHours = Math.round(
    (attemptCount * 5 + planSessions * 120) / 60
  );

  const stats = [
    { label: "Questions Answered", value: questionsAnswered, icon: "❓" },
    { label: "Accuracy", value: `${accuracy}%`, icon: "🎯" },
    { label: "Topics Explored", value: topics ?? 0, icon: "📚" },
    { label: "Estimated Hours", value: estimatedHours, icon: "⏱️" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border/50 bg-surface p-4 text-center"
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="font-heading text-2xl font-bold">{stat.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Profile Page
// ────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { totalXP, level, currentStreak, longestStreak } = useStore();
  const levelInfo = getLevelInfo(level);
  const progress = xpProgressInLevel(totalXP);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-surface p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <LevelBadge level={level} size="lg" />
            </div>
            <h1 className="font-heading text-3xl font-black">{levelInfo.tier} {levelInfo.subLevel}</h1>
            <p className="text-muted-foreground">{levelInfo.tierDescription}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gold">{totalXP.toLocaleString()} XP</p>
            <p className="text-xs text-muted-foreground">
              {progress.current}/{progress.needed} to next level
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Your Stats</h2>
          <ShareButton
            type="stats"
            value={level}
            shareText={`I'm Level ${level} on Guru Sishya with ${totalXP.toLocaleString()} XP! Building real software engineering interview mastery.`}
            size="sm"
          />
        </div>
        <StatsGrid />
      </section>

      {/* ── Streak Section ─────────────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">Sadhana Streak</h2>
        <div className="rounded-xl border border-border/50 bg-surface p-5 space-y-4">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <StreakFlame streak={currentStreak} size="lg" />
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="font-heading text-3xl font-bold text-orange-300">{longestStreak}</span>
              <p className="text-xs text-muted-foreground">Longest</p>
            </div>
            {currentStreak >= 3 && (
              <div className="ml-auto">
                <ShareButton
                  type="streak"
                  value={currentStreak}
                  size="sm"
                />
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Last 30 days</p>
            <StreakCalendar />
          </div>
        </div>
      </section>

      {/* ── Badge Mandir ───────────────────────────────────────────────── */}
      <section>
        <BadgeMandir />
      </section>

      {/* ── Coin Balance ───────────────────────────────────────────────── */}
      <section>
        <CoinBalanceSection />
      </section>
    </div>
  );
}
