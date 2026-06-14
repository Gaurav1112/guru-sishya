"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Target } from "lucide-react";
import { db } from "@/lib/db";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";
import {
  getAllCompanyPaths,
  getAccentColor,
  getAccentBg,
  getAccentBorder,
  type CompanyPath,
} from "@/lib/content/company-paths";

// ── Roadmap Node Definition ───────────────────────────────────────────────────

interface RoadmapNode {
  id: string;
  label: string;
  category: string;
  color: string;
  glowColor: string;
  borderColor: string;
  description: string;
  row: number;
  col: number;
  connects?: string[];
  isRecommended?: boolean;
}

// ── Static roadmap graph — System Design Interview path ───────────────────────

const ROADMAP_NODES: RoadmapNode[] = [
  {
    id: "interview-framework",
    label: "System Design Interview Framework",
    category: "Foundation",
    color: "bg-saffron/15 border-saffron/60",
    glowColor: "shadow-saffron/30",
    borderColor: "border-saffron",
    description: "The meta-skill: how to approach any system design problem",
    row: 0,
    col: 2,
    connects: ["estimation"],
    isRecommended: true,
  },
  {
    id: "estimation",
    label: "Back-of-Envelope Estimation",
    category: "Foundation",
    color: "bg-saffron/15 border-saffron/60",
    glowColor: "shadow-saffron/30",
    borderColor: "border-saffron",
    description: "Estimate scale, storage, and bandwidth confidently",
    row: 1,
    col: 2,
    connects: ["load-balancing", "caching", "database-design", "message-queues"],
    isRecommended: true,
  },
  {
    id: "load-balancing",
    label: "Load Balancing",
    category: "System Design",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Distribute traffic across servers for reliability",
    row: 2,
    col: 0,
    connects: ["system-design-cases"],
    isRecommended: true,
  },
  {
    id: "caching",
    label: "Caching",
    category: "System Design",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Speed up reads with Redis, CDN, and cache strategies",
    row: 2,
    col: 1,
    connects: ["system-design-cases"],
    isRecommended: true,
  },
  {
    id: "database-design",
    label: "Database Design",
    category: "System Design",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "SQL vs NoSQL, sharding, replication, indexing",
    row: 2,
    col: 2,
    connects: ["system-design-cases"],
    isRecommended: true,
  },
  {
    id: "message-queues",
    label: "Message Queues",
    category: "System Design",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Kafka, RabbitMQ, async processing patterns",
    row: 2,
    col: 3,
    connects: ["microservices"],
    isRecommended: false,
  },
  {
    id: "system-design-cases",
    label: "System Design Cases",
    category: "Case Studies",
    color: "bg-indigo/15 border-indigo/60",
    glowColor: "shadow-indigo/30",
    borderColor: "border-indigo",
    description: "Design Twitter, YouTube, Uber, and 20+ real systems",
    row: 3,
    col: 1,
    connects: ["mock-interviews"],
    isRecommended: true,
  },
  {
    id: "microservices",
    label: "Microservices",
    category: "System Design",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Service decomposition, APIs, and distributed systems",
    row: 3,
    col: 3,
    connects: ["mock-interviews"],
    isRecommended: false,
  },
  {
    id: "mock-interviews",
    label: "Mock Interviews",
    category: "Practice",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Full timed practice rounds with AI feedback",
    row: 4,
    col: 2,
    isRecommended: true,
  },
];

const DSA_NODES: RoadmapNode[] = [
  // ── Core DS&A (linear path) ─────────────────────────────────────────────
  {
    id: "arrays-strings",
    label: "Arrays & Strings",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Foundation of coding interviews",
    row: 0,
    col: 0,
    connects: ["linked-lists"],
    isRecommended: true,
  },
  {
    id: "linked-lists",
    label: "Linked Lists",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Singly, doubly, cycle detection, reversal",
    row: 1,
    col: 0,
    connects: ["stacks-queues"],
  },
  {
    id: "stacks-queues",
    label: "Stacks & Queues",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "LIFO, FIFO, monotonic stacks, deque patterns",
    row: 2,
    col: 0,
    connects: ["hash-tables"],
  },
  {
    id: "hash-tables",
    label: "Hash Tables",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Hash maps, sets, collision handling, two-sum patterns",
    row: 3,
    col: 0,
    connects: ["sorting-searching"],
  },
  {
    id: "sorting-searching",
    label: "Sorting & Searching",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Binary search, quicksort, mergesort, comparators",
    row: 4,
    col: 0,
    connects: ["trees-graphs"],
    isRecommended: true,
  },
  {
    id: "trees-graphs",
    label: "Trees & Graphs",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "BFS, DFS, traversals, shortest paths",
    row: 5,
    col: 0,
    connects: ["heaps-priority-queues"],
    isRecommended: true,
  },
  {
    id: "heaps-priority-queues",
    label: "Heaps & Priority Queues",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Min/max heaps, top-K, merge K sorted lists",
    row: 6,
    col: 0,
    connects: ["recursion-backtracking"],
  },
  {
    id: "recursion-backtracking",
    label: "Recursion & Backtracking",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Subsets, permutations, N-Queens, constraint solving",
    row: 7,
    col: 0,
    connects: ["dynamic-programming"],
  },
  {
    id: "dynamic-programming",
    label: "Dynamic Programming",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Memoization, tabulation, classic patterns",
    row: 8,
    col: 0,
    connects: ["dsa-patterns"],
    isRecommended: true,
  },
  {
    id: "dsa-patterns",
    label: "DSA Coding Patterns",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "Sliding window, two pointers, fast & slow, intervals",
    row: 9,
    col: 0,
    connects: ["greedy-algorithms"],
    isRecommended: true,
  },
  // ── Advanced DS&A ──────────────────────────────────────────────────────
  {
    id: "greedy-algorithms",
    label: "Greedy Algorithms",
    category: "Advanced DS&A",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Activity selection, Huffman coding, interval scheduling",
    row: 10,
    col: 0,
    connects: ["string-algorithms"],
  },
  {
    id: "string-algorithms",
    label: "String Algorithms",
    category: "Advanced DS&A",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "KMP, Rabin-Karp, Z-algorithm, suffix arrays",
    row: 11,
    col: 0,
    connects: ["advanced-graphs"],
  },
  {
    id: "advanced-graphs",
    label: "Advanced Graph Algorithms",
    category: "Advanced DS&A",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Dijkstra, Bellman-Ford, topological sort, MST",
    row: 12,
    col: 0,
    connects: ["segment-trees"],
  },
  {
    id: "segment-trees",
    label: "Segment Trees",
    category: "Advanced DS&A",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Range queries, lazy propagation, interval updates",
    row: 13,
    col: 0,
    connects: ["fenwick-tree"],
  },
  {
    id: "fenwick-tree",
    label: "Fenwick Tree (BIT)",
    category: "Advanced DS&A",
    color: "bg-teal/15 border-teal/60",
    glowColor: "shadow-teal/30",
    borderColor: "border-teal",
    description: "Binary indexed tree for prefix sums and updates",
    row: 14,
    col: 0,
  },
];

// ── Category color legend ─────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; dot: string }> = {
  Foundation: { label: "Foundation", dot: "bg-saffron" },
  "System Design": { label: "System Design", dot: "bg-teal" },
  "Case Studies": { label: "Case Studies", dot: "bg-indigo" },
  Practice: { label: "Practice", dot: "bg-gold" },
  "DS&A": { label: "DS & Algorithms", dot: "bg-gold" },
  "Advanced DS&A": { label: "Advanced DS&A", dot: "bg-teal" },
};

// ── Topic lookup helper ───────────────────────────────────────────────────────

function topicKeywords(nodeId: string): string[] {
  const map: Record<string, string[]> = {
    "interview-framework": ["system design interview", "framework", "interview"],
    estimation: ["estimation", "back-of-envelope", "capacity"],
    "load-balancing": ["load balancing", "load balancer"],
    caching: ["caching", "cache", "redis"],
    "database-design": ["database", "db design", "sql", "nosql"],
    "message-queues": ["message queue", "kafka", "rabbitmq", "pub/sub"],
    "system-design-cases": ["system design cases", "design twitter", "design youtube"],
    microservices: ["microservices", "microservice"],
    "mock-interviews": ["mock interview", "interview practice"],
    "arrays-strings": ["arrays", "strings", "array"],
    "linked-lists": ["linked lists", "linked list"],
    "stacks-queues": ["stacks", "queues", "stack", "queue"],
    "hash-tables": ["hash tables", "hash table", "hash map"],
    "sorting-searching": ["sorting", "searching", "binary search"],
    "trees-graphs": ["trees", "graphs", "binary tree", "graph"],
    "heaps-priority-queues": ["heaps", "priority queues", "heap", "priority queue"],
    "recursion-backtracking": ["recursion", "backtracking"],
    "dynamic-programming": ["dynamic programming", "dp"],
    "dsa-patterns": ["dsa patterns", "dsa coding patterns", "coding patterns"],
    "greedy-algorithms": ["greedy algorithms", "greedy"],
    "string-algorithms": ["string algorithms"],
    "advanced-graphs": ["advanced graph", "dijkstra", "bellman"],
    "segment-trees": ["segment trees", "segment tree"],
    "fenwick-tree": ["fenwick tree", "binary indexed tree", "fenwick"],
  };
  return map[nodeId] ?? [nodeId.replace(/-/g, " ")];
}

// ── Node Card Component ───────────────────────────────────────────────────────

function NodeCard({
  node,
  completed,
  onNavigate,
}: {
  node: RoadmapNode;
  completed: boolean;
  onNavigate: (nodeId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const completedStyle = completed
    ? "border-green-500/70 bg-green-500/10 shadow-lg shadow-green-500/20"
    : node.color;

  return (
    <button
      type="button"
      onClick={() => onNavigate(node.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={[
        "relative rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 w-full",
        "focus:outline-none focus:ring-2 focus:ring-saffron/50",
        completedStyle,
        hovered ? `shadow-lg ${node.glowColor} scale-105` : "",
        node.isRecommended && !completed ? "ring-1 ring-saffron/30" : "",
      ].join(" ")}
    >
      {node.isRecommended && !completed && (
        <span className="absolute -top-2 -right-2 rounded-full bg-saffron px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
          REC
        </span>
      )}
      {completed && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">
          &#10003;
        </span>
      )}
      <p className="text-xs font-semibold leading-tight text-foreground">
        {node.label}
      </p>
      {hovered && (
        <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
          {node.description}
        </p>
      )}
      <span className="mt-1.5 inline-block rounded-full bg-black/20 px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
        {node.category}
      </span>
    </button>
  );
}

// ── Arrow SVG connector ───────────────────────────────────────────────────────

function DownArrow({ completed }: { completed?: boolean }) {
  return (
    <div className="flex justify-center py-1">
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
        <line
          x1="8" y1="0" x2="8" y2="14"
          stroke={completed ? "#22c55e" : "hsl(240 10% 35%)"}
          strokeWidth="2"
          strokeDasharray={completed ? "0" : "4 2"}
        />
        <polygon
          points="8,20 3,12 13,12"
          fill={completed ? "#22c55e" : "hsl(240 10% 35%)"}
        />
      </svg>
    </div>
  );
}

function BranchArrow({ count, completed }: { count: number; completed?: boolean }) {
  const color = completed ? "#22c55e" : "hsl(240 10% 35%)";
  const width = count * 160 + (count - 1) * 16;
  const midX = width / 2;

  return (
    <div className="flex justify-center py-1">
      <svg width={width} height={28} viewBox={`0 0 ${width} 28`} fill="none" style={{ maxWidth: "100%" }}>
        <line x1={midX} y1="0" x2={midX} y2="8" stroke={color} strokeWidth="2" />
        <line x1="20" y1="8" x2={width - 20} y2="8" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
        {Array.from({ length: count }).map((_, i) => {
          const x = 20 + i * ((width - 40) / (count - 1));
          return (
            <g key={i}>
              <line x1={x} y1="8" x2={x} y2="22" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
              <polygon points={`${x},28 ${x - 5},20 ${x + 5},20`} fill={color} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Company Path Card ─────────────────────────────────────────────────────────

function CompanyCard({ path, index }: { path: CompanyPath; index: number }) {
  const router = useRouter();
  const textColor = getAccentColor(path);
  const bgColor = getAccentBg(path);
  const borderColor = getAccentBorder(path);

  return (
    <motion.button
      type="button"
      onClick={() => router.push(`/app/roadmap/company/${path.slug}`)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      className={`group text-left rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow duration-200 cursor-pointer`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${borderColor} bg-surface text-sm font-bold ${textColor}`}>
          {path.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm group-hover:text-foreground transition-colors">{path.company}</p>
          <p className="text-xs text-muted-foreground truncate">{path.focus}</p>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
      <div className="flex items-center gap-3 mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" /> {path.duration}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Target className="size-3" /> {path.topics.length} topics
        </span>
      </div>
    </motion.button>
  );
}

// ── Main Roadmap Page ─────────────────────────────────────────────────────────

export default function RoadmapPage() {
  const router = useRouter();
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [allContent, setAllContent] = useState<TopicContent[]>([]);
  const [activeView, setActiveView] = useState<"system-design" | "dsa">("system-design");

  useEffect(() => {
    loadAllContent().then(setAllContent).catch(() => {});
    db.topics.toArray().then((topics) => {
      const names = new Set(topics.map((t) => t.name.toLowerCase().trim()));
      setCompletedTopics(names);
    });
  }, []);

  function isNodeCompleted(nodeId: string): boolean {
    const keywords = topicKeywords(nodeId);
    return keywords.some((kw) =>
      Array.from(completedTopics).some(
        (name) => name.includes(kw) || kw.includes(name)
      )
    );
  }

  async function handleNavigate(nodeId: string) {
    const keywords = topicKeywords(nodeId);
    const match = allContent.find((tc) => {
      const name = tc.topic.toLowerCase().trim();
      return keywords.some((kw) => name.includes(kw) || kw.includes(name));
    });

    if (match) {
      const existing = await db.topics
        .where("name")
        .equalsIgnoreCase(match.topic)
        .first();
      if (existing?.id) {
        router.push(`/app/topic/${existing.id}`);
      } else {
        const id = await db.topics.add({
          name: match.topic,
          category: match.category,
          createdAt: new Date(),
        });
        router.push(`/app/topic/${id}`);
      }
    } else {
      router.push(`/app/topics`);
    }
  }

  const completedCount = ROADMAP_NODES.filter((n) => isNodeCompleted(n.id)).length;
  const totalNodes = ROADMAP_NODES.length;
  const progressPct = Math.round((completedCount / totalNodes) * 100);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-teal/5 to-indigo/5 p-6">
        <p className="text-xs font-medium tracking-widest text-saffron uppercase mb-1">
          Visual Roadmap
        </p>
        <h1 className="font-heading text-2xl font-bold mb-2">
          Interview Preparation Path
        </h1>
        <p className="text-sm text-muted-foreground mb-4">
          Follow the recommended path. Click any node to open that topic. Completed topics glow green.
        </p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-saffron to-teal transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-medium tabular-nums text-muted-foreground">
            {completedCount}/{totalNodes} nodes
          </span>
        </div>
      </div>

      {/* Company Interview Paths */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">
            Company Interview Paths
          </h2>
          <span className="text-xs text-muted-foreground">
            Structured prep for top companies
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {getAllCompanyPaths().map((cp: CompanyPath, i: number) => (
            <CompanyCard key={cp.slug} path={cp} index={i} />
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveView("system-design")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeView === "system-design"
              ? "bg-saffron text-white"
              : "bg-surface text-muted-foreground hover:text-foreground border border-border/50"
          }`}
        >
          System Design Path
        </button>
        <button
          type="button"
          onClick={() => setActiveView("dsa")}
          className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
            activeView === "dsa"
              ? "bg-gold text-black"
              : "bg-surface text-muted-foreground hover:text-foreground border border-border/50"
          }`}
        >
          DS &amp; Algorithms Path
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {Object.entries(CATEGORY_META).map(([key, meta]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span className="text-xs text-muted-foreground">{meta.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-saffron px-1.5 py-0.5 text-[9px] font-bold text-white">REC</span>
          <span className="text-xs text-muted-foreground">Recommended path</span>
        </div>
      </div>

      {/* Roadmap graph -- System Design */}
      {activeView === "system-design" && (
        <div className="rounded-2xl border border-border/50 bg-surface/30 p-6">
          <div className="flex flex-col items-center gap-0 max-w-3xl mx-auto">
            <div className="w-64">
              <NodeCard node={ROADMAP_NODES[0]} completed={isNodeCompleted(ROADMAP_NODES[0].id)} onNavigate={handleNavigate} />
            </div>
            <DownArrow completed={isNodeCompleted(ROADMAP_NODES[0].id)} />
            <div className="w-64">
              <NodeCard node={ROADMAP_NODES[1]} completed={isNodeCompleted(ROADMAP_NODES[1].id)} onNavigate={handleNavigate} />
            </div>
            <BranchArrow count={4} completed={isNodeCompleted(ROADMAP_NODES[1].id)} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {ROADMAP_NODES.slice(2, 6).map((node) => (
                <NodeCard key={node.id} node={node} completed={isNodeCompleted(node.id)} onNavigate={handleNavigate} />
              ))}
            </div>
            <div className="w-full flex justify-between px-8 py-1">
              <svg width="100%" height="28" viewBox="0 0 400 28" preserveAspectRatio="none" fill="none">
                <line x1="50" y1="0" x2="50" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="150" y1="0" x2="150" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="250" y1="0" x2="250" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="50" y1="10" x2="250" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="150" y1="10" x2="150" y2="24" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="150,28 145,20 155,20" fill="hsl(240 10% 35%)" />
                <line x1="350" y1="0" x2="350" y2="24" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="350,28 345,20 355,20" fill="hsl(240 10% 35%)" />
              </svg>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
              <div className="sm:col-start-1 sm:col-span-3">
                <NodeCard node={ROADMAP_NODES[6]} completed={isNodeCompleted(ROADMAP_NODES[6].id)} onNavigate={handleNavigate} />
              </div>
              <div className="sm:col-start-4">
                <NodeCard node={ROADMAP_NODES[7]} completed={isNodeCompleted(ROADMAP_NODES[7].id)} onNavigate={handleNavigate} />
              </div>
            </div>
            <DownArrow completed={isNodeCompleted(ROADMAP_NODES[6].id)} />
            <div className="w-64">
              <NodeCard node={ROADMAP_NODES[8]} completed={isNodeCompleted(ROADMAP_NODES[8].id)} onNavigate={handleNavigate} />
            </div>
          </div>
        </div>
      )}

      {/* Roadmap graph -- DS&A */}
      {activeView === "dsa" && (
        <div className="rounded-2xl border border-border/50 bg-surface/30 p-6">
          <div className="flex flex-col items-center gap-0 max-w-xs mx-auto">
            {DSA_NODES.map((node, i) => (
              <div key={node.id} className="w-full">
                <NodeCard node={node} completed={isNodeCompleted(node.id)} onNavigate={handleNavigate} />
                {i < DSA_NODES.length - 1 && <DownArrow completed={isNodeCompleted(node.id)} />}
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            More DS&amp;A topics available in{" "}
            <button type="button" onClick={() => router.push("/app/topics")} className="text-gold underline underline-offset-2">
              Browse All Topics
            </button>
          </p>
        </div>
      )}

      {/* Recommended Study Order callout */}
      <div className="rounded-xl border border-saffron/20 bg-saffron/5 p-5">
        <h2 className="font-heading text-base font-semibold text-saffron mb-2">
          Recommended Study Order
        </h2>
        <ol className="space-y-1.5">
          {ROADMAP_NODES.filter((n) => n.isRecommended).map((node, i) => (
            <li key={node.id} className="flex items-start gap-2 text-sm">
              <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-saffron/20 text-saffron text-[10px] font-bold mt-0.5">
                {i + 1}
              </span>
              <div>
                <span className={`font-medium ${isNodeCompleted(node.id) ? "text-green-400 line-through" : "text-foreground"}`}>
                  {node.label}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">
                  &mdash; {node.description}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
