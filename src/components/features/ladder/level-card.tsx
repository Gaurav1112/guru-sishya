"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  AlertTriangle,
  BookOpen,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LadderLevel } from "@/lib/ladder/types";

interface LevelCardProps {
  level: LadderLevel;
  isUnlocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  masteryEarned?: boolean;
  onTakeTest: (dreyfusLevel: number) => void;
}

export function LevelCard({
  level,
  isUnlocked,
  isCompleted,
  isCurrent,
  masteryEarned = false,
  onTakeTest,
}: LevelCardProps) {
  const [expanded, setExpanded] = useState(isCurrent);

  const borderColor = isCompleted
    ? "border-teal/40"
    : isCurrent
      ? "border-saffron/60"
      : "border-border";

  const headerBg = isCompleted
    ? "bg-teal/5"
    : isCurrent
      ? "bg-saffron/5"
      : "bg-card";

  const levelBadgeBg = isCompleted
    ? "bg-teal/20 text-teal border-teal/40"
    : isCurrent
      ? "bg-saffron/20 text-saffron border-saffron/40"
      : "bg-muted text-muted-foreground border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (level.level - 1) * 0.07, duration: 0.3 }}
    >
      <Card
        className={cn(
          "border transition-colors",
          borderColor,
          !isUnlocked && "opacity-60",
          isCurrent && "shadow-[0_0_20px_0px_hsl(16_79%_53%_/_0.15)]"
        )}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <CardHeader className={cn("rounded-t-xl pb-3", headerBg)}>
          <div className="flex items-start gap-3">
            {/* Level badge */}
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                levelBadgeBg
              )}
            >
              {isCompleted ? (
                <CheckCircle className="size-5" />
              ) : !isUnlocked ? (
                <Lock className="size-4" />
              ) : (
                level.level
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Level {level.level}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium",
                    isCompleted && "bg-teal/15 text-teal",
                    isCurrent && !isCompleted && "bg-saffron/15 text-saffron",
                    !isUnlocked && "bg-muted text-muted-foreground",
                    isUnlocked && !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {level.dreyfusLabel}
                </span>
                {level.level === 5 && masteryEarned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold font-semibold">
                    Mastered
                  </span>
                )}
              </div>
              <h3 className="font-heading text-base font-bold mt-0.5">{level.name}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  ~{level.estimatedHours}h to reach
                </span>
              </div>
            </div>

            {/* Expand toggle */}
            {isUnlocked && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            )}
          </div>
        </CardHeader>

        {/* ── Expanded body ─────────────────────────────────────────────────── */}
        {isUnlocked && expanded && (
          <CardContent className="pt-4 space-y-5">
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {level.description}
            </p>

            {/* Observable skills */}
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                <Zap className="size-3" />
                Observable Skills
              </p>
              <ul className="space-y-1.5">
                {level.observableSkills.map((skill, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>

            {/* Milestone project */}
            <div className="rounded-lg border border-border bg-muted/30 p-3.5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1.5">
                <BookOpen className="size-3" />
                Milestone Project
              </p>
              <p className="text-sm font-medium">{level.milestoneProject.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {level.milestoneProject.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated: ~{level.milestoneProject.estimatedHours}h
              </p>
            </div>

            {/* Common plateaus */}
            {level.commonPlateaus.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="size-3 text-gold" />
                  Common Plateaus
                </p>
                <ul className="space-y-1.5">
                  {level.commonPlateaus.map((plateau, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold/60" />
                      {plateau}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {level.prerequisites.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Prerequisites from Level {level.level - 1}
                </p>
                <ul className="space-y-1">
                  {level.prerequisites.map((prereq, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA button */}
            {!isCompleted && (
              <Button
                onClick={() => onTakeTest(level.level)}
                size="lg"
                className={cn(
                  "w-full mt-1",
                  level.level === 5
                    ? "bg-gold hover:bg-gold/90 text-background font-semibold"
                    : ""
                )}
              >
                {level.level === 5 ? (
                  <>
                    <Trophy className="size-4 mr-2" />
                    Take Guru Pareeksha
                  </>
                ) : (
                  "Take Graduation Test"
                )}
              </Button>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 justify-center text-sm text-teal font-medium py-1">
                <CheckCircle className="size-4" />
                Level completed — next level unlocked
              </div>
            )}

            {level.level === 5 && masteryEarned && (
              <div className="flex items-center gap-2 justify-center text-sm text-gold font-semibold py-1">
                <Trophy className="size-4" />
                Expert mastery achieved
              </div>
            )}
          </CardContent>
        )}

        {/* Locked state body */}
        {!isUnlocked && (
          <CardContent className="pt-2 pb-4">
            <p className="text-xs text-muted-foreground text-center">
              Pass the Level {level.level - 1} graduation test to unlock this stage.
            </p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
