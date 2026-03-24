"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Crown, Menu, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { useStore } from "@/lib/store";
import { ADMIN_EMAIL } from "@/lib/stores/premium-slice";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { CoinDisplay } from "@/components/gamification/coin-display";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/user-menu";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/app/topics", label: "Topics", icon: "📚" },
  { href: "/app/shop", label: "Shop", icon: "🛒" },
  { href: "/app/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/app/profile", label: "Profile", icon: "👤" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isPremium, premiumUntil } = useStore();
  const { data: session } = useSession();
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());
  const isActivePro =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();
  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-surface text-foreground"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <span>{item.icon}</span>{item.label}
            </Link>
          ))}
          {/* Admin console link — only visible for admin */}
          {isAdmin && (
            <Link
              href="/app/admin"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                pathname === "/app/admin"
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "text-indigo-400/80 hover:bg-indigo-500/10 hover:text-indigo-300"
              )}
            >
              <ShieldCheck className="size-4 shrink-0" />
              Admin Console
            </Link>
          )}

          {/* Pro upgrade / status link */}
          {isActivePro ? (
            <Link
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
            </Link>
          ) : (
            <Link
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
            </Link>
          )}

          {topics && topics.length > 0 && (
            <>
              <div className="mt-6 mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground">RECENT TOPICS</div>
              {topics.map((topic) => (
                <Link
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
                </Link>
              ))}
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function Topbar() {
  const { totalXP, level, coins, currentStreak, activeXPBoost } = useStore();
  const xpBoostActive =
    !!activeXPBoost && new Date(activeXPBoost) > new Date();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <MobileNav />
        <Link
          href="/app/dashboard"
          className="font-heading text-lg font-bold text-saffron tracking-wider shrink-0"
        >
          GURU SISHYA
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <StreakFlame streak={currentStreak} size="sm" />
        {xpBoostActive && (
          <span
            title="XP Boost active — 1.5x XP for the next hour"
            className="hidden sm:inline-flex items-center gap-1 rounded-full bg-saffron/20 px-2 py-0.5 text-xs font-semibold text-saffron"
          >
            ⚡ 1.5x XP
          </span>
        )}
        <div className="hidden sm:block">
          <XPBar totalXP={totalXP} level={level} />
        </div>
        <CoinDisplay coins={coins} />
        <LevelBadge level={level} size="sm" className="hidden sm:inline-flex" />
        <UserMenu />
      </div>
    </header>
  );
}
