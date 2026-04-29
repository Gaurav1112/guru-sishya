"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Crown, ShieldCheck, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ADMIN_EMAIL } from "@/lib/stores/premium-slice";

// ── Active challenge count from localStorage ──────────────────────────────────

function useActiveChallengeCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function readCount() {
      try {
        const raw = localStorage.getItem("gs-challenges");
        if (!raw) { setCount(0); return; }
        const all = JSON.parse(raw) as Array<{ status: string; endDate: string }>;
        const now = Date.now();
        const active = all.filter(
          (c) => c.status === "active" && new Date(c.endDate).getTime() > now
        ).length;
        setCount(active);
      } catch {
        setCount(0);
      }
    }

    readCount();

    // Re-read when storage changes (e.g. a new challenge is created in another tab)
    window.addEventListener("storage", readCount);
    return () => window.removeEventListener("storage", readCount);
  }, []);

  return count;
}

const primaryNavItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/app/topics", label: "Topics", icon: "📚" },
  { href: "/app/questions", label: "Questions", icon: "📝" },
  { href: "/app/interview", label: "Mock Interview", icon: "🎤" },
  { href: "/app/review", label: "Review", icon: "🔁" },
];

const moreNavItems = [
  { href: "/app/playground", label: "Playground", icon: "⚡" },
  { href: "/app/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/app/notes", label: "My Notes", icon: "📓" },
  { href: "/app/challenges", label: "Challenges", icon: "⚔️" },
  { href: "/app/saved", label: "Saved Questions", icon: "🔖" },
  { href: "/app/revision", label: "Revision", icon: "📖" },
  { href: "/app/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/app/shop", label: "Shop", icon: "🛒" },
  { href: "/app/profile", label: "Profile", icon: "👤" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isPremium, premiumUntil } = useStore();
  const { data: session } = useSession();
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());
  const activeChallenges = useActiveChallengeCount();
  const [showMore, setShowMore] = useState(false);

  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Live count of flashcards due today
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

  const isActivePro =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  // Auto-expand "More" if the active path lives there
  useEffect(() => {
    const isMoreActive = moreNavItems.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
    if (isMoreActive) setShowMore(true);
  }, [pathname]);

  function renderNavLink(item: { href: string; label: string; icon: string }) {
    const isActive =
      pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-surface text-foreground"
            : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
        )}
      >
        {isActive && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute left-0 top-0 bottom-0 w-0.5 bg-saffron rounded-r"
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
          />
        )}
        <span>{item.icon}</span>
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
        {item.href === "/app/challenges" && activeChallenges > 0 && (
          <span className="flex items-center justify-center rounded-full bg-saffron text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1">
            {activeChallenges}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border/50 bg-background">
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {primaryNavItems.map(renderNavLink)}

        {/* Collapsible "More" section */}
        <button
          onClick={() => setShowMore(!showMore)}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-surface-hover"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              showMore && "rotate-180"
            )}
          />
          <span>More</span>
          {/* Badge total for hidden items */}
          {!showMore && (activeChallenges > 0 || (revisionCount !== undefined && revisionCount > 0)) && (
            <span className="ml-auto flex items-center justify-center rounded-full bg-amber-500 text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1">
              {(activeChallenges) + (revisionCount ?? 0) > 99
                ? "99+"
                : (activeChallenges) + (revisionCount ?? 0)}
            </span>
          )}
        </button>

        {showMore && moreNavItems.map(renderNavLink)}

        {/* Admin console link — only visible for admin */}
        {isAdmin && (
          <Link
            href="/app/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/app/admin")
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-indigo-400/80 hover:bg-indigo-500/10 hover:text-indigo-300"
            )}
          >
            <ShieldCheck className="size-4 shrink-0" />
            <span className="flex-1">Admin Console</span>
          </Link>
        )}

        {/* Pro upgrade / status link */}
        {isActivePro ? (
          <Link
            href="/app/pricing"
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
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              pathname === "/app/pricing"
                ? "bg-saffron/20 text-saffron"
                : "text-saffron hover:bg-saffron/10"
            )}
          >
            <Crown className="size-4 shrink-0" />
            <span className="flex-1">Upgrade to Pro</span>
          </Link>
        )}

        {topics && topics.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-3 text-xs font-medium tracking-wider text-muted-foreground">RECENT TOPICS</div>
            {topics.map((topic) => (
              <Link key={topic.id} href={`/app/topic/${topic.id}`} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors", pathname === `/app/topic/${topic.id}` ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
                <span className="h-2 w-2 rounded-full bg-saffron/40" /><span className="truncate">{topic.name}</span>
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
