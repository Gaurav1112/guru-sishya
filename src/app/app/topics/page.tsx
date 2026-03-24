"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { db } from "@/lib/db";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";
import { TopicInput } from "@/components/topic-input";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/page-transition";

// ── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string; badge: string; tab: string }
> = {
  "System Design": {
    label: "System Design Fundamentals",
    icon: "📐",
    color: "border-saffron/40 bg-saffron/10 text-saffron",
    badge: "bg-saffron/20 text-saffron border-saffron/30",
    tab: "sd",
  },
  "System Design Cases": {
    label: "System Design Case Studies",
    icon: "🏗️",
    color: "border-teal/40 bg-teal/10 text-teal",
    badge: "bg-teal/20 text-teal border-teal/30",
    tab: "cases",
  },
  "Data Structures": {
    label: "Data Structures & Algorithms",
    icon: "🧮",
    color: "border-indigo/40 bg-indigo/10 text-indigo",
    badge: "bg-indigo/20 text-indigo border-indigo/30",
    tab: "dsalgo",
  },
  Algorithms: {
    label: "Data Structures & Algorithms",
    icon: "🧮",
    color: "border-indigo/40 bg-indigo/10 text-indigo",
    badge: "bg-indigo/20 text-indigo border-indigo/30",
    tab: "dsalgo",
  },
  "Programming Languages": {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  Frontend: {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  Backend: {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  Databases: {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  "Software Engineering": {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  "Computer Science Fundamentals": {
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40 bg-gold/10 text-gold",
    badge: "bg-gold/20 text-gold border-gold/30",
    tab: "cs",
  },
  "Distributed Systems": {
    label: "DevOps & Infrastructure",
    icon: "🔧",
    color: "border-orange-400/40 bg-orange-400/10 text-orange-400",
    badge: "bg-orange-400/20 text-orange-400 border-orange-400/30",
    tab: "devops",
  },
  "Cloud Computing": {
    label: "DevOps & Infrastructure",
    icon: "☁️",
    color: "border-orange-400/40 bg-orange-400/10 text-orange-400",
    badge: "bg-orange-400/20 text-orange-400 border-orange-400/30",
    tab: "devops",
  },
  "DevOps & Containers": {
    label: "DevOps & Infrastructure",
    icon: "🐳",
    color: "border-orange-400/40 bg-orange-400/10 text-orange-400",
    badge: "bg-orange-400/20 text-orange-400 border-orange-400/30",
    tab: "devops",
  },
};

// Map raw categories to a canonical tab ID
function getTabId(category: string): string {
  return CATEGORY_META[category]?.tab ?? "sd";
}

// Canonical display groups (ordered)
const GROUPS = [
  {
    tab: "sd",
    label: "System Design Fundamentals",
    icon: "📐",
    color: "border-saffron/40",
    headerColor: "text-saffron",
  },
  {
    tab: "cases",
    label: "System Design Case Studies",
    icon: "🏗️",
    color: "border-teal/40",
    headerColor: "text-teal",
  },
  {
    tab: "dsalgo",
    label: "Data Structures & Algorithms",
    icon: "🧮",
    color: "border-indigo/40",
    headerColor: "text-indigo",
  },
  {
    tab: "cs",
    label: "Core CS & Languages",
    icon: "💻",
    color: "border-gold/40",
    headerColor: "text-gold",
  },
  {
    tab: "devops",
    label: "DevOps & Infrastructure",
    icon: "🔧",
    color: "border-orange-400/40",
    headerColor: "text-orange-400",
  },
];

// ── Animation variants ────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 16 } as const,
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: "easeOut" as const },
  }),
} satisfies Record<string, unknown>;

// ── Topic Card ───────────────────────────────────────────────────────────────

function TopicCard({ content, index }: { content: TopicContent; index: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const meta = CATEGORY_META[content.category] ?? CATEGORY_META["System Design"];

  const quizCount = content.quizBank?.length ?? 0;
  const planSessions = content.plan?.sessions?.length ?? 0;
  const hasCheatSheet = Boolean(content.cheatSheet);
  const hasResources = Array.isArray(content.resources)
    ? content.resources.length > 0
    : Boolean((content.resources as unknown as { categories?: unknown[] })?.categories?.length);
  const hasLadder = (content.ladder?.levels?.length ?? 0) > 0;

  async function handleClick() {
    setLoading(true);
    try {
      // Find or create topic in Dexie
      const existing = await db.topics
        .where("name")
        .equalsIgnoreCase(content.topic)
        .first();
      if (existing?.id) {
        router.push(`/app/topic/${existing.id}`);
      } else {
        const id = await db.topics.add({
          name: content.topic,
          category: content.category,
          createdAt: new Date(),
        });
        router.push(`/app/topic/${id}`);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={loading}
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className="group text-left rounded-xl border border-border/50 bg-surface hover:bg-surface-hover hover:border-border hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-shadow duration-200 p-4 flex flex-col gap-2 disabled:opacity-60 cursor-pointer"
    >
      {/* Topic name */}
      <p className="font-semibold text-sm leading-snug group-hover:text-foreground transition-colors">
        {loading ? "Opening..." : content.topic}
      </p>

      {/* Category badge */}
      <span
        className={`inline-flex self-start items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}
      >
        {content.category}
      </span>

      {/* Stats row */}
      <div className="flex items-center gap-3 mt-auto pt-1">
        <span className="text-xs text-muted-foreground tabular-nums">
          {quizCount} questions
        </span>
        {planSessions > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {planSessions} sessions
          </span>
        )}
      </div>

      {/* Content availability icons */}
      <div className="flex items-center gap-1.5">
        {planSessions > 0 && (
          <span title="Learning Plan" className="text-xs opacity-70">📋</span>
        )}
        {hasCheatSheet && (
          <span title="Cheat Sheet" className="text-xs opacity-70">📄</span>
        )}
        {quizCount > 0 && (
          <span title="Quiz Bank" className="text-xs opacity-70">🧠</span>
        )}
        {hasLadder && (
          <span title="Learning Ladder" className="text-xs opacity-70">🪜</span>
        )}
        {hasResources && (
          <span title="Resources" className="text-xs opacity-70">🔍</span>
        )}
      </div>
    </motion.button>
  );
}

// ── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  group,
  topics,
  indexOffset,
}: {
  group: (typeof GROUPS)[number];
  topics: TopicContent[];
  indexOffset: number;
}) {
  if (topics.length === 0) return null;
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{group.icon}</span>
        <h2 className={`font-heading text-lg font-bold ${group.headerColor}`}>
          {group.label}
        </h2>
        <span className="rounded-full bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground tabular-nums">
          {topics.length}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {topics.map((t, i) => (
          <TopicCard key={t.topic} content={t} index={indexOffset + i} />
        ))}
      </div>
    </section>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TopicsPage() {
  const [allContent, setAllContent] = useState<TopicContent[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadAllContent()
      .then(setAllContent)
      .catch(() => {})
      .finally(() => setContentLoading(false));
  }, []);

  // Deduplicate by topic name (some files have dupes)
  const dedupedContent = useMemo(() => {
    const seen = new Set<string>();
    const out: TopicContent[] = [];
    for (const item of allContent) {
      const key = item.topic.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    return out;
  }, [allContent]);

  // Apply search filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dedupedContent;
    return dedupedContent.filter(
      (t) =>
        t.topic.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [dedupedContent, search]);

  // Apply tab filter
  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return filtered;
    return filtered.filter((t) => getTabId(t.category) === activeTab);
  }, [filtered, activeTab]);

  // Group by canonical tab
  const grouped = useMemo(() => {
    const map: Record<string, TopicContent[]> = {};
    for (const g of GROUPS) map[g.tab] = [];
    for (const t of tabFiltered) {
      const tab = getTabId(t.category);
      if (map[tab]) map[tab].push(t);
      else map[tab] = [t];
    }
    return map;
  }, [tabFiltered]);

  const totalTopics = dedupedContent.length;
  const totalQuestions = dedupedContent.reduce(
    (acc, t) => acc + (t.quizBank?.length ?? 0),
    0
  );

  const TABS = [
    { id: "all", label: "All Topics", count: dedupedContent.length },
    {
      id: "sd",
      label: "System Design",
      count: dedupedContent.filter((t) => getTabId(t.category) === "sd").length,
    },
    {
      id: "cases",
      label: "Case Studies",
      count: dedupedContent.filter((t) => getTabId(t.category) === "cases").length,
    },
    {
      id: "dsalgo",
      label: "DS & Algo",
      count: dedupedContent.filter((t) => getTabId(t.category) === "dsalgo").length,
    },
    {
      id: "cs",
      label: "Core CS",
      count: dedupedContent.filter((t) => getTabId(t.category) === "cs").length,
    },
    {
      id: "devops",
      label: "DevOps & Infra",
      count: dedupedContent.filter((t) => getTabId(t.category) === "devops").length,
    },
  ];

  // Compute per-group index offsets so stagger indices are globally unique
  const groupOffsets = useMemo(() => {
    const offsets: Record<string, number> = {};
    let running = 0;
    for (const g of GROUPS) {
      offsets[g.tab] = running;
      running += grouped[g.tab]?.length ?? 0;
    }
    return offsets;
  }, [grouped]);

  return (
    <PageTransition>
      <div className="space-y-8">
      {/* Stats Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-teal/5 p-6"
      >
        <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-1">
          Interview Prep Hub
        </p>
        <h1 className="font-heading text-2xl font-bold mb-3">
          Browse All Topics
        </h1>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-heading text-saffron tabular-nums">
              {contentLoading ? (
                <span className="inline-block h-7 w-8 animate-shimmer rounded bg-saffron/20" />
              ) : totalTopics}
            </span>
            <span className="text-sm text-muted-foreground">Topics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-heading text-gold tabular-nums">
              {contentLoading ? (
                <span className="inline-block h-7 w-14 animate-shimmer rounded bg-gold/20" />
              ) : totalQuestions.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">Quiz Questions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-heading text-teal">
              6
            </span>
            <span className="text-sm text-muted-foreground">FAANG Companies</span>
          </div>
        </div>
      </motion.div>

      {/* Search + Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            🔍
          </span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search topics..."
            className="pl-8 bg-surface"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-saffron text-white"
                  : "bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-border/50"
              }`}
            >
              {tab.label}
              {!contentLoading && (
                <span className="ml-1 tabular-nums opacity-70">
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Category Sections */}
      {contentLoading ? (
        <div className="space-y-10">
          {[12, 8, 10, 6].map((count, gi) => (
            <section key={gi}>
              <div className="h-6 w-48 rounded bg-muted/40 animate-shimmer mb-4" />
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-border/30 bg-surface animate-shimmer" />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : tabFiltered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No topics match &quot;{search}&quot;
        </div>
      ) : (
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <CategorySection
              key={group.tab}
              group={group}
              topics={grouped[group.tab] ?? []}
              indexOffset={groupOffsets[group.tab] ?? 0}
            />
          ))}
        </div>
      )}

      {/* Custom Topic Input */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-xl border border-border/40 bg-surface/50 p-6"
      >
        <h2 className="font-heading text-base font-semibold mb-1">
          Have a custom topic?
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Enter any topic to create a personalized learning hub with your AI provider.
        </p>
        <TopicInput />
      </motion.div>
    </div>
    </PageTransition>
  );
}
