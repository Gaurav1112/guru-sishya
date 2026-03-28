"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Radar } from "lucide-react";

const CATEGORIES = [
  { key: "System Design", label: "System Design", color: "#E85D26" },
  { key: "System Design Cases", label: "Case Studies", color: "#FDB813" },
  { key: "Data Structures", label: "DS & Algo", color: "#1DD1A1" },
  { key: "Algorithms", label: "Algorithms", color: "#1DD1A1" },
  { key: "Programming Languages", label: "Languages", color: "#6C5CE7" },
  { key: "Computer Science Fundamentals", label: "Core CS", color: "#6C5CE7" },
];

const DISPLAY_AXES = ["System Design", "Case Studies", "DS & Algo", "Languages", "Core CS"];

export function TopicRadar() {
  const data = useLiveQuery(async () => {
    const attempts = await db.quizAttempts.toArray();
    const topics = await db.topics.toArray();

    const topicMap = new Map(topics.map((t) => [t.id!, t.category]));
    const catScores = new Map<string, { scoreSum: number; count: number }>();

    for (const a of attempts) {
      const cat = topicMap.get(a.topicId);
      if (!cat) continue;
      const mapped = CATEGORIES.find((c) => c.key === cat);
      if (!mapped) continue;
      const label = mapped.label;
      const entry = catScores.get(label) ?? { scoreSum: 0, count: 0 };
      entry.scoreSum += a.score;
      entry.count += 1;
      catScores.set(label, entry);
    }

    return DISPLAY_AXES.map((axis) => {
      const entry = catScores.get(axis);
      return {
        label: axis,
        value: entry && entry.count > 0
          ? Math.round(entry.scoreSum / entry.count)
          : 0,
      };
    });
  }, []);

  if (!data) return <ChartSkeleton />;

  const hasData = data.some((d) => d.value > 0);

  const CX = 150;
  const CY = 130;
  const R = 90;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;

  function polarToCart(i: number, r: number) {
    const angle = -Math.PI / 2 + i * angleStep;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  }

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="flex items-center gap-2 mb-3">
        <Radar className="size-4 text-saffron" />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Topic Strength
        </p>
      </div>
      {!hasData ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Quiz different categories to see your strength map
        </p>
      ) : (
        <svg viewBox="0 0 300 280" className="w-full h-auto max-w-xs mx-auto">
          {rings.map((ring) => {
            const pts = Array.from({ length: n }, (_, i) => {
              const p = polarToCart(i, R * ring);
              return `${p.x},${p.y}`;
            }).join(" ");
            return <polygon key={ring} points={pts} fill="none" stroke="currentColor" strokeOpacity={0.08} />;
          })}

          {data.map((_, i) => {
            const p = polarToCart(i, R);
            return <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="currentColor" strokeOpacity={0.08} />;
          })}

          <polygon
            points={data
              .map((d, i) => {
                const p = polarToCart(i, (d.value / 100) * R);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="#E85D26"
            fillOpacity={0.15}
            stroke="#E85D26"
            strokeWidth={2}
          />

          {data.map((d, i) => {
            const p = polarToCart(i, (d.value / 100) * R);
            return <circle key={i} cx={p.x} cy={p.y} r={3} fill="#E85D26" />;
          })}

          {data.map((d, i) => {
            const p = polarToCart(i, R + 18);
            return (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="currentColor"
                fillOpacity={0.5}
                fontSize={10}
              >
                {d.label}
              </text>
            );
          })}

          {data.map((d, i) => {
            if (d.value === 0) return null;
            const p = polarToCart(i, (d.value / 100) * R - 14);
            return (
              <text
                key={`v-${i}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#E85D26"
                fontSize={9}
                fontWeight="bold"
              >
                {d.value}%
              </text>
            );
          })}
        </svg>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-surface p-4">
      <div className="h-4 w-32 bg-muted/30 rounded mb-3" />
      <div className="h-48 bg-muted/10 rounded animate-pulse" />
    </div>
  );
}
