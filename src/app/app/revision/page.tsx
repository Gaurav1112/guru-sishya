"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  ChevronDown,
  RotateCcw,
  Check,
  Mic,
  Calendar,
  Building2,
  Tag,
  Trash2,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  loadImportantQuestions,
  type Question,
} from "@/lib/content/questions-loader";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { PageTransition } from "@/components/page-transition";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterviewQuestionResult {
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  feedback: string;
}

interface InterviewHistoryEntry {
  date: string;
  company: string;
  topic: string;
  questions: InterviewQuestionResult[];
  overallScore: number;
}

// ── Score badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "border-green-500/40 bg-green-500/10 text-green-400"
      : score >= 5
      ? "border-saffron/40 bg-saffron/10 text-saffron"
      : "border-red-500/40 bg-red-500/10 text-red-400";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      {score}/10
    </span>
  );
}

// ── Mock Interview Revision ────────────────────────────────────────────────────

function MockInterviewRevision() {
  const [history, setHistory] = useState<InterviewHistoryEntry[]>([]);
  const [activeTopicTab, setActiveTopicTab] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gs-interview-history");
      if (raw) {
        const parsed = JSON.parse(raw) as InterviewHistoryEntry[];
        setHistory(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Only show questions scored < 7/10
  const weakQuestions = useMemo(() => {
    const result: Array<InterviewQuestionResult & { date: string; company: string; entryTopic: string; key: string }> = [];
    history.forEach((entry) => {
      entry.questions.forEach((q, qi) => {
        if (q.score < 7) {
          result.push({
            ...q,
            date: entry.date,
            company: entry.company,
            entryTopic: entry.topic,
            key: `${entry.date}-${qi}`,
          });
        }
      });
    });
    return result;
  }, [history]);

  // Group by topic
  const topicGroups = useMemo(() => {
    const map = new Map<string, typeof weakQuestions>();
    for (const q of weakQuestions) {
      const topic = q.entryTopic === "All Topics" ? q.company : q.entryTopic;
      if (!map.has(topic)) map.set(topic, []);
      map.get(topic)!.push(q);
    }
    return map;
  }, [weakQuestions]);

  const topics = Array.from(topicGroups.keys());

  // Default to first topic
  useEffect(() => {
    if (topics.length > 0 && !activeTopicTab) {
      setActiveTopicTab(topics[0]);
    }
  }, [topics, activeTopicTab]);

  function clearHistory() {
    try {
      localStorage.removeItem("gs-interview-history");
      setHistory([]);
      setActiveTopicTab(null);
    } catch {
      // ignore
    }
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Mic className="size-12 text-muted-foreground/20" />
        <p className="font-heading text-lg font-semibold text-muted-foreground">
          No interview history yet
        </p>
        <p className="text-sm text-muted-foreground max-w-sm">
          Complete a mock interview to see questions you need to revise here.
          Only questions scored below 7/10 are shown.
        </p>
        <Link
          href="/app/interview"
          className="inline-flex items-center gap-2 rounded-xl bg-saffron px-5 py-2.5 text-sm font-semibold text-background transition-all hover:opacity-90"
        >
          <Mic className="size-4" />
          Start Mock Interview
        </Link>
      </div>
    );
  }

  if (weakQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Check className="size-12 text-green-400/50" />
        <p className="font-heading text-lg font-semibold">All caught up!</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          You scored 7/10 or above on all interview questions. Keep practicing!
        </p>
        <Link
          href="/app/interview"
          className="inline-flex items-center gap-2 rounded-xl border border-saffron/40 bg-saffron/10 px-5 py-2.5 text-sm font-semibold text-saffron transition-all hover:bg-saffron/20"
        >
          Practice More
        </Link>
      </div>
    );
  }

  const activeQuestions = activeTopicTab ? (topicGroups.get(activeTopicTab) ?? []) : [];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm">
          <span className="font-semibold text-red-400">{weakQuestions.length}</span>
          <span className="text-muted-foreground">questions need revision</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-surface px-4 py-2 text-sm text-muted-foreground">
          <Calendar className="size-3.5" />
          {history.length} interview{history.length !== 1 ? "s" : ""} completed
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10"
        >
          <Trash2 className="size-3" />
          Clear History
        </button>
      </div>

      {/* Topic sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {topics.map((topic) => {
          const count = topicGroups.get(topic)?.length ?? 0;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopicTab(topic)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                activeTopicTab === topic
                  ? "border-saffron/50 bg-saffron/10 text-saffron"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tag className="size-3" />
              {topic}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Questions for active topic */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTopicTab ?? "none"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {activeQuestions.map((q, i) => {
            const isExpanded = expandedQuestion === q.key;
            return (
              <motion.div
                key={q.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/40 bg-surface overflow-hidden"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.key)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors"
                >
                  <div className="shrink-0 flex items-center gap-2 mt-0.5">
                    <ScoreBadge score={q.score} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Building2 className="size-3" />
                        {q.company}
                      </span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(q.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 mt-1 transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
                        {/* AI Feedback */}
                        <div className="rounded-lg border border-indigo/20 bg-indigo/5 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo mb-1">
                            Feedback
                          </p>
                          <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                            {q.feedback.replace(/\*\*([^*]+)\*\*/g, "$1")}
                          </p>
                        </div>

                        {/* Your answer */}
                        {q.userAnswer && (
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Your Answer
                            </p>
                            <p className="text-sm text-foreground/70 whitespace-pre-wrap leading-relaxed">
                              {q.userAnswer}
                            </p>
                          </div>
                        )}

                        {/* Model answer */}
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gold mb-1.5">
                            Model Answer
                          </p>
                          <div className="text-sm text-foreground/80 leading-relaxed prose prose-invert prose-sm max-w-none">
                            <MarkdownRenderer content={q.modelAnswer} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Questions to Review ────────────────────────────────────────────────────────

function QuestionsReview() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadImportantQuestions()
      .then(setAllQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bookmarks = useLiveQuery(() => db.questionBookmarks.toArray(), []);

  const reviewQuestions = useMemo(() => {
    if (!bookmarks) return [];
    const reviewIds = new Set(
      bookmarks.filter((b) => b.status === "review").map((b) => b.questionId)
    );
    return allQuestions.filter((q) => reviewIds.has(q.id));
  }, [allQuestions, bookmarks]);

  // Group by category
  const categoryGroups = useMemo(() => {
    const map = new Map<string, Question[]>();
    for (const q of reviewQuestions) {
      if (!map.has(q.category)) map.set(q.category, []);
      map.get(q.category)!.push(q);
    }
    return map;
  }, [reviewQuestions]);

  async function markAsReviewed(questionId: number) {
    const existing = await db.questionBookmarks
      .where("questionId")
      .equals(questionId)
      .first();
    if (existing?.id) {
      await db.questionBookmarks.update(existing.id, { status: "known" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-muted/20" />
        ))}
      </div>
    );
  }

  if (reviewQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <Check className="size-12 text-green-400/50" />
        <p className="font-heading text-lg font-semibold">No questions marked for review</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          When you mark a question as "Need Review" in the Questions or Saved Questions page,
          it will appear here with full answers.
        </p>
        <Link
          href="/app/questions"
          className="text-sm text-saffron hover:underline"
        >
          Browse questions to study
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-saffron/20 bg-saffron/5 px-4 py-2 text-sm">
          <RotateCcw className="size-3.5 text-saffron" />
          <span className="font-semibold text-saffron">{reviewQuestions.length}</span>
          <span className="text-muted-foreground">questions to review</span>
        </div>
      </div>

      {Array.from(categoryGroups.entries()).map(([category, qs]) => (
        <section key={category} className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-saffron">
              {category}
            </h3>
            <span className="text-xs text-muted-foreground">({qs.length})</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          <AnimatePresence>
            {qs.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-border/40 bg-surface overflow-hidden"
              >
                {/* Header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors"
                >
                  <span className="shrink-0 mt-0.5">🔄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-medium ${
                          q.difficulty === "Hard"
                            ? "text-red-400"
                            : q.difficulty === "Easy"
                            ? "text-green-400"
                            : "text-gold"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 mt-1 transition-transform ${
                      expandedId === q.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Expanded */}
                <AnimatePresence>
                  {expandedId === q.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border/30 pt-3 space-y-4">
                        <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                          <MarkdownRenderer content={q.answer} />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/20 flex-wrap">
                          <button
                            type="button"
                            onClick={() => markAsReviewed(q.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            <Check className="size-3" />
                            Mark as Reviewed
                          </button>
                          <Link
                            href="/app/questions"
                            className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <BookOpen className="size-3" />
                            Study Topic
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      ))}
    </div>
  );
}

// ── Main Revision Page ─────────────────────────────────────────────────────────

type MainTab = "mock-interview" | "questions";

export default function RevisionPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("mock-interview");

  const TABS: { id: MainTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "mock-interview",
      label: "Mock Interview",
      icon: <Mic className="size-3.5" />,
    },
    {
      id: "questions",
      label: "Questions to Review",
      icon: <RotateCcw className="size-3.5" />,
    },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <BookOpen className="size-6 text-saffron" />
            Revision
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review weak spots from past mock interviews and questions marked for
            revision.
          </p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-2 border-b border-border/30 pb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-all -mb-px ${
                activeTab === tab.id
                  ? "border-saffron text-saffron"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "mock-interview" ? (
              <MockInterviewRevision />
            ) : (
              <QuestionsReview />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
