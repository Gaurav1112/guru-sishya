"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { useRef } from "react";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { getLevelInfo, xpProgressInLevel } from "@/lib/gamification/xp";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { LevelBadge } from "@/components/gamification/level-badge";
import { BadgeMandir } from "@/components/gamification/badge-mandir";
import { ShareButton } from "@/components/share-button";
import { ShareCard } from "@/components/profile/share-card";
import { Button } from "@/components/ui/button";

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
// Export / Import progress (Option A — zero-cost cross-device transfer)
// Future: replace with Supabase free-tier sync when a DB is set up
// ────────────────────────────────────────────────────────────────────────────

function ProgressTransfer() {
  const importRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const data: Record<string, unknown[]> = {};
      const tableNames = [
        "topics", "learningPlans", "quizAttempts", "flashcards",
        "chatSessions", "chatMessages", "cheatSheets", "resources",
        "badges", "streakHistory", "dailyChallenges", "coinTransactions",
        "inventory", "guidedPathProgress", "skillTreeNodes",
        "treasureChests", "planSessions", "userProfile",
        "ladderCache", "graduationTests", "levelProgress",
        "aiCache", "timedTestResults",
      ] as const;

      for (const name of tableNames) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = (db as any)[name];
        if (table) {
          data[name] = await table.toArray();
        }
      }

      const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guru-sishya-progress-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed. Please try again.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { version: number; data: Record<string, unknown[]> };

      if (!parsed.data) {
        alert("Invalid progress file.");
        return;
      }

      const confirmed = window.confirm(
        "This will merge the imported data into your current local data. Existing records will not be deleted. Continue?"
      );
      if (!confirmed) return;

      for (const [tableName, rows] of Object.entries(parsed.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const table = (db as any)[tableName];
        if (table && Array.isArray(rows) && rows.length > 0) {
          // Remove the id field so Dexie auto-assigns new IDs, avoiding conflicts
          const cleaned = (rows as Record<string, unknown>[]).map(({ id: _id, ...rest }) => rest);
          await table.bulkAdd(cleaned).catch(() => {
            // bulkAdd may partially fail on duplicates — that's okay
          });
        }
      }

      alert("Progress imported successfully! Refresh the page to see updates.");
    } catch (err) {
      console.error("Import failed", err);
      alert("Import failed. Make sure the file is a valid Guru Sishya export.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💾</span>
        <div>
          <h3 className="font-heading font-bold">Progress Backup</h3>
          <p className="text-sm text-muted-foreground">
            Export your progress to a file and import it on another device.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <Button variant="outline" size="sm" onClick={handleExport}>
          Export Progress
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => importRef.current?.click()}
        >
          Import Progress
        </Button>
        <input
          ref={importRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground/60">
        Data stays in your browser. Export creates a JSON file you can load on any device.
        {/* Future: Supabase free-tier cloud sync can be wired here for automatic cross-device sync */}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sign-in CTA — shown when user is not logged in
// ────────────────────────────────────────────────────────────────────────────

function SignInCTA() {
  return (
    <div className="rounded-xl border border-saffron/30 bg-saffron/5 p-6 text-center">
      <p className="text-2xl mb-3">🔒</p>
      <h2 className="font-heading text-lg font-bold mb-2">
        Sign in to save your progress across devices
      </h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        Your progress is stored locally in this browser. Sign in with Google to
        export and sync it across your devices for free.
      </p>
      <Button
        onClick={() => signIn("google", { callbackUrl: "/app/profile" })}
        className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200 font-medium gap-3"
      >
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Sign In with Google
      </Button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Google account card — shown at the top when signed in
// ────────────────────────────────────────────────────────────────────────────

function GoogleAccountCard() {
  const { data: session } = useSession();
  if (!session?.user) return null;

  const user = session.user;
  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="rounded-xl border border-teal/30 bg-teal/5 p-5">
      <div className="flex items-center gap-4">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User avatar"}
            width={52}
            height={52}
            className="rounded-full ring-2 ring-teal/30"
          />
        ) : (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-saffron/20 text-lg font-bold text-saffron ring-2 ring-saffron/30">
            {initials}
          </div>
        )}
        <div>
          <p className="font-heading font-bold text-lg leading-tight">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-teal mt-0.5">Signed in with Google</p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Profile Page
// ────────────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { totalXP, level, currentStreak, longestStreak, displayName } = useStore();
  const levelInfo = getLevelInfo(level);
  const progress = xpProgressInLevel(totalXP);

  // Resolve the user's actual name: Google session > store displayName
  const userName =
    session?.user?.name ??
    displayName ??
    null;

  // Stats needed for share card
  const quizAttempts = useLiveQuery(() => db.quizAttempts.toArray(), []);
  const badgeCount = useLiveQuery(() => db.badges.count(), []) ?? 0;
  const totalQuestions = (quizAttempts ?? []).reduce(
    (acc, q) => acc + (q.questions?.length ?? 0),
    0
  );
  const attemptCount = quizAttempts?.length ?? 0;
  const totalScore = (quizAttempts ?? []).reduce((acc, q) => acc + q.score, 0);
  const accuracy = attemptCount > 0 ? Math.round(totalScore / attemptCount) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* ── Google account info (when signed in) ───────────────────────── */}
      {status !== "loading" && session && <GoogleAccountCard />}

      {/* ── Sign-in CTA (when not signed in) ───────────────────────────── */}
      {status !== "loading" && !session && <SignInCTA />}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border/50 bg-surface p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="font-heading text-3xl font-black">
              {userName ?? "Your Profile"}
            </h1>
            {!userName && (
              <p className="text-xs text-muted-foreground/60 mb-2">
                Sign in with Google to show your name here
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 mb-1">
              <LevelBadge level={level} size="lg" />
            </div>
            <p className="text-muted-foreground">{levelInfo.tierDescription}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5">Total XP earned</p>
            <p className="text-2xl font-bold text-gold">{totalXP.toLocaleString()} XP</p>
            <p className="text-xs text-muted-foreground mt-1">
              Level progress: {progress.current}/{progress.needed} XP to next level
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">Your Stats</h2>
          <div className="flex items-center gap-2">
            <ShareCard
              badgeCount={badgeCount}
              totalQuestions={totalQuestions}
              accuracy={accuracy}
            />
            <ShareButton
              type="stats"
              value={level}
              shareText={`I'm Level ${level} on Guru Sishya with ${totalXP.toLocaleString()} XP! Building real software engineering interview mastery.`}
              size="sm"
            />
          </div>
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

      {/* ── Progress Export / Import ────────────────────────────────────── */}
      <section>
        <h2 className="font-heading text-xl font-bold mb-4">Progress Backup</h2>
        <ProgressTransfer />
      </section>
    </div>
  );
}
