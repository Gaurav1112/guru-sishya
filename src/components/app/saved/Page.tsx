"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bookmark, BookOpen, Check, RotateCcw, Trash2, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import {
  loadImportantQuestions,
  type Question,
} from "@/lib/content/questions-loader";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { PageTransition } from "@/components/page-transition";

type Tab = "bookmarked" | "known" | "review";

export default function SavedQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("bookmarked");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load all questions
  useState(() => {
    loadImportantQuestions()
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  // Load bookmarks from Dexie
  const bookmarks = useLiveQuery(() => db.questionBookmarks.toArray(), []);

  const bookmarkMap = useMemo(() => {
    const map = new Map<number, { bookmarked: boolean; status: "unseen" | "known" | "review" }>();
    for (const b of bookmarks ?? []) {
      map.set(b.questionId, { bookmarked: b.bookmarked, status: b.status });
    }
    return map;
  }, [bookmarks]);

  // Filter questions by tab
  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const bm = bookmarkMap.get(q.id);
      if (!bm) return false;
      if (activeTab === "bookmarked") return bm.bookmarked;
      if (activeTab === "known") return bm.status === "known";
      if (activeTab === "review") return bm.status === "review";
      return false;
    });
  }, [questions, bookmarkMap, activeTab]);

  const counts = useMemo(() => {
    let bookmarked = 0, known = 0, review = 0;
    for (const bm of bookmarks ?? []) {
      if (bm.bookmarked) bookmarked++;
      if (bm.status === "known") known++;
      if (bm.status === "review") review++;
    }
    return { bookmarked, known, review };
  }, [bookmarks]);

  async function removeBookmark(questionId: number) {
    const existing = await db.questionBookmarks.where("questionId").equals(questionId).first();
    if (existing?.id) {
      await db.questionBookmarks.update(existing.id, { bookmarked: false });
    }
  }

  async function changeStatus(questionId: number, status: "known" | "review" | "unseen") {
    const existing = await db.questionBookmarks.where("questionId").equals(questionId).first();
    if (existing?.id) {
      await db.questionBookmarks.update(existing.id, { status });
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "bookmarked", label: "Bookmarked", icon: <Bookmark className="size-3.5" />, count: counts.bookmarked },
    { id: "review", label: "Need Review", icon: <RotateCcw className="size-3.5" />, count: counts.review },
    { id: "known", label: "Known", icon: <Check className="size-3.5" />, count: counts.known },
  ];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted/40 rounded" />
        <div className="h-4 w-full bg-muted/30 rounded" />
        <div className="h-4 w-3/4 bg-muted/30 rounded" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <Bookmark className="size-6 text-saffron" />
            Saved Questions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your bookmarked, known, and review questions — all in one place.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "border-saffron/50 bg-saffron/10 text-saffron"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span className="tabular-nums opacity-70">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Questions list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <BookOpen className="size-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No {activeTab === "bookmarked" ? "bookmarked" : activeTab === "known" ? "known" : "review"} questions yet.
            </p>
            <Link
              href="/app/questions"
              className="text-sm text-saffron hover:underline"
            >
              Browse questions →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((q, i) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border/40 bg-surface overflow-hidden"
                >
                  {/* Question header */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors cursor-pointer"
                  >
                    <span className="shrink-0 mt-0.5 text-sm">
                      {bookmarkMap.get(q.id)?.status === "known" ? "✅" :
                       bookmarkMap.get(q.id)?.status === "review" ? "🔄" : "🔖"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{q.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-saffron font-semibold uppercase">{q.category}</span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className={`text-[10px] font-medium ${
                          q.difficulty === "Hard" ? "text-red-400" :
                          q.difficulty === "Easy" ? "text-green-400" : "text-gold"
                        }`}>{q.difficulty}</span>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expandedId === q.id ? "rotate-180" : ""}`} />
                  </button>

                  {/* Expanded answer */}
                  <AnimatePresence>
                    {expandedId === q.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 border-t border-border/30 pt-3">
                          <div className="text-sm text-muted-foreground leading-relaxed prose prose-invert prose-sm max-w-none">
                            <MarkdownRenderer content={q.answer} />
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/20">
                            <button
                              onClick={() => changeStatus(q.id, "known")}
                              className="flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              <Check className="size-3" /> Known
                            </button>
                            <button
                              onClick={() => changeStatus(q.id, "review")}
                              className="flex items-center gap-1 rounded-lg border border-saffron/30 bg-saffron/10 px-2.5 py-1.5 text-xs font-medium text-saffron hover:bg-saffron/20 transition-colors"
                            >
                              <RotateCcw className="size-3" /> Review
                            </button>
                            <button
                              onClick={() => removeBookmark(q.id)}
                              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
                            >
                              <Trash2 className="size-3" /> Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Link to all questions */}
        <div className="text-center pt-4">
          <Link
            href="/app/questions"
            className="text-sm text-saffron hover:underline"
          >
            Browse all 828 questions →
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
