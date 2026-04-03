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
import { CodeLanguageToggle } from "@/components/code-language-toggle";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { QuestionGrid } from "@/components/features/questions/question-gallery";
import { DrumPicker } from "@/components/features/questions/drum-picker";
import { ConstellationNavigator } from "@/components/features/questions/constellation-navigator";
import { MiniMapStrip } from "@/components/features/questions/mini-map-strip";
import { PremiumGate } from "@/components/premium-gate";
import { useFeatureLimit } from "@/hooks/use-feature-limit";
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
  Lock,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type DifficultyFilter = "All" | "Easy" | "Medium" | "Hard";
type StatusFilter = "all" | "bookmarked" | "known" | "review" | "unseen";

// Categories that support a company sub-filter row
const COMPANY_FILTER_CATEGORIES: QuestionCategory[] = [
  "Company-Specific",
  "Behavioral (STAR)",
];

// Fixed set of companies shown in the sub-filter, with brand accent colors
const COMPANY_BUTTONS: { name: string; color: string }[] = [
  { name: "Google",    color: "#4285F4" },
  { name: "Amazon",    color: "#FF9900" },
  { name: "Microsoft", color: "#00A4EF" },
  { name: "Meta",      color: "#0866FF" },
  { name: "Apple",     color: "#A2AAAD" },
  { name: "Netflix",   color: "#E50914" },
];

// ── Company Sub-Filter ───────────────────────────────────────────────────────

function CompanySubFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (company: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 flex-wrap"
    >
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">
        Company:
      </span>
      <button
        type="button"
        onClick={() => onChange("")}
        className={cn(
          "shrink-0 rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-150",
          selected === ""
            ? "bg-saffron/15 text-saffron border-saffron/30"
            : "bg-surface text-muted-foreground border-border/50 hover:text-foreground hover:bg-surface-hover"
        )}
      >
        All Companies
      </button>
      {COMPANY_BUTTONS.map(({ name, color }) => {
        const isActive = selected === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(isActive ? "" : name)}
            style={
              isActive
                ? {
                    backgroundColor: color + "26", // ~15% opacity hex
                    borderColor: color + "66",      // ~40% opacity hex
                    color,
                  }
                : undefined
            }
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-150",
              isActive
                ? ""
                : "bg-surface text-muted-foreground border-border/50 hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {name}
          </button>
        );
      })}
    </motion.div>
  );
}

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
      className="category-tabs flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin max-w-full"
      style={{ WebkitOverflowScrolling: "touch", scrollSnapType: "x mandatory" }}
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
  answerLocked,
  languageFilter,
}: {
  question: Question;
  isFlipped: boolean;
  onFlip: () => void;
  isBookmarked: boolean;
  status: "unseen" | "known" | "review";
  onToggleBookmark: () => void;
  onSetStatus: (s: "known" | "review") => void;
  answerLocked: boolean;
  languageFilter: "java" | "python" | "typescript" | "all";
}) {
  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
      {/* Card container with perspective */}
      <div
        className="perspective-1000 relative cursor-pointer"
        style={{ minHeight: "380px", perspective: "1200px" }}
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
          style={{ height: "min(70vh, 600px)" }}
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

            <div className="p-6 sm:p-8 pl-7 sm:pl-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-teal/15 border border-teal/30 px-2.5 py-0.5 text-[10px] font-semibold text-teal uppercase tracking-wider">
                  Answer
                </span>
                <DifficultyBadge difficulty={question.difficulty} />
              </div>

              {/* Answer content — gated for free users beyond 5 reveals */}
              {answerLocked ? (
                <div className="flex-1 flex items-center justify-center">
                  <PremiumGate feature="full-answers" overlay={false} />
                </div>
              ) : (
                <>
                  {/* Answer content — scrollable */}
                  <div className="flex-1 overflow-y-auto overscroll-contain text-sm mb-3" style={{ scrollbarWidth: "thin" }}>
                    <MarkdownRenderer content={question.answer} languageFilter={languageFilter} />
                  </div>

                  {/* Status buttons — sticky at bottom, always visible */}
                  <div className="shrink-0 flex items-center gap-2 pt-3 border-t border-border/30">
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
                </>
              )}
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
  const [activeCategory, setActiveCategoryRaw] = useState<QuestionCategory>("All Questions");
  const [search, setSearchRaw] = useState("");
  const [difficulty, setDifficultyRaw] = useState<DifficultyFilter>("All");
  const [companyFilter, setCompanyFilterRaw] = useState("");
  // Sub-filter: selected company for Company-Specific / Behavioral (STAR) categories
  const [selectedCompany, setSelectedCompanyRaw] = useState("");
  const [statusFilter, setStatusFilterRaw] = useState<StatusFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right
  const [showMobileGallery, setShowMobileGallery] = useState(false);

  // Premium gate
  const { isPremium, premiumUntil, preferredLanguage, setPreferredLanguage } = useStore();
  const isActivePremium =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();
  const answerLimit = useFeatureLimit("question_reveal");

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

  // Build category data for ConstellationNavigator
  const categoryData = useMemo(
    () =>
      getCategories()
        .filter((cat) => cat === "All Questions" || (categoryCounts[cat] ?? 0) > 0)
        .map((name) => ({ name, count: categoryCounts[name] ?? 0 })),
    [categoryCounts]
  );

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

    // Company (from the filter panel — applies across all categories)
    if (companyFilter) {
      qs = qs.filter((q) => q.companies.includes(companyFilter));
    }

    // Company sub-filter (secondary row for Company-Specific / Behavioral categories)
    if (
      selectedCompany &&
      COMPANY_FILTER_CATEGORIES.includes(activeCategory)
    ) {
      qs = qs.filter((q) => q.companies.includes(selectedCompany));
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

    // Free users: limit to first 10 questions per category (Pro gets all)
    if (!isActivePremium && qs.length > 10) {
      return qs.slice(0, 10);
    }
    return qs;
  }, [allQuestions, activeCategory, search, difficulty, companyFilter, selectedCompany, statusFilter, bookmarkMap]);

  // Build tile status array for the gallery
  const galleryQuestions = useMemo(
    () =>
      filteredQuestions.map((q, i) => ({
        index: i,
        questionId: q.id,
        questionText: q.question.length > 60 ? q.question.substring(0, 57) + "..." : q.question,
        status: bookmarkMap.get(q.id)?.status ?? ("unseen" as const),
        bookmarked: bookmarkMap.get(q.id)?.bookmarked ?? false,
      })),
    [filteredQuestions, bookmarkMap]
  );

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

  // Wrapped setters that also reset navigation position
  const setActiveCategory = useCallback((c: QuestionCategory) => {
    setActiveCategoryRaw(c);
    // Clear the company sub-filter when switching categories
    setSelectedCompanyRaw("");
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);
  const setSearch = useCallback((s: string) => {
    setSearchRaw(s);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);
  const setDifficulty = useCallback((d: DifficultyFilter) => {
    setDifficultyRaw(d);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);
  const setCompanyFilter = useCallback((c: string) => {
    setCompanyFilterRaw(c);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);
  const setSelectedCompany = useCallback((c: string) => {
    setSelectedCompanyRaw(c);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);
  const setStatusFilter = useCallback((s: StatusFilter) => {
    setStatusFilterRaw(s);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, []);

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
        case "g":
        case "G":
          e.preventDefault();
          jumpInputRef.current?.focus();
          jumpInputRef.current?.select();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, goRandom]);

  // Jump input ref — focused by pressing G
  const jumpInputRef = useRef<HTMLInputElement>(null);

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
      // Find the full question object so we can use its text for the flashcard
      const question = allQuestions.find((q) => q.id === questionId);

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

      // Sync with flashcards table for spaced-repetition
      if (question) {
        const concept = `question_review::${question.question.substring(0, 100)}`;
        const existingCard = await db.flashcards
          .filter((f) => f.concept === concept)
          .first();

        if (status === "review") {
          // Create a flashcard due immediately if one doesn't exist yet
          if (!existingCard) {
            await db.flashcards.add({
              topicId: 0,
              concept,
              front: question.question,
              back: question.answer || "Review this question",
              easeFactor: 2.5,
              interval: 0,
              repetitions: 0,
              nextReviewAt: new Date(),
            });
          }
        } else if (status === "known" && existingCard) {
          // Push the review date 30 days out — effectively mastered
          await db.flashcards.update(existingCard.id!, {
            interval: 30,
            nextReviewAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });
        }
      }
    },
    [allQuestions]
  );

  // ── Persist / restore position ────────────────────────────────────────────

  // Track whether initial restore has happened
  const hasRestoredRef = useRef(false);
  // Track the saved position for the "Resume" button
  const [savedPosition, setSavedPosition] = useState<{ index: number; category: string; questionText: string } | null>(null);

  // Save position whenever it changes (only after initial restore)
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    try {
      localStorage.setItem("gs-questions-last-pos", JSON.stringify({
        index: currentIndex,
        category: activeCategory,
        questionId: filteredQuestions[currentIndex]?.id ?? null,
      }));
    } catch { /* ignore */ }
  }, [currentIndex, activeCategory, filteredQuestions]);

  // Restore position on mount (once questions are loaded)
  useEffect(() => {
    if (filteredQuestions.length === 0 || hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    try {
      const raw = localStorage.getItem("gs-questions-last-pos");
      if (!raw) return;
      const saved = JSON.parse(raw) as { index: number; category: string; questionId: number | null };

      // If user is on the same category, restore exact index
      if (saved.category === activeCategory && saved.index > 0 && saved.index < filteredQuestions.length) {
        setCurrentIndex(saved.index);
        return;
      }

      // If on a different category, try to find the question by ID
      if (saved.questionId != null) {
        const matchIdx = filteredQuestions.findIndex(q => q.id === saved.questionId);
        if (matchIdx > 0) {
          setCurrentIndex(matchIdx);
          return;
        }
      }

      // Show "Resume" button if we have a saved position in a different category
      if (saved.index > 0 && saved.category && saved.category !== activeCategory) {
        const savedQ = allQuestions.find(q => q.id === saved.questionId);
        setSavedPosition({
          index: saved.index,
          category: saved.category,
          questionText: savedQ ? savedQ.question.substring(0, 60) + (savedQ.question.length > 60 ? "..." : "") : `Question #${saved.index + 1}`,
        });
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredQuestions.length]);

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

  // ── Premium gate helpers ───────────────────────────────────────────────────
  // NOTE: ALL hooks MUST be before any early returns (Rules of Hooks)

  const handleFlip = useCallback(
    async (questionId: number) => {
      const currentlyFlipped = isFlipped;
      if (!currentlyFlipped) {
        // Flipping to the answer side — check/increment limit
        if (!isActivePremium) {
          const canReveal = await answerLimit.increment();
          if (!canReveal) {
            // Limit reached — flip to show the locked gate
            setIsFlipped(true);
            return;
          }
        }
      }
      setIsFlipped((f) => !f);
    },
    [isActivePremium, answerLimit, isFlipped]
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        {/* Header skeleton */}
        <div className="animate-pulse flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-56 bg-muted/40 rounded" />
            <div className="h-4 w-72 bg-muted/30 rounded" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
            <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
            <div className="h-4 w-10 sm:w-16 bg-muted/30 rounded" />
          </div>
        </div>

        {/* Category tabs skeleton */}
        <div className="animate-pulse flex gap-1.5 overflow-x-hidden pb-1">
          {[80, 96, 72, 88, 64, 80].map((w, i) => (
            <div
              key={i}
              className="shrink-0 h-7 bg-muted/30 rounded-lg"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>

        {/* Search + controls skeleton */}
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-9 flex-1 max-w-sm bg-muted/30 rounded-lg" />
          <div className="h-9 w-20 bg-muted/30 rounded-lg" />
          <div className="h-9 w-20 bg-muted/30 rounded-lg" />
          <div className="h-9 w-20 bg-muted/30 rounded-lg" />
        </div>

        {/* Card skeleton with spinner overlay */}
        <div className="relative">
          {/* Progress bar skeleton */}
          <div className="animate-pulse mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="h-3 w-28 bg-muted/30 rounded" />
              <div className="h-3 w-40 bg-muted/20 rounded" />
            </div>
            <div className="h-1 w-full bg-muted/30 rounded-full" />
          </div>

          {/* Flip card skeleton */}
          <div
            className="animate-pulse w-full max-w-2xl mx-auto rounded-2xl border border-border/30 bg-surface p-6 sm:p-8"
            style={{ minHeight: "380px" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="h-5 w-20 bg-muted/30 rounded-full" />
              <div className="h-5 w-14 bg-muted/20 rounded-full" />
            </div>
            <div className="flex items-center py-8">
              <div className="w-full space-y-3">
                <div className="h-6 w-5/6 bg-muted/40 rounded" />
                <div className="h-6 w-4/6 bg-muted/30 rounded" />
              </div>
            </div>
            <div className="mt-auto pt-3 border-t border-border/20 flex justify-between items-center">
              <div className="h-3 w-28 bg-muted/20 rounded" />
              <div className="h-3 w-16 bg-muted/20 rounded" />
            </div>
          </div>

          {/* Spinner centred over the skeleton card */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
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
        </div>
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

        {/* Stats — always visible, compact on mobile */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs shrink-0">
          <div className="flex items-center gap-1 text-teal">
            <Check className="size-3" />
            <span>{knownCount}</span>
            <span className="hidden sm:inline">known</span>
          </div>
          <div className="flex items-center gap-1 text-gold">
            <RotateCcw className="size-3" />
            <span>{reviewCount}</span>
            <span className="hidden sm:inline">review</span>
          </div>
          <div className="flex items-center gap-1 text-saffron">
            <BookmarkCheck className="size-3" />
            <span>{bookmarkedCount}</span>
            <span className="hidden sm:inline">saved</span>
          </div>
        </div>
      </div>

      {/* Category tabs — scrollable with fade indicators */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      <CategoryTabs
        categories={getCategories().filter(
          (cat) => cat === "All Questions" || (categoryCounts[cat] ?? 0) > 0
        )}
        active={activeCategory}
        onChange={setActiveCategory}
        counts={categoryCounts}
      />
      </div>

      {/* Company sub-filter — shown only for Company-Specific / Behavioral (STAR) */}
      <AnimatePresence>
        {COMPANY_FILTER_CATEGORIES.includes(activeCategory) && (
          <CompanySubFilter
            selected={selectedCompany}
            onChange={setSelectedCompany}
          />
        )}
      </AnimatePresence>

      {/* Search + Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Language toggle */}
        <CodeLanguageToggle value={preferredLanguage} onChange={setPreferredLanguage} />
        {/* Search */}
        <div className="relative flex-1 min-w-[140px] max-w-sm">
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

      {/* Resume where you left off */}
      {savedPosition && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-saffron/20 bg-saffron/5 px-4 py-3"
        >
          <BookOpen className="size-4 text-saffron shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              You were last viewing <span className="text-foreground font-medium">{savedPosition.category}</span>
            </p>
            <p className="text-xs text-muted-foreground/70 truncate">
              {savedPosition.questionText}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveCategoryRaw(savedPosition.category as QuestionCategory);
              setSelectedCompanyRaw("");
              // The index will be restored via the effect after category change re-filters
              setTimeout(() => {
                try {
                  const raw = localStorage.getItem("gs-questions-last-pos");
                  if (raw) {
                    const saved = JSON.parse(raw) as { index: number; questionId: number | null };
                    if (saved.questionId != null) {
                      // We need to wait for the questions to re-filter, so just set the index
                      setCurrentIndex(saved.index);
                    }
                  }
                } catch { /* ignore */ }
              }, 50);
              setSavedPosition(null);
            }}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-saffron px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 transition-opacity"
          >
            Resume
            <ChevronRight className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => setSavedPosition(null)}
            className="shrink-0 p-1 rounded hover:bg-surface-hover"
            aria-label="Dismiss"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </motion.div>
      )}

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
              setSelectedCompany("");
              setStatusFilter("all");
              setActiveCategory("All Questions");
            }}
            className="text-xs text-saffron hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Question Card + Gallery layout */}
      {currentQuestion && (
        <div className="flex gap-4">
          {/* Main content — takes most of the width */}
          <div
            className="flex-1 min-w-0 relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* MiniMap strip — always visible above the card */}
            <div className="mb-3">
              <MiniMapStrip
                items={galleryQuestions.map((q) => ({ status: q.status }))}
                currentIndex={currentIndex}
                onSeek={(idx) => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
              />
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                {/* Prominent question counter + jump input */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <span className="text-saffron">Q{currentIndex + 1}</span>
                    <span className="text-muted-foreground text-sm">of {totalFiltered}</span>
                  </div>
                  {/* Jump input — press G to focus */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">Go to:</span>
                    <input
                      ref={jumpInputRef}
                      type="number"
                      min={1}
                      max={totalFiltered}
                      placeholder="#"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const val = parseInt((e.target as HTMLInputElement).value, 10);
                          if (!isNaN(val) && val >= 1 && val <= totalFiltered) {
                            const idx = val - 1;
                            setDirection(idx > currentIndex ? 1 : -1);
                            setCurrentIndex(idx);
                            setIsFlipped(false);
                          }
                          (e.target as HTMLInputElement).value = "";
                          (e.target as HTMLInputElement).blur();
                        }
                        if (e.key === "Escape") {
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="w-14 rounded border border-border/50 bg-surface px-1.5 py-0.5 text-xs text-center placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-saffron/40 focus:border-saffron/40"
                    />
                  </div>
                </div>
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
              <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
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

            {/* Premium gate banner — shown to free users */}
            {!isActivePremium && (
              <div className="flex items-center justify-between mb-3 rounded-lg border border-saffron/20 bg-saffron/5 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="size-3 text-saffron shrink-0" />
                  <span>
                    <span className="font-semibold text-saffron">
                      {answerLimit.remaining} of {answerLimit.limit}
                    </span>{" "}
                    {answerLimit.label} remaining today — Upgrade for full access
                  </span>
                </div>
                <a
                  href="/app/pricing"
                  className="shrink-0 rounded-md bg-saffron px-2.5 py-1 text-[10px] font-bold text-background hover:opacity-90 transition-opacity"
                >
                  Upgrade
                </a>
              </div>
            )}

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
                  isFlipped={isFlipped}
                  onFlip={() => handleFlip(currentQuestion.id)}
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
                  answerLocked={!isActivePremium && !answerLimit.allowed}
                  languageFilter={preferredLanguage}
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle prev/next navigation — min 48px touch target on mobile */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-surface/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px]"
              >
                <ChevronLeft className="size-4" />
                Prev
              </button>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= totalFiltered - 1}
                className="flex items-center gap-1.5 rounded-lg border border-border/40 bg-surface/60 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-surface-hover hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed min-h-[48px]"
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
              <span>
                <kbd className="rounded border border-border/50 px-1 py-0.5 text-[9px] font-mono">
                  G
                </kbd>{" "}
                jump to #
              </span>
            </div>
          </div>

          {/* Constellation navigator — right side, hidden on mobile */}
          <div className="hidden md:block w-56 shrink-0">
            <div className="sticky top-20">
              <ConstellationNavigator
                categories={categoryData}
                activeCategory={activeCategory}
                questions={galleryQuestions}
                currentIndex={currentIndex}
                onSelectCategory={(cat) => {
                  setActiveCategory(cat as QuestionCategory);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                onSelectQuestion={(idx) => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile gallery trigger — floating button */}
      {currentQuestion && (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setShowMobileGallery(!showMobileGallery)}
            className="size-14 rounded-2xl bg-gradient-to-br from-saffron to-gold text-background font-bold shadow-lg shadow-saffron/30 flex flex-col items-center justify-center gap-0.5"
          >
            <span className="text-lg font-bold">{currentIndex + 1}</span>
            <span className="text-[8px] opacity-80">of {totalFiltered}</span>
          </button>
        </div>
      )}

      {/* Mobile drum bottom sheet */}
      {showMobileGallery && currentQuestion && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-background/95 backdrop-blur-sm rounded-t-2xl border-t border-border/30 shadow-2xl">
          <DrumPicker
            items={galleryQuestions.map(q => ({
              index: q.index,
              label: String(q.index + 1),
              status: q.status,
              bookmarked: q.bookmarked,
            }))}
            selectedIndex={currentIndex}
            onSelect={(idx) => {
              setDirection(idx > currentIndex ? 1 : -1);
              setCurrentIndex(idx);
              setIsFlipped(false);
              setShowMobileGallery(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
