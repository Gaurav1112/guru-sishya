"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Search,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Mic,
  BookOpen,
  BarChart3,
  X,
} from "lucide-react";
import { db } from "@/lib/db";
import { PageTransition } from "@/components/page-transition";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import type { Flashcard } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface InterviewQuestionResult {
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  feedback: string;
}

interface InterviewSession {
  date: string;
  company: string;
  topic: string;
  questions: InterviewQuestionResult[];
  overallScore: number;
}

interface RevisionItem {
  id: string; // unique key for dedup
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  company: string;
  topic: string;
  date: string;
  mastered: boolean;
  flashcardId?: number; // Dexie flashcard ID if exists
}

type FilterStatus = "all" | "pending" | "mastered";
type SortBy = "date" | "score-asc" | "score-desc";

// ── Score badge ─────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score < 4
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : score < 7
      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
      : "border-green-500/40 bg-green-500/10 text-green-400";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${color}`}
    >
      {score}/10
    </span>
  );
}

// ── Revision card ────────────────────────────────────────────────────────────

function RevisionCard({
  item,
  onMarkMastered,
}: {
  item: RevisionItem;
  onMarkMastered: (item: RevisionItem) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const dateFormatted = (() => {
    try {
      return new Date(item.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return item.date;
    }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`rounded-xl border transition-colors ${
        item.mastered
          ? "border-green-500/20 bg-green-500/5 opacity-60"
          : "border-border/50 bg-surface hover:border-border"
      }`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-relaxed">
              {item.question}
            </p>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <ScoreBadge score={item.score} />
              {item.company && item.company !== "General" && (
                <span className="inline-flex items-center rounded-full border border-indigo/30 bg-indigo/10 px-2 py-0.5 text-[10px] font-semibold text-indigo">
                  {item.company}
                </span>
              )}
              {item.topic && item.topic !== "All Topics" && (
                <span className="inline-flex items-center rounded-full border border-teal/30 bg-teal/10 px-2 py-0.5 text-[10px] font-semibold text-teal">
                  {item.topic}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {dateFormatted}
              </span>
              {item.mastered && (
                <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                  <CheckCircle2 className="size-3" />
                  Mastered
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Your answer */}
        <div className="mt-3 rounded-lg border border-border/30 bg-background/50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Your Answer
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">
            {item.userAnswer || "Not answered"}
          </p>
        </div>

        {/* Expandable model answer */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 flex w-full items-center justify-between rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-left transition-colors hover:bg-gold/10"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gold">
            Model Answer
          </span>
          {expanded ? (
            <ChevronUp className="size-3.5 text-gold" />
          ) : (
            <ChevronDown className="size-3.5 text-gold" />
          )}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-b-lg border border-t-0 border-gold/20 bg-gold/5 px-3 py-3">
                <MarkdownRenderer content={item.modelAnswer} className="prose-xs" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {!item.mastered && (
            <button
              type="button"
              onClick={() => onMarkMastered(item)}
              className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20"
            >
              <CheckCircle2 className="size-3.5" />
              Mark as Mastered
            </button>
          )}
          <Link
            href="/app/interview"
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-surface-hover"
          >
            <Mic className="size-3.5" />
            Practice Again
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-surface/50 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl border border-saffron/20 bg-saffron/10 mb-4">
        <BookOpen className="size-7 text-saffron" />
      </div>
      <h2 className="font-heading text-lg font-bold mb-1">
        No revision questions yet
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Complete a mock interview to see your revision questions here.
        Questions you score below 7/10 will appear automatically.
      </p>
      <Link
        href="/app/interview"
        className="inline-flex items-center gap-2 rounded-xl bg-saffron px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90 shadow-lg shadow-saffron/20"
      >
        <Mic className="size-4" />
        Start Mock Interview
      </Link>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [showFilters, setShowFilters] = useState(false);

  // Live query for interview-wrong flashcards from Dexie
  const interviewFlashcards = useLiveQuery(
    () =>
      db.flashcards
        .filter((f) => f.concept.startsWith("interview_wrong::"))
        .toArray(),
    []
  );

  // Load interview history from localStorage + merge with flashcard data
  useEffect(() => {
    setLoading(true);

    try {
      const raw = localStorage.getItem("gs-interview-history");
      const history: InterviewSession[] = raw ? JSON.parse(raw) : [];

      // Build revision items from interview history
      const revisionMap = new Map<string, RevisionItem>();

      for (const session of history) {
        for (const q of session.questions ?? []) {
          // Only include questions scored below 7
          if (typeof q.score === "number" && q.score >= 7) continue;

          const key = `${q.question.substring(0, 100)}`;

          // Keep the latest attempt if there are duplicates
          const existing = revisionMap.get(key);
          if (existing && new Date(existing.date) > new Date(session.date))
            continue;

          revisionMap.set(key, {
            id: key,
            question: q.question,
            userAnswer: q.userAnswer ?? "",
            modelAnswer: q.modelAnswer ?? "",
            score: q.score,
            company: session.company ?? "",
            topic: session.topic ?? "",
            date: session.date,
            mastered: false,
          });
        }
      }

      // Cross-reference with Dexie flashcards to find mastered cards
      if (interviewFlashcards) {
        for (const fc of interviewFlashcards) {
          const conceptKey = fc.concept.replace("interview_wrong::", "");
          const match = revisionMap.get(conceptKey);
          if (match) {
            match.flashcardId = fc.id;
            // Consider "mastered" if interval is 30+ days (pushed far out)
            if (fc.interval >= 30) {
              match.mastered = true;
            }
          } else {
            // Flashcard exists but no matching history entry -- still show it
            revisionMap.set(conceptKey, {
              id: conceptKey,
              question: fc.front,
              userAnswer: "",
              modelAnswer: fc.back,
              score: 0,
              company: "",
              topic: "",
              date: fc.nextReviewAt
                ? new Date(fc.nextReviewAt).toISOString()
                : new Date().toISOString(),
              mastered: fc.interval >= 30,
              flashcardId: fc.id,
            });
          }
        }
      }

      setItems(Array.from(revisionMap.values()));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [interviewFlashcards]);

  // Unique companies and topics for filter dropdowns
  const companies = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.company && item.company !== "General") set.add(item.company);
    }
    return Array.from(set).sort();
  }, [items]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.topic && item.topic !== "All Topics") set.add(item.topic);
    }
    return Array.from(set).sort();
  }, [items]);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.modelAnswer.toLowerCase().includes(q) ||
          item.company.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus === "pending") {
      result = result.filter((item) => !item.mastered);
    } else if (filterStatus === "mastered") {
      result = result.filter((item) => item.mastered);
    }

    // Company filter
    if (filterCompany !== "all") {
      result = result.filter((item) => item.company === filterCompany);
    }

    // Topic filter
    if (filterTopic !== "all") {
      result = result.filter((item) => item.topic === filterTopic);
    }

    // Sort
    if (sortBy === "date") {
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } else if (sortBy === "score-asc") {
      result.sort((a, b) => a.score - b.score);
    } else if (sortBy === "score-desc") {
      result.sort((a, b) => b.score - a.score);
    }

    return result;
  }, [items, searchQuery, filterStatus, filterCompany, filterTopic, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const mastered = items.filter((i) => i.mastered).length;
    const pending = total - mastered;
    const avgScore =
      total > 0
        ? Math.round(
            (items.reduce((sum, i) => sum + i.score, 0) / total) * 10
          ) / 10
        : 0;
    return { total, mastered, pending, avgScore };
  }, [items]);

  // Mark as mastered -- push flashcard 30 days into the future
  const handleMarkMastered = useCallback(
    async (item: RevisionItem) => {
      try {
        if (item.flashcardId) {
          // Update existing flashcard interval to 30 days
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          await db.flashcards.update(item.flashcardId, {
            interval: 30,
            nextReviewAt: futureDate,
            repetitions: 5, // High repetition count signals mastery
          });
        }

        // Update local state
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, mastered: true } : i
          )
        );
      } catch {
        // Ignore errors
      }
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCompany("all");
    setFilterTopic("all");
    setSortBy("date");
  }, []);

  const hasActiveFilters =
    searchQuery ||
    filterStatus !== "all" ||
    filterCompany !== "all" ||
    filterTopic !== "all";

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 animate-pulse">
        <div className="h-8 w-64 bg-muted/40 rounded-lg" />
        <div className="h-4 w-96 bg-muted/30 rounded" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 flex-1 bg-muted/20 rounded-xl" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted/20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-5 pb-16">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Revision — Interview Questions to Master
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Questions from your mock interviews that need more practice.
            Auto-populated after each interview session.
          </p>
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-xl border border-border/50 bg-surface px-3 py-2.5 text-center">
                <p className="text-lg font-bold tabular-nums">
                  {stats.total}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Total
                </p>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-center">
                <p className="text-lg font-bold tabular-nums text-amber-400">
                  {stats.pending}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2.5 text-center">
                <p className="text-lg font-bold tabular-nums text-green-400">
                  {stats.mastered}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Mastered
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-surface px-3 py-2.5 text-center">
                <p className="text-lg font-bold tabular-nums">
                  {stats.avgScore}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Avg Score
                </p>
              </div>
            </div>

            {/* Search + filter toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full rounded-lg border border-border/50 bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-saffron/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  showFilters || hasActiveFilters
                    ? "border-saffron/40 bg-saffron/10 text-saffron"
                    : "border-border/50 bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Filter className="size-3.5" />
                Filters
                {hasActiveFilters && (
                  <span className="flex size-4 items-center justify-center rounded-full bg-saffron text-[9px] font-bold text-background">
                    !
                  </span>
                )}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="rounded-lg border border-border/50 bg-surface px-3 py-2 text-sm text-muted-foreground focus:outline-none focus:ring-1 focus:ring-saffron/50"
              >
                <option value="date">Newest first</option>
                <option value="score-asc">Lowest score</option>
                <option value="score-desc">Highest score</option>
              </select>
            </div>

            {/* Filter row */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 flex-wrap rounded-xl border border-border/50 bg-surface p-3">
                    {/* Status */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        Status:
                      </span>
                      {(["all", "pending", "mastered"] as FilterStatus[]).map(
                        (s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setFilterStatus(s)}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize transition-colors ${
                              filterStatus === s
                                ? "border-saffron/40 bg-saffron/10 text-saffron"
                                : "border-border/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>

                    {/* Company */}
                    {companies.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Company:
                        </span>
                        <select
                          value={filterCompany}
                          onChange={(e) => setFilterCompany(e.target.value)}
                          className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="all">All</option>
                          {companies.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Topic */}
                    {topics.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          Topic:
                        </span>
                        <select
                          value={filterTopic}
                          onChange={(e) => setFilterTopic(e.target.value)}
                          className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs focus:outline-none"
                        >
                          <option value="all">All</option>
                          {topics.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Clear */}
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results count */}
            <p className="text-xs text-muted-foreground">
              Showing {filteredItems.length} of {items.length} question
              {items.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </p>

            {/* Cards list */}
            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-surface/50 p-8 text-center">
                <BarChart3 className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No questions match your filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-2 text-xs text-saffron hover:underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <RevisionCard
                      key={item.id}
                      item={item}
                      onMarkMastered={handleMarkMastered}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  );
}
