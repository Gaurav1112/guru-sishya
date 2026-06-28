"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { db } from "@/lib/db";

// ── Axis definitions ──────────────────────────────────────────────────────────

const AXES = [
  { subject: "System Design", key: "sd" },
  { subject: "Algorithms", key: "algo" },
  { subject: "Core CS", key: "cs" },
  { subject: "Behavioral", key: "beh" },
  { subject: "Distributed", key: "dist" },
  { subject: "Architecture", key: "arch" },
] as const;

type AxisKey = (typeof AXES)[number]["key"];

// Maps a topic category string → axis key
function categoryToAxis(category: string): AxisKey | null {
  const c = category.toLowerCase();

  if (c === "system design") return "sd";

  if (c === "algorithms" || c === "data structures") return "algo";

  if (
    c === "programming languages" ||
    c === "frontend" ||
    c === "backend" ||
    c === "databases" ||
    c === "software engineering" ||
    c === "computer science fundamentals"
  )
    return "cs";

  if (c === "behavioral") return "beh";

  if (c === "distributed systems" || c === "cloud computing") return "dist";

  if (c === "system design cases") return "arch";

  return null;
}

// ── Placeholder data for new users ───────────────────────────────────────────

const PLACEHOLDER_DATA = [
  { subject: "System Design", value: 40 },
  { subject: "Algorithms", value: 30 },
  { subject: "Core CS", value: 50 },
  { subject: "Behavioral", value: 20 },
  { subject: "Distributed", value: 35 },
  { subject: "Architecture", value: 25 },
];

// ── Widget ────────────────────────────────────────────────────────────────────

export function SkillRadarWidget() {
  const radarResult = useLiveQuery(async () => {
    // Fetch all attempts and all topics in parallel
    const [attempts, topics] = await Promise.all([
      db.quizAttempts.toArray(),
      db.topics.toArray(),
    ]);

    if (attempts.length === 0) return null;

    // Build topicId → category lookup
    const topicMap = new Map<number, string>();
    for (const t of topics) {
      if (t.id !== undefined) topicMap.set(t.id, t.category);
    }

    // Accumulate scores per axis
    const axisScores: Record<AxisKey, { total: number; count: number }> = {
      sd: { total: 0, count: 0 },
      algo: { total: 0, count: 0 },
      cs: { total: 0, count: 0 },
      beh: { total: 0, count: 0 },
      dist: { total: 0, count: 0 },
      arch: { total: 0, count: 0 },
    };

    for (const attempt of attempts) {
      const category = topicMap.get(attempt.topicId);
      if (!category) continue;
      const axis = categoryToAxis(category);
      if (!axis) continue;
      axisScores[axis].total += attempt.score;
      axisScores[axis].count += 1;
    }

    // Build chart data: axes with no data get 0
    const data = AXES.map(({ subject, key }) => {
      const { total, count } = axisScores[key];
      return {
        subject,
        value: count > 0 ? Math.round(total / count) : 0,
      };
    });

    const overallTotal = data.reduce((s, d) => s + d.value, 0);
    const axesWithData = data.filter((d) => d.value > 0).length;
    const avgScore =
      axesWithData > 0 ? Math.round(overallTotal / axesWithData) : 0;

    return { data, avgScore };
  }, []);

  const hasData = radarResult != null;
  const chartData = hasData ? radarResult.data : PLACEHOLDER_DATA;
  const totalScore = hasData ? radarResult.avgScore : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="rounded-xl border border-border/40 bg-surface p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Skill Profile
          </h3>
          <p className="text-xs text-muted-foreground">
            Based on your quiz performance
          </p>
        </div>
        {hasData && totalScore > 0 && (
          <span className="text-xs text-saffron font-medium tabular-nums">
            {totalScore}% avg
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "#888888", fontSize: 11 }}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={hasData ? 0.2 : 0.08}
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 3 }}
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>

      {!hasData && (
        <p className="text-center text-xs text-muted-foreground mt-2">
          Complete quizzes to fill in your skill profile
        </p>
      )}
    </motion.div>
  );
}
