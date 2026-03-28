"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { PageTransition } from "@/components/page-transition";
import { AccuracyTrend } from "@/components/analytics/accuracy-trend";
import { TopicRadar } from "@/components/analytics/topic-radar";
import { WeakAreas } from "@/components/analytics/weak-areas";
import { QuizBreakdown } from "@/components/analytics/quiz-breakdown";
import { LearningVelocity } from "@/components/analytics/learning-velocity";
import { BadgeProgress } from "@/components/analytics/badge-progress";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "All time", days: 365 },
] as const;

function FadeIn({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function AnalyticsPage() {
  const [range, setRange] = useState(1); // default 30 days

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <FadeIn index={0}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/app/dashboard"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-4" />
                Dashboard
              </Link>
              <h1 className="font-heading text-xl font-bold">Progress Analytics</h1>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-surface p-0.5">
              <Calendar className="size-3.5 text-muted-foreground ml-2" />
              {RANGES.map((r, i) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setRange(i)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    range === i
                      ? "bg-saffron/20 text-saffron font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Row 1: Accuracy + Radar */}
        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn index={1}>
            <AccuracyTrend days={RANGES[range].days} />
          </FadeIn>
          <FadeIn index={2}>
            <TopicRadar />
          </FadeIn>
        </div>

        {/* Row 2: Velocity + Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn index={3}>
            <LearningVelocity days={RANGES[range].days} />
          </FadeIn>
          <FadeIn index={4}>
            <QuizBreakdown />
          </FadeIn>
        </div>

        {/* Row 3: Weak Areas + Badges */}
        <div className="grid gap-4 md:grid-cols-2">
          <FadeIn index={5}>
            <WeakAreas />
          </FadeIn>
          <FadeIn index={6}>
            <BadgeProgress />
          </FadeIn>
        </div>
      </div>
    </PageTransition>
  );
}
