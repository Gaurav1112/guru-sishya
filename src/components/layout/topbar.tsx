"use client";
import Image from "@/components/ui/image";
import { useState, useEffect } from "react";
import { usePathname } from "@/lib/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Crown, Menu, ShieldCheck, Home, BookOpen, FileQuestion, Mic, RotateCcw,
  Library, Zap, Trophy, NotebookPen, Swords, Bookmark, RefreshCw, Map,
  ShoppingCart, User, Settings, type LucideIcon,
} from "lucide-react";
import { useSession } from "@/lib/clerk-compat";
import { useStore } from "@/lib/store";
import { ADMIN_EMAIL } from "@/lib/stores/premium-slice";
import { StreakFlame, type StreakStatus } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { CoinDisplay } from "@/components/gamification/coin-display";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";

// Matches sidebar.tsx nav items (primary + more) in the same order
const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app/dashboard", label: "Dashboard", icon: Home },
  { href: "/app/topics", label: "Topics", icon: BookOpen },
  { href: "/app/questions", label: "Questions", icon: FileQuestion },
  { href: "/app/interview", label: "Mock Interview", icon: Mic },
  { href: "/app/review", label: "Review", icon: RotateCcw },
  { href: "/app/codex", label: "Interview Codex", icon: Library },
  { href: "/app/playground", label: "Playground", icon: Zap },
  { href: "/app/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/app/notes", label: "My Notes", icon: NotebookPen },
  { href: "/app/challenges", label: "Challenges", icon: Swords },
  { href: "/app/saved", label: "Saved Questions", icon: Bookmark },
  { href: "/app/revision", label: "Revision", icon: RefreshCw },
  { href: "/app/roadmap", label: "Roadmap", icon: Map },
  { href: "/app/shop", label: "Shop", icon: ShoppingCart },
  { href: "/app/profile", label: "Profile", icon: User },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isPremium, premiumUntil } = useStore();
  const { data: session } = useSession();
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());
  const isActivePro = true; // upgrade layer disabled
  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Live count of flashcards due today — mirrors sidebar
  const dueCount = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return db.flashcards.where("nextReviewAt").belowOrEqual(today).count();
  }, []);

  // Live count of pending revision items (interview wrong answers not yet mastered)
  const revisionCount = useLiveQuery(async () => {
    const cards = await db.flashcards
      .filter((f) => f.concept.startsWith("interview_wrong::") && f.interval < 30)
      .count();
    return cards;
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label="Open navigation menu"
        className="md:hidden flex items-center justify-center rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-border/50 px-4 py-3">
          <SheetTitle className="font-heading text-saffron tracking-wider">GURU SISHYA</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/app/review" && dueCount !== undefined && dueCount > 0 && (
                  <span className="flex items-center justify-center rounded-full bg-saffron text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                    {dueCount > 99 ? "99+" : dueCount}
                  </span>
                )}
                {item.href === "/app/revision" && revisionCount !== undefined && revisionCount > 0 && (
                  <span className="flex items-center justify-center rounded-full bg-amber-500 text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                    {revisionCount > 99 ? "99+" : revisionCount}
                  </span>
                )}
              </a>
            );
          })}
          {/* Admin console link — only visible for admin */}
          {isAdmin && (
            <a
              href="/app/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname.startsWith("/app/admin")
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-indigo-400/80 hover:bg-indigo-500/10 hover:text-indigo-300"
              )}
            >
              <ShieldCheck className="size-4 shrink-0" />
              Admin Console
            </a>
          )}

          {/* Pro upgrade / status link */}
          {isActivePro ? (
            <a
              href="/app/pricing"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/app/pricing"
                  ? "bg-surface text-foreground"
                  : "text-gold hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <Crown className="size-4 shrink-0" />
              <span className="flex-1">Pro</span>
              <span className="text-[10px] font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-1.5 py-0.5">
                Active
              </span>
            </a>
          ) : (
            <a
              href="/app/pricing"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                pathname === "/app/pricing"
                  ? "bg-saffron/20 text-saffron"
                  : "text-saffron hover:bg-saffron/10"
              )}
            >
              <Crown className="size-4 shrink-0" />
              Upgrade to Pro
            </a>
          )}

          {topics && topics.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground">RECENT TOPICS</div>
              {topics.map((topic) => (
                <a
                  key={topic.id}
                  href={`/app/topic/${topic.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                    pathname === `/app/topic/${topic.id}`
                      ? "bg-surface text-foreground"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-saffron/40" />
                  <span className="truncate">{topic.name}</span>
                </a>
              ))}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar() {
  const { totalXP, level, coins, currentStreak, streakFreezes, activeXPBoost, displayName } = useStore();
  const { data: session } = useSession();
  const [xpBoostActive, setXpBoostActive] = useState(false);

  useEffect(() => {
    setXpBoostActive(!!activeXPBoost && new Date(activeXPBoost) > new Date());
  }, [activeXPBoost]);

  // Determine streak status: active today, at-risk with freeze, or at-risk no freeze
  const [streakStatus, setStreakStatus] = useState<StreakStatus | undefined>(undefined);

  useEffect(() => {
    const lastDate = localStorage.getItem("lastStreakDate") ?? "";
    const today = new Date().toISOString().slice(0, 10);
    if (lastDate === today) setStreakStatus("active");
    else if (streakFreezes > 0) setStreakStatus("at-risk");
    else if (currentStreak > 0) setStreakStatus("no-freeze");
    else setStreakStatus(undefined);
  }, [streakFreezes, currentStreak]);

  // Resolve display name: Google session name takes priority, then store displayName
  const firstName =
    session?.user?.name?.split(" ")[0] ??
    (displayName ? displayName.split(" ")[0] : null);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/70 bg-background/85 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <MobileNav />
        <a
          href="/app/dashboard"
          className="flex items-center gap-2 shrink-0"
        >
          <Image src="/logo-mark.png" alt="Guru Sishya" width={32} height={32} className="size-8 rounded-lg" priority />
          <span className="font-heading text-lg font-bold text-saffron tracking-wider hidden sm:inline">GURU SISHYA</span>
        </a>
      </div>

      {/* Cmd+K shortcut pill — visible on md+ screens */}
      <button
        type="button"
        aria-label="Open command palette"
        onClick={() =>
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
          )
        }
        className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-all duration-150 hover:border-saffron/40 hover:text-foreground hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>Search</span>
        <kbd className="rounded border border-border/50 bg-muted px-1 py-0.5 font-mono text-[10px]">⌘K</kbd>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-4" data-tour="topbar-stats">
        <StreakFlame streak={currentStreak} size="sm" freezeCount={streakFreezes} status={streakStatus} />
        {xpBoostActive && (
          <span
            title="XP Boost active — 1.5x XP for the next hour"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-saffron/20 px-2 py-0.5 text-xs font-semibold text-saffron"
          >
            <Zap className="size-3 fill-saffron" />
            1.5x XP
          </span>
        )}
        <div className="hidden sm:block">
          <XPBar totalXP={totalXP} level={level} />
        </div>
        {/* Coin display: hidden on mobile, visible sm+ */}
        <div className="hidden sm:flex items-center gap-1 text-sm">
          <svg className="size-3.5 text-gold" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="10" opacity="0.2" />
            <circle cx="12" cy="12" r="7" />
            <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" opacity="0.9">G</text>
          </svg>
          <span className="font-medium tabular-nums text-sm text-gold">{coins.toLocaleString()}</span>
        </div>
        <LevelBadge level={level} size="sm" className="hidden sm:inline-flex" />
        <UserMenu />
      </div>
    </header>
  );
}
