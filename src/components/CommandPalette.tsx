"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Command } from "cmdk";

// Static topic list — loaded once, never from Dexie (too slow for search)
const QUICK_LINKS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠", href: "/app/dashboard" },
  { id: "topics", label: "All Topics", icon: "📚", href: "/app/topics" },
  { id: "interview", label: "Mock Interview", icon: "🎤", href: "/app/interview" },
  { id: "quests", label: "Daily Quests", icon: "⚡", href: "/app/dashboard#quests" },
];

// 30 most common topics hardcoded for instant search
const FEATURED_TOPICS = [
  { id: "1", name: "Load Balancing", category: "System Design" },
  { id: "2", name: "Caching", category: "System Design" },
  { id: "3", name: "Database Sharding", category: "System Design" },
  { id: "4", name: "Arrays & Strings", category: "Data Structures" },
  { id: "5", name: "Linked Lists", category: "Data Structures" },
  { id: "6", name: "Trees & BST", category: "Data Structures" },
  { id: "7", name: "Graphs", category: "Algorithms" },
  { id: "8", name: "Dynamic Programming", category: "Algorithms" },
  { id: "9", name: "System Design Fundamentals", category: "System Design" },
  { id: "10", name: "Design: URL Shortener (TinyURL)", category: "System Design Cases" },
  { id: "11", name: "Design: Chat System (WhatsApp/Slack)", category: "System Design Cases" },
  { id: "12", name: "Design: Netflix/YouTube", category: "System Design Cases" },
  { id: "13", name: "JavaScript Fundamentals", category: "Programming Languages" },
  { id: "14", name: "TypeScript", category: "Programming Languages" },
  { id: "15", name: "React", category: "Frontend" },
  { id: "16", name: "SQL & Databases", category: "Databases" },
  { id: "17", name: "Sorting & Searching", category: "Algorithms" },
  { id: "18", name: "Hash Tables", category: "Data Structures" },
  { id: "19", name: "Stacks & Queues", category: "Data Structures" },
  { id: "20", name: "System Design: Message Queues", category: "System Design" },
  { id: "21", name: "Kubernetes & Docker", category: "DevOps" },
  { id: "22", name: "Microservices", category: "Distributed Systems" },
  { id: "23", name: "CAP Theorem", category: "Distributed Systems" },
  { id: "24", name: "API Design", category: "System Design" },
  { id: "25", name: "OS Fundamentals", category: "Computer Science Fundamentals" },
  { id: "26", name: "Networking Basics", category: "Computer Science Fundamentals" },
  { id: "27", name: "Behavioral Interview Prep", category: "Behavioral" },
  { id: "28", name: "STAR Method", category: "Behavioral" },
  { id: "29", name: "Heaps & Priority Queues", category: "Data Structures" },
  { id: "30", name: "Recursion & Backtracking", category: "Algorithms" },
];

const CATEGORY_ICONS: Record<string, string> = {
  "System Design": "📐",
  "System Design Cases": "🏗️",
  "Data Structures": "🧮",
  Algorithms: "🧮",
  "Programming Languages": "💻",
  Frontend: "💻",
  Backend: "💻",
  Databases: "💻",
  "Distributed Systems": "🔧",
  "Computer Science Fundamentals": "💻",
  Behavioral: "🧠",
  DevOps: "🔧",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    window.location.href = href;
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[20vh] z-50 w-full max-w-lg -translate-x-1/2 px-4"
          >
            <Command
              className="rounded-xl border border-border/70 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_24px_64px_rgba(0,0,0,0.7),0_0_80px_rgba(245,158,11,0.06)]" style={{ background: "rgba(17,17,24,0.85)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}
              label="Command palette"
            >
              <div className="flex items-center border-b border-border/40 px-4">
                <svg
                  className="mr-3 h-4 w-4 shrink-0 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Command.Input
                  placeholder="Search topics, go to..."
                  className="h-12 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                />
                <kbd className="ml-2 hidden rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                  No results found.
                </Command.Empty>

                <Command.Group
                  heading="Quick Links"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground/60 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {QUICK_LINKS.map((link) => (
                    <Command.Item
                      key={link.id}
                      value={link.label}
                      onSelect={() => navigate(link.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-saffron/10 aria-selected:text-saffron"
                    >
                      <span className="text-base">{link.icon}</span>
                      {link.label}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border/30" />

                <Command.Group
                  heading="Topics"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground/60 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider"
                >
                  {FEATURED_TOPICS.map((topic) => (
                    <Command.Item
                      key={topic.id}
                      value={`${topic.name} ${topic.category}`}
                      onSelect={() => navigate(`/app/topic/${topic.id}`)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm aria-selected:bg-saffron/10"
                    >
                      <span className="text-base shrink-0">
                        {CATEGORY_ICONS[topic.category] ?? "📝"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-foreground">{topic.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground/60">{topic.category}</span>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>

              <div className="border-t border-border/30 px-4 py-2 flex items-center gap-3 text-[10px] text-muted-foreground/50">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
