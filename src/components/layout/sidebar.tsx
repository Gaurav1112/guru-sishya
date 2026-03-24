"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { Crown, ShieldCheck } from "lucide-react";
import { useSession } from "next-auth/react";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { ADMIN_EMAIL } from "@/lib/stores/premium-slice";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/app/review", label: "Review", icon: "🔁" },
  { href: "/app/questions", label: "Questions", icon: "📝" },
  { href: "/app/interview", label: "Mock Interview", icon: "🎤" },
  { href: "/app/topics", label: "Topics", icon: "📚" },
  { href: "/app/roadmap", label: "Roadmap", icon: "🗺️" },
  { href: "/app/playground", label: "Playground", icon: "⚡" },
  { href: "/app/shop", label: "Shop", icon: "🛒" },
  { href: "/app/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/app/profile", label: "Profile", icon: "👤" },
  { href: "/app/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isPremium, premiumUntil } = useStore();
  const { data: session } = useSession();
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());

  const isAdmin =
    session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Live count of flashcards due today
  const dueCount = useLiveQuery(async () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return db.flashcards.where("nextReviewAt").belowOrEqual(today).count();
  }, []);

  const isActivePro =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border/50 bg-background">
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", pathname === item.href ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
            <span>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.href === "/app/review" && dueCount !== undefined && dueCount > 0 && (
              <span className="flex items-center justify-center rounded-full bg-saffron text-background text-[10px] font-bold min-w-[18px] h-[18px] px-1">
                {dueCount > 99 ? "99+" : dueCount}
              </span>
            )}
          </Link>
        ))}

        {/* Admin console link — only visible for admin */}
        {isAdmin && (
          <Link
            href="/app/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === "/app/admin"
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
