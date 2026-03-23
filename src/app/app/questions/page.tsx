"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  loadImportantQuestions,
  getCategories,
  type Question,
  type QuestionCategory,
} from "@/lib/content/questions-loader";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { cn } from "@/lib/utils";
import {
  Search,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  Filter,
  Eye,
  EyeOff,
  Sparkles,
  X,
  BookOpen,
  Check,
  RotateCcw,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
type StatusFilter = "all" | "bookmarked" | "known" | "review" | "unseen";

// ── Category Tab Component ───────────────────────────────────────────────────

function CategoryTabs({
  categories,
  active,
  onChange,
  counts,
}: {
  categories: QuestionCategory[];
  active: QuestionCategory;
  onChange: (c: QuestionCategory) => void;
  counts: Record<string, number>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="category-tabs flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
    >
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          onClick={() => onChange(cat)}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border",
            active === cat
              ? "bg-saffron/15 text-saffron border-saffron/30 shadow-sm"
              : "bg-surface text-muted-foreground border-border/50 hover:bg-surface-hover hover:text-foreground"
          )}
        >
          {cat}
          <span className="ml-1.5 text-[10px] opacity-70">
            {counts[cat] ?? 0}
          </span>
        </button>
      ))}
    </div>
  );
}

// ── Difficulty Badge ─────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors: Record<string, string> = {
    Easy: "bg-teal/15 text-teal border-teal/30",
    Medium: "bg-gold/15 text-gold border-gold/30",
    Hard: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colors[difficulty] ?? colors.Medium
      )}
    >
      {difficulty}
    </span>
  );
}

// ── Company Tags ─────────────────────────────────────────────────────────────

function CompanyTags({ companies }: { companies: string[] }) {
  if (companies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {companies.map((c) => (
        <span
          key={c}
          className="inline-flex items-center rounded-md bg-indigo/10 border border-indigo/20 px-1.5 py-0.5 text-[10px] font-medium text-indigo"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

// ── Question Card (Flip Card) ────────────────────────────────────────────────

function QuestionCard({
  question,
  isFlipped,
  onFlip,
  isBookmarked,
  status,
  onToggleBookmark,
  onSetStatus,
}: {
  question: Question;
  isFlipped: boolean;
  onFlip: () => void;
  isBookmarked: boolean;
  status: "unseen" | "known" | "review";
  onToggleBookmark: () => void;
  onSetStatus: (s: "known" | "review") => void;
}) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Card container with perspective */}
      <div
        className="perspective-1000 relative cursor-pointer"
        style={{ minHeight: "380px" }}
        onClick={onFlip}
        role="button"
        tabIndex={0}
        aria-label={
          isFlipped ? "Showing answer. Tap to see question." : "Tap to reveal answer."
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
      >
        {/* Inner wrapper - rotates */}
        <motion.div
          className="preserve-3d relative w-full"
          style={{ minHeight: "380px" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front Face - Question */}
          <div
            className="backface-hidden absolute inset-0 rounded-2xl border border-border/60 bg-surface paper-texture card-glow overflow-hidden"
          >
            {/* Book spine decoration */}
            <div className="book-spine absolute inset-y-0 left-0 w-3 rounded-l-2xl" />

            <div className="p-6 sm:p-8 pl-7 sm:pl-10 flex flex-col h-full">
              {/* Top badges */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="inline-flex items-center rounded-full bg-saffron/15 border border-saffron/30 px-2.5 py-0.5 text-[10px] font-semibold text-saffron uppercase tracking-wider">
                  {question.category === "All Questions"
                    ? "Core Java"
                    : question.category}
                </span>
                <DifficultyBadge difficulty={question.difficulty} />

                {/* Bookmark button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark();
                  }}
                  className="ml-auto p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
                  aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                >
                  {isBookmarked ? (
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <BookmarkCheck className="size-4 text-saffron fill-saffron" />
                    </motion.div>
                  ) : (
                    <Bookmark className="size-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              {/* Question text */}
              <div className="flex-1 flex items-center">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground leading-relaxed">
                  {question.question}
                </h2>
              </div>

              {/* Company tags */}
              <CompanyTags companies={question.companies} />

              {/* Bottom hint */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground">
                  Tap to reveal answer
                </p>
                <p className="text-[10px] text-muted-foreground/60 page-number">
                  {question.source}
                </p>
              </div>
            </div>
          </div>

          {/* Back Face - Answer */}
          <div
            className="backface-hidden absolute inset-0 rounded-2xl border border-teal/20 bg-surface paper-texture overflow-hidden"
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* Book spine decoration */}
            <div className="absolute inset-y-0 left-0 w-3 rounded-l-2xl bg-gradient-to-r from-teal/20 via-teal/10 to-transparent" />

            <div className="p-6 sm:p-8 pl-7 sm:pl-10 flex flex-col h-full overflow-y-auto max-h-[500px]">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-teal/15 border border-teal/30 px-2.5 py-0.5 text-[10px] font-semibold text-teal uppercase tracking-wider">
                  Answer
                </span>
                <DifficultyBadge difficulty={question.difficulty} />
              </div>

              {/* Answer content */}
              <div className="flex-1 text-sm">
                <MarkdownRenderer content={question.answer} />
              </div>

              {/* Status buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus("known");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    status === "known"
                      ? "bg-teal/15 text-teal border-teal/30"
                      : "bg-surface text-muted-foreground border-border/50 hover:bg-teal/10 hover:text-teal hover:border-teal/20"
                  )}
                >
                  <Check className="size-3" />
                  Known
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetStatus("review");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    status === "review"
                      ? "bg-gold/15 text-gold border-gold/30"
                      : "bg-surface text-muted-foreground border-border/50 hover:bg-gold/10 hover:text-gold hover:border-gold/20"
                  )}
                >
                  <RotateCcw className="size-3" />
                  Need Review
                </button>
                <p className="ml-auto text-[10px] text-muted-foreground">
                  Tap to flip back
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Filter Panel ─────────────────────────────────────────────────────────────

function FilterPanel({
  show,
  onClose,
  difficulty,
  onDifficulty,
  companyFilter,
  onCompanyFilter,
  statusFilter,
  onStatusFilter,
  companies,
}: {
  show: boolean;
  onClose: () => void;
  difficulty: DifficultyFilter;
  onDifficulty: (d: DifficultyFilter) => void;
  companyFilter: string;
  onCompanyFilter: (c: string) => void;
  statusFilter: StatusFilter;
  onStatusFilter: (s: StatusFilter) => void;
  companies: string[];
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-border/50 bg-surface p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-hover"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Difficulty
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {(["All", "Easy", "Medium", "Hard"] as DifficultyFilter[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDifficulty(d)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                difficulty === d
                  ? "bg-saffron/15 text-saffron border-saffron/30"
                  : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Status
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              { key: "all", label: "All" },
              { key: "bookmarked", label: "Bookmarked" },
              { key: "known", label: "Known" },
              { key: "review", label: "Need Review" },
              { key: "unseen", label: "Unseen" },
            ] as { key: StatusFilter; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onStatusFilter(key)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === key
                  ? "bg-saffron/15 text-saffron border-saffron/30"
                  : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Companies */}
      {companies.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Company
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => onCompanyFilter("")}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                companyFilter === ""
                  ? "bg-saffron/15 text-saffron border-saffron/30"
                  : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground"
              )}
            >
              All
            </button>
            {companies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCompanyFilter(c)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-all",
                  companyFilter === c
                    ? "bg-indigo/15 text-indigo border-indigo/30"
                    : "bg-transparent text-muted-foreground border-border/50 hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>("All Questions");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("All");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right

  // Load bookmarks from Dexie
  const bookmarks = useLiveQuery(
    () => db.questionBookmarks.toArray(),
    []
  );

  const bookmarkMap = useMemo(() => {
    const map = new Map<
      number,
      { bookmarked: boolean; status: "unseen" | "known" | "review" }
    >();
    for (const b of bookmarks ?? []) {
      map.set(b.questionId, { bookmarked: b.bookmarked, status: b.status });
    }
    return map;
  }, [bookmarks]);

  // Load questions on mount
  useEffect(() => {
    loadImportantQuestions()
      .then((qs) => {
        setAllQuestions(qs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute unique companies
  const allCompanies = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuestions) {
      for (const c of q.companies) set.add(c);
    }
    return [...set].sort();
  }, [allQuestions]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts["All Questions"] = allQuestions.length;
    for (const q of allQuestions) {
      counts[q.category] = (counts[q.category] ?? 0) + 1;
    }
    return counts;
  }, [allQuestions]);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let qs = allQuestions;

    // Category
    if (activeCategory !== "All Questions") {
      qs = qs.filter((q) => q.category === activeCategory);
    }

    // Search
    if (search.trim()) {
      const needle = search.toLowerCase();
      qs = qs.filter(
        (q) =>
          q.question.toLowerCase().includes(needle) ||
          q.answer.toLowerCase().includes(needle)
      );
    }

    // Difficulty
    if (difficulty !== "All") {
      qs = qs.filter((q) => q.difficulty === difficulty);
    }

    // Company
    if (companyFilter) {
      qs = qs.filter((q) => q.companies.includes(companyFilter));
    }

    // Status
    if (statusFilter !== "all") {
      qs = qs.filter((q) => {
        const bm = bookmarkMap.get(q.id);
        switch (statusFilter) {
          case "bookmarked":
            return bm?.bookmarked;
          case "known":
            return bm?.status === "known";
          case "review":
            return bm?.status === "review";
          case "unseen":
            return !bm || bm.status === "unseen";
          default:
            return true;
        }
      });
    }

    return qs;
  }, [allQuestions, activeCategory, search, difficulty, companyFilter, statusFilter, bookmarkMap]);

  const currentQuestion = filteredQuestions[currentIndex] ?? null;
  const totalFiltered = filteredQuestions.length;

  // Navigation handlers
  const goNext = useCallback(() => {
    if (currentIndex < totalFiltered - 1) {
      setDirection(1);
      setIsFlipped(false);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalFiltered]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setIsFlipped(false);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const goRandom = useCallback(() => {
    if (totalFiltered <= 1) return;
    let newIdx = currentIndex;
    while (newIdx === currentIndex) {
      newIdx = Math.floor(Math.random() * totalFiltered);
    }
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex(newIdx);
  }, [currentIndex, totalFiltered]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeCategory, search, difficulty, companyFilter, statusFilter]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "ArrowRight":
        case "j":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "k":
          e.preventDefault();
          goPrev();
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          setIsFlipped((f) => !f);
          break;
        case "r":
          e.preventDefault();
          goRandom();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, goRandom]);

  // Touch swipe support
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;

      // Only register horizontal swipes (at least 60px, and more horizontal than vertical)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) goNext();
        else goPrev();
      }
      touchStart.current = null;
    },
    [goNext, goPrev]
  );

  // Bookmark handlers
  const toggleBookmark = useCallback(
    async (questionId: number) => {
      const existing = await db.questionBookmarks
        .where("questionId")
        .equals(questionId)
        .first();
      if (existing) {
        await db.questionBookmarks.update(existing.id!, {
          bookmarked: !existing.bookmarked,
          lastSeenAt: new Date(),
        });
      } else {
        await db.questionBookmarks.add({
          questionId,
          bookmarked: true,
          status: "unseen",
          lastSeenAt: new Date(),
        });
      }
    },
    []
  );

  const setQuestionStatus = useCallback(
    async (questionId: number, status: "known" | "review") => {
      const existing = await db.questionBookmarks
        .where("questionId")
        .equals(questionId)
        .first();
      if (existing) {
        await db.questionBookmarks.update(existing.id!, {
          status,
          lastSeenAt: new Date(),
        });
      } else {
        await db.questionBookmarks.add({
          questionId,
          bookmarked: false,
          status,
          lastSeenAt: new Date(),
        });
      }
    },
    []
  );

  // Slide animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <BookOpen className="size-8 text-saffron" />
        </motion.div>
        <p className="text-sm text-muted-foreground">
          Loading interview questions...
        </p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (allQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BookOpen className="size-12 text-muted-foreground/40" />
        <h2 className="font-heading text-lg font-semibold">
          No questions loaded
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Questions will appear once the content files are available. Check that
          the master MD or JSON files are in the public/content directory.
        </p>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const knownCount = [...bookmarkMap.values()].filter(
    (b) => b.status === "known"
  ).length;
  const reviewCount = [...bookmarkMap.values()].filter(
    (b) => b.status === "review"
  ).length;
  const bookmarkedCount = [...bookmarkMap.values()].filter(
    (b) => b.bookmarked
  ).length;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <BookOpen className="size-6 text-saffron" />
            Important Questions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allQuestions.length} curated Java interview questions with detailed
            answers
          </p>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-teal">
            <Check className="size-3" />
            <span>{knownCount} known</span>
          </div>
          <div className="flex items-center gap-1 text-gold">
            <RotateCcw className="size-3" />
            <span>{reviewCount} review</span>
          </div>
          <div className="flex items-center gap-1 text-saffron">
            <BookmarkCheck className="size-3" />
            <span>{bookmarkedCount} saved</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <CategoryTabs
        categories={getCategories()}
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />

      {/* Search + Controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/50 bg-surface pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-saffron/40 focus:border-saffron/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-surface-hover"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilters((s) => !s)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
            showFilters
              ? "bg-saffron/15 text-saffron border-saffron/30"
              : "bg-surface text-muted-foreground border-border/50 hover:text-foreground"
          )}
        >
          <Filter className="size-3.5" />
          Filters
        </button>

        {/* Shuffle */}
        <button
          type="button"
          onClick={goRandom}
          className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
          title="Random question (R)"
        >
          <Shuffle className="size-3.5" />
          <span className="hidden sm:inline">Shuffle</span>
        </button>

        {/* Quiz mode */}
        <button
          type="button"
          onClick={() => setQuizMode((q) => !q)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
            quizMode
              ? "bg-gold/15 text-gold border-gold/30"
              : "bg-surface text-muted-foreground border-border/50 hover:text-foreground"
          )}
          title="Quiz mode — hide answers"
        >
          {quizMode ? (
            <EyeOff className="size-3.5" />
          ) : (
            <Eye className="size-3.5" />
          )}
          <span className="hidden sm:inline">Quiz Me</span>
        </button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        <FilterPanel
          show={showFilters}
          onClose={() => setShowFilters(false)}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          companyFilter={companyFilter}
          onCompanyFilter={setCompanyFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          companies={allCompanies}
        />
      </AnimatePresence>

      {/* No results */}
      {totalFiltered === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Search className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No questions match your filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDifficulty("All");
              setCompanyFilter("");
              setStatusFilter("all");
              setActiveCategory("All Questions");
            }}
            className="text-xs text-saffron hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground page-number">
                Question {currentIndex + 1} of {totalFiltered}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                {quizMode && (
                  <span className="flex items-center gap-1 text-gold">
                    <Sparkles className="size-3" />
                    Quiz Mode
                  </span>
                )}
                <span className="hidden sm:inline">
                  Arrow keys or swipe to navigate
                </span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-saffron to-gold progress-fill"
                initial={{ width: 0 }}
                animate={{
                  width: `${((currentIndex + 1) / totalFiltered) * 100}%`,
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Animated card */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 },
              }}
            >
              <QuestionCard
                question={currentQuestion}
                isFlipped={quizMode ? isFlipped : isFlipped}
                onFlip={() => setIsFlipped((f) => !f)}
                isBookmarked={
                  bookmarkMap.get(currentQuestion.id)?.bookmarked ?? false
                }
                status={
                  bookmarkMap.get(currentQuestion.id)?.status ?? "unseen"
                }
                onToggleBookmark={() => toggleBookmark(currentQuestion.id)}
                onSetStatus={(s) =>
                  setQuestionStatus(currentQuestion.id, s)
                }
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 rounded-xl border border-border/50 bg-surface px-4 py-2.5 text-sm font-medium transition-all hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>

            <div className="flex items-center gap-1.5">
              {/* Quick jump dots - show max 7 */}
              {totalFiltered <= 7
                ? Array.from({ length: totalFiltered }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDirection(i > currentIndex ? 1 : -1);
                        setIsFlipped(false);
                        setCurrentIndex(i);
                      }}
                      className={cn(
                        "size-2 rounded-full transition-all",
                        i === currentIndex
                          ? "bg-saffron scale-125"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      )}
                      aria-label={`Go to question ${i + 1}`}
                    />
                  ))
                : null}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex >= totalFiltered - 1}
              className="flex items-center gap-1 rounded-xl border border-border/50 bg-surface px-4 py-2.5 text-sm font-medium transition-all hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="hidden md:flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground/50">
            <span>
              <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px] font-mono">
                &larr;
              </kbd>{" "}
              /{" "}
              <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px] font-mono">
                &rarr;
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px] font-mono">
                Space
              </kbd>{" "}
              flip
            </span>
            <span>
              <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px] font-mono">
                R
              </kbd>{" "}
              random
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
