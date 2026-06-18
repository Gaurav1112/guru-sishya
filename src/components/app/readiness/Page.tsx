"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Target, Calendar } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  loadInterviewHistory,
  computeCategoryScores,
  computeOverallReadiness,
  getReadinessLabel,
  getStudyRecommendations,
  COMPANY_WEIGHTS,
  type CategoryScores,
  type ReadinessCategory,
} from "@/lib/readiness";
import { PageTransition } from "@/components/page-transition";

const COMPANIES = ["Amazon", "Google", "Flipkart", "Swiggy", "Uber", "Microsoft"];
const LEVELS = ["SDE-1", "SDE-2", "SDE-3 / Senior"];
const CATEGORY_KEYS: ReadinessCategory[] = ["java", "systemDesign", "dsa", "behavioral"];
const CATEGORY_LABELS: Record<ReadinessCategory, string> = {
  java: "Java / Spring",
  systemDesign: "System Design",
  dsa: "DSA",
  behavioral: "Behavioral",
};
const CATEGORY_HREFS: Record<ReadinessCategory, string> = {
  java: "/app/interview?topic=Java+Core",
  systemDesign: "/app/interview?topic=System+Design",
  dsa: "/app/interview?topic=DSA",
  behavioral: "/app/interview?topic=Behavioral",
};

function barColor(score: number): string {
  if (score >= 70) return "bg-green-400";
  if (score >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

function barTextColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

export default function ReadinessPage() {
  const { interviewCompany, interviewDate, setInterviewCompany } = useStore();

  const [selectedCompany, setSelectedCompany] = useState(
    interviewCompany
      ? interviewCompany.charAt(0).toUpperCase() + interviewCompany.slice(1)
      : "Swiggy"
  );
  const [selectedLevel, setSelectedLevel] = useState("SDE-2");
  const [scores, setScores] = useState<CategoryScores>({ java: 0, systemDesign: 0, dsa: 0, behavioral: 0 });
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const history = loadInterviewHistory();
    const computed = computeCategoryScores(history);
    setScores(computed);
    setHasData(Object.values(computed).some((v) => v > 0));
  }, []);

  function handleCompanyChange(company: string) {
    setSelectedCompany(company);
    setInterviewCompany(company.toLowerCase());
  }

  const companyKey = selectedCompany.toLowerCase();
  const overall = computeOverallReadiness(scores, companyKey);
  const { label, color } = getReadinessLabel(overall);
  const recs = getStudyRecommendations(scores, companyKey);
  const weights = COMPANY_WEIGHTS[companyKey] ?? COMPANY_WEIGHTS.default;
  const weakestCat = CATEGORY_KEYS.reduce((a, b) => scores[a] < scores[b] ? a : b);

  const daysAway = interviewDate
    ? Math.ceil((new Date(interviewDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <PageTransition>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Back */}
        <Link href="/app/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Dashboard
        </Link>

        {/* Header + selectors */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold">Interview Readiness</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Coverage × performance per category, weighted for your target company
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {COMPANIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* No data state */}
        {!hasData && (
          <div className="rounded-xl border border-border/50 bg-surface p-8 text-center">
            <Target className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No interview sessions yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Complete a mock interview to see your readiness score.
            </p>
            <Link
              href="/app/interview"
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              Start a Mock Interview
            </Link>
          </div>
        )}

        {hasData && (
          <>
            {/* Headline + countdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/15 to-sky-500/5 p-5 text-center">
                <p className="font-heading text-5xl font-bold">
                  {overall}
                  <span className="text-2xl font-normal">%</span>
                </p>
                <p className={`text-sm font-bold tracking-wider mt-1 ${color}`}>{label}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedCompany} · {selectedLevel}</p>
              </div>
              {daysAway !== null && daysAway > 0 ? (
                <div className="rounded-xl border border-border/50 bg-surface p-5 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                    <Calendar className="size-3.5" />
                    Interview in
                  </div>
                  <p className="font-heading text-3xl font-bold text-yellow-400">{daysAway} days</p>
                  <p className="text-xs text-muted-foreground">{new Date(interviewDate!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border/50 bg-surface p-5 flex flex-col justify-center gap-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Set target</p>
                  <Link href="/app/settings" className="text-sm font-medium text-violet-400 hover:underline">
                    Add interview date →
                  </Link>
                </div>
              )}
            </div>

            {/* Category breakdown */}
            <section>
              <h2 className="font-heading text-base font-semibold mb-3">
                Category Breakdown
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({selectedCompany} weights)
                </span>
              </h2>
              <div className="space-y-3">
                {CATEGORY_KEYS.map((cat) => {
                  const score = scores[cat];
                  const weight = Math.round(weights[cat] * 100);
                  const isWeakest = cat === weakestCat && score < 70;
                  return (
                    <div
                      key={cat}
                      className={`rounded-xl border p-4 ${isWeakest ? "border-red-500/30 bg-red-500/5" : "border-border/50 bg-surface"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{CATEGORY_LABELS[cat]}</span>
                          {isWeakest && (
                            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              WEAKEST
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-muted-foreground">Weight: {weight}%</span>
                          <span className={`text-base font-bold ${barTextColor(score)}`}>{score}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor(score)}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Study tonight */}
            <section>
              <h2 className="font-heading text-base font-semibold mb-3">Study Tonight — Highest ROI</h2>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 divide-y divide-border/30">
                {recs.map((rec, i) => (
                  <div key={rec.category} className="flex items-center gap-3 p-4">
                    <span className={`text-lg font-bold shrink-0 ${i === 0 ? "text-red-400" : i === 1 ? "text-yellow-400" : "text-green-400"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{rec.label}</p>
                      <p className="text-[11px] text-muted-foreground">Current score: {rec.score}%</p>
                    </div>
                    <Link
                      href={CATEGORY_HREFS[rec.category]}
                      className="shrink-0 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-400 hover:bg-sky-500/20 transition-colors"
                    >
                      Practice →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PageTransition>
  );
}
