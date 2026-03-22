"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";

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
  // Which nodes this connects to (downstream)
  connects?: string[];
  isRecommended?: boolean;
}

// ── Static roadmap graph — System Design Interview path ───────────────────────

const ROADMAP_NODES: RoadmapNode[] = [
  // Row 0 — Entry point
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
  // Row 1 — Estimation
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
  // Row 2 — System Design Fundamentals (4 parallel)
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
  // Row 3 — Case studies + Microservices (parallel)
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
  // Row 4 — Mock Interviews
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

// Extra nodes displayed in a side panel (DS&A path)
const DSA_NODES: RoadmapNode[] = [
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
    connects: ["trees-graphs"],
  },
  {
    id: "trees-graphs",
    label: "Trees & Graphs",
    category: "DS&A",
    color: "bg-gold/15 border-gold/60",
    glowColor: "shadow-gold/30",
    borderColor: "border-gold",
    description: "BFS, DFS, traversals, shortest paths",
    row: 1,
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
    row: 2,
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
    "trees-graphs": ["trees", "graphs", "binary tree", "graph"],
    "dynamic-programming": ["dynamic programming", "dp"],
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
      {/* Recommended badge */}
      {node.isRecommended && !completed && (
        <span className="absolute -top-2 -right-2 rounded-full bg-saffron px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
          REC
        </span>
      )}

      {/* Completed checkmark */}
      {completed && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] text-white font-bold">
          ✓
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
          x1="8"
          y1="0"
          x2="8"
          y2="14"
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
      <svg
        width={width}
        height={28}
        viewBox={`0 0 ${width} 28`}
        fill="none"
        style={{ maxWidth: "100%" }}
      >
        {/* Vertical down from center */}
        <line x1={midX} y1="0" x2={midX} y2="8" stroke={color} strokeWidth="2" />
        {/* Horizontal spread */}
        <line x1="20" y1="8" x2={width - 20} y2="8" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
        {/* Arrow tips going down to each column */}
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
      // Fallback: go to topics page with search pre-filled
      router.push(`/app/topics`);
    }
  }

  const completedCount = ROADMAP_NODES.filter((n) => isNodeCompleted(n.id)).length;
  const totalNodes = ROADMAP_NODES.length;
  const progressPct = Math.round((completedCount / totalNodes) * 100);

  const nodes = activeView === "system-design" ? ROADMAP_NODES : DSA_NODES;

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

        {/* Progress */}
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
          DS & Algorithms Path
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

      {/* Roadmap graph — System Design */}
      {activeView === "system-design" && (
        <div className="rounded-2xl border border-border/50 bg-surface/30 p-6">
          <div className="flex flex-col items-center gap-0 max-w-3xl mx-auto">

            {/* Row 0: Interview Framework */}
            <div className="w-64">
              <NodeCard
                node={ROADMAP_NODES[0]}
                completed={isNodeCompleted(ROADMAP_NODES[0].id)}
                onNavigate={handleNavigate}
              />
            </div>

            <DownArrow completed={isNodeCompleted(ROADMAP_NODES[0].id)} />

            {/* Row 1: Estimation */}
            <div className="w-64">
              <NodeCard
                node={ROADMAP_NODES[1]}
                completed={isNodeCompleted(ROADMAP_NODES[1].id)}
                onNavigate={handleNavigate}
              />
            </div>

            <BranchArrow count={4} completed={isNodeCompleted(ROADMAP_NODES[1].id)} />

            {/* Row 2: 4 Fundamentals in a row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              {ROADMAP_NODES.slice(2, 6).map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  completed={isNodeCompleted(node.id)}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>

            {/* Merge arrows */}
            <div className="w-full flex justify-between px-8 py-1">
              <svg width="100%" height="28" viewBox="0 0 400 28" preserveAspectRatio="none" fill="none">
                {/* Left 3 columns merge to center */}
                <line x1="50" y1="0" x2="50" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="150" y1="0" x2="150" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="250" y1="0" x2="250" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="50" y1="10" x2="250" y2="10" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="150" y1="10" x2="150" y2="24" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="150,28 145,20 155,20" fill="hsl(240 10% 35%)" />
                {/* Right column — Message Queues arrow to Microservices */}
                <line x1="350" y1="0" x2="350" y2="24" stroke="hsl(240 10% 35%)" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="350,28 345,20 355,20" fill="hsl(240 10% 35%)" />
              </svg>
            </div>

            {/* Row 3: System Design Cases + Microservices */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
              <div className="sm:col-start-1 sm:col-span-3">
                <NodeCard
                  node={ROADMAP_NODES[6]}
                  completed={isNodeCompleted(ROADMAP_NODES[6].id)}
                  onNavigate={handleNavigate}
                />
              </div>
              <div className="sm:col-start-4">
                <NodeCard
                  node={ROADMAP_NODES[7]}
                  completed={isNodeCompleted(ROADMAP_NODES[7].id)}
                  onNavigate={handleNavigate}
                />
              </div>
            </div>

            <DownArrow completed={isNodeCompleted(ROADMAP_NODES[6].id)} />

            {/* Row 4: Mock Interviews */}
            <div className="w-64">
              <NodeCard
                node={ROADMAP_NODES[8]}
                completed={isNodeCompleted(ROADMAP_NODES[8].id)}
                onNavigate={handleNavigate}
              />
            </div>
          </div>
        </div>
      )}

      {/* Roadmap graph — DS&A */}
      {activeView === "dsa" && (
        <div className="rounded-2xl border border-border/50 bg-surface/30 p-6">
          <div className="flex flex-col items-center gap-0 max-w-xs mx-auto">
            {DSA_NODES.map((node, i) => (
              <div key={node.id} className="w-full">
                <NodeCard
                  node={node}
                  completed={isNodeCompleted(node.id)}
                  onNavigate={handleNavigate}
                />
                {i < DSA_NODES.length - 1 && (
                  <DownArrow completed={isNodeCompleted(node.id)} />
                )}
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            More DS&A topics available in{" "}
            <button
              type="button"
              onClick={() => router.push("/app/topics")}
              className="text-gold underline underline-offset-2"
            >
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
                <span
                  className={`font-medium ${isNodeCompleted(node.id) ? "text-green-400 line-through" : "text-foreground"}`}
                >
                  {node.label}
                </span>
                <span className="text-muted-foreground ml-1 text-xs">
                  — {node.description}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
