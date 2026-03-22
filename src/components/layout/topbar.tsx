"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Menu } from "lucide-react";
import { useStore } from "@/lib/store";
import { StreakFlame } from "@/components/gamification/streak-flame";
import { XPBar } from "@/components/gamification/xp-bar";
import { CoinDisplay } from "@/components/gamification/coin-display";
import { LevelBadge } from "@/components/gamification/level-badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

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
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());

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
        <LevelBadge level={level} size="sm" />
      </div>
    </header>
  );
}
