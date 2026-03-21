"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
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

export function Sidebar() {
  const pathname = usePathname();
  const topics = useLiveQuery(() => db.topics.orderBy("createdAt").reverse().limit(10).toArray());
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border/50 bg-background">
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors", pathname === item.href ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
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
