"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  loadInterviewHistory,
  computeCategoryScores,
  computeOverallReadiness,
  getReadinessLabel,
  getStudyRecommendations,
  type CategoryScores,
} from "@/lib/readiness";

const CATEGORY_KEYS = ["java", "systemDesign", "dsa", "behavioral"] as const;
const CATEGORY_LABELS = {
  java: "Java/Spring",
  systemDesign: "System Design",
  dsa: "DSA",
  behavioral: "Behavioral",
} as const;

function categoryBarColor(score: number): string {
  if (score >= 70) return "bg-green-400";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

export function ReadinessWidget() {
  const { interviewCompany, interviewDate } = useStore();
  const [scores, setScores] = useState<CategoryScores | null>(null);

  useEffect(() => {
    const history = loadInterviewHistory();
    setScores(computeCategoryScores(history));
  }, []);

  if (!scores) return null;

  const hasData = Object.values(scores).some((v) => v > 0);
  if (!hasData) return null;

  const company = interviewCompany || "default";
  const overall = computeOverallReadiness(scores, company);
  const { label, color } = getReadinessLabel(overall);
  const recs = getStudyRecommendations(scores, company);
  const weakest = recs[0];

  const daysAway = interviewDate
    ? Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const companyLabel = interviewCompany
    ? interviewCompany.charAt(0).toUpperCase() + interviewCompany.slice(1)
    : "your target company";

  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-sky-500/5 p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp className="size-3.5 text-violet-400" />
            <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase">
              Interview Readiness
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {companyLabel}{daysAway !== null && daysAway > 0 ? ` · ${daysAway}d away` : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading text-3xl font-bold leading-none">
            {overall}
            <span className="text-base font-normal">%</span>
          </p>
          <p className={`text-[10px] font-bold tracking-wider mt-0.5 ${color}`}>{label}</p>
        </div>
      </div>

      {/* Category bars */}
      <div className="space-y-1.5 mb-3">
        {CATEGORY_KEYS.map((cat) => (
          <div key={cat} className="flex items-center gap-2">
            <span className="w-[86px] text-[11px] text-muted-foreground shrink-0">
              {CATEGORY_LABELS[cat]}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${categoryBarColor(scores[cat])}`}
                style={{ width: `${scores[cat]}%` }}
              />
            </div>
            <span className="w-7 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
              {scores[cat]}%
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {weakest && (
          <p className="text-[11px] text-muted-foreground">
            Weakest:{" "}
            <span className="text-red-400 font-medium">{weakest.label}</span>
          </p>
        )}
        <Link
          href="/app/readiness"
          className="ml-auto flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:underline"
        >
          See breakdown
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}