"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface StarQuestion {
  id: string;
  company: string;
  principle: string;
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
  tags?: string[];
  star: StarAnswer;
  tips?: string[];
  followUps?: string[];
}

// ── Company config ────────────────────────────────────────────────────────────

const COMPANIES = [
  { name: "All", emoji: "🌟", color: "text-gold", border: "border-gold/40", bg: "bg-gold/10", activeBg: "bg-gold/20", dot: "bg-gold" },
  { name: "Amazon", emoji: "📦", color: "text-[#FF9900]", border: "border-[#FF9900]/40", bg: "bg-[#FF9900]/10", activeBg: "bg-[#FF9900]/20", dot: "bg-[#FF9900]" },
  { name: "Google", emoji: "🔍", color: "text-[#4285F4]", border: "border-[#4285F4]/40", bg: "bg-[#4285F4]/10", activeBg: "bg-[#4285F4]/20", dot: "bg-[#4285F4]" },
  { name: "Microsoft", emoji: "🪟", color: "text-[#00BCF2]", border: "border-[#00BCF2]/40", bg: "bg-[#00BCF2]/10", activeBg: "bg-[#00BCF2]/20", dot: "bg-[#00BCF2]" },
  { name: "Meta", emoji: "♾️", color: "text-[#0668E1]", border: "border-[#0668E1]/40", bg: "bg-[#0668E1]/10", activeBg: "bg-[#0668E1]/20", dot: "bg-[#0668E1]" },
  { name: "Apple", emoji: "🍎", color: "text-[#A2AAAD]", border: "border-[#A2AAAD]/40", bg: "bg-[#A2AAAD]/10", activeBg: "bg-[#A2AAAD]/20", dot: "bg-[#A2AAAD]" },
  { name: "Netflix", emoji: "🎬", color: "text-[#E50914]", border: "border-[#E50914]/40", bg: "bg-[#E50914]/10", activeBg: "bg-[#E50914]/20", dot: "bg-[#E50914]" },
];

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"] as const;
type DifficultyFilter = (typeof DIFFICULTIES)[number];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-teal border-teal/30 bg-teal/10",
  Medium: "text-gold border-gold/30 bg-gold/10",
  Hard: "text-[#E50914] border-[#E50914]/30 bg-[#E50914]/10",
};

const STAR_CONFIG = [
  {
    key: "situation" as const,
    label: "Situation",
    letter: "S",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/8",
    headerBg: "bg-blue-500/15",
    dot: "bg-blue-400",
    description: "Set the scene — what was the context and background?",
  },
  {
    key: "task" as const,
    label: "Task",
    letter: "T",
    color: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    headerBg: "bg-amber-500/15",
    dot: "bg-amber-400",
    description: "What was your specific responsibility or challenge?",
  },
  {
    key: "action" as const,
    label: "Action",
    letter: "A",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    headerBg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
    description: "What steps did YOU specifically take?",
  },
  {
    key: "result" as const,
    label: "Result",
    letter: "R",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/8",
    headerBg: "bg-purple-500/15",
    dot: "bg-purple-400",
    description: "What was the measurable outcome?",
  },
];

// ── Local storage helpers ─────────────────────────────────────────────────────

const BOOKMARK_KEY = "star_bookmarks";

function getBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARK_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveBookmarks(set: Set<string>) {
  try {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify([...set]));
  } catch {}
}

// ── Practice Mode textarea ────────────────────────────────────────────────────

function PracticeArea({
  questionId,
  starKey,
  placeholder,
}: {
  questionId: string;
  starKey: string;
  placeholder: string;
}) {
  const storageKey = `star_practice_${questionId}_${starKey}`;
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(storageKey) ?? "";
    } catch {
      return "";
    }
  });

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    try {
      localStorage.setItem(storageKey, e.target.value);
    } catch {}
  }

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      rows={3}
      className="w-full resize-none rounded-lg border border-border/50 bg-background/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-saffron/40 transition-all"
    />
  );
}

// ── Single STAR Card ──────────────────────────────────────────────────────────

function StarCard({
  q,
  isExpanded,
  onToggle,
  isBookmarked,
  onToggleBookmark,
}: {
  q: StarQuestion;
  isExpanded: boolean;
  onToggle: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  const [showSample, setShowSample] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);

  const company = COMPANIES.find((c) => c.name === q.company) ?? COMPANIES[0];

  // Reset inner state when card collapses
  useEffect(() => {
    if (!isExpanded) {
      setShowSample(false);
      setPracticeMode(false);
    }
  }, [isExpanded]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isExpanded
          ? "border-saffron/30 shadow-lg shadow-saffron/5"
          : "border-border/50 hover:border-border"
      } bg-surface`}
    >
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 flex items-start gap-3 cursor-pointer group"
      >
        {/* Company badge */}
        <span
          className={`shrink-0 mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg border text-base font-bold ${company.border} ${company.bg}`}
        >
          {company.emoji}
        </span>

        {/* Question text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug group-hover:text-saffron/90 transition-colors">
            {q.question}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Company label */}
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${company.color}`}>
              {q.company}
            </span>
            <span className="text-border/60">·</span>
            {/* Principle */}
            <span className="text-[10px] text-muted-foreground">{q.principle}</span>
            <span className="text-border/60">·</span>
            {/* Difficulty */}
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}
            >
              {q.difficulty}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* Bookmark button */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                onToggleBookmark();
              }
            }}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isBookmarked
                ? "text-gold bg-gold/15 border border-gold/30"
                : "text-muted-foreground hover:text-gold hover:bg-gold/10 border border-transparent"
            }`}
            title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
          >
            {isBookmarked ? "★" : "☆"}
          </span>

          {/* Expand/collapse chevron */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-muted-foreground text-sm leading-none"
          >
            ▾
          </motion.span>
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-4 pb-4 border-t border-border/30">
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-3 mb-4">
                {(q.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Practice / Sample toggle */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setPracticeMode(false); setShowSample(false); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    !practiceMode
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  View Sample Answer
                </button>
                <button
                  type="button"
                  onClick={() => { setPracticeMode(true); setShowSample(false); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    practiceMode
                      ? "border-teal/40 bg-teal/10 text-teal"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  Practice Mode
                </button>
              </div>

              <AnimatePresence mode="wait">
                {/* ── Practice Mode ── */}
                {practiceMode && (
                  <motion.div
                    key="practice"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/20 rounded-lg p-3 border border-border/30">
                      Write your own STAR answer below. Your responses are saved locally.
                      When you&apos;re done, switch to &quot;View Sample Answer&quot; to compare.
                    </p>
                    {STAR_CONFIG.map((s) => (
                      <div key={s.key} className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}>
                        <div className={`flex items-center gap-2 px-3 py-2 ${s.headerBg} border-b ${s.border}`}>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs border ${s.border} ${s.color} bg-background/40`}>
                            {s.letter}
                          </span>
                          <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">{s.description}</span>
                        </div>
                        <div className="p-3">
                          <PracticeArea
                            questionId={q.id}
                            starKey={s.key}
                            placeholder={`Write your ${s.label.toLowerCase()} here…`}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setShowSample(true); setPracticeMode(false); }}
                      className="w-full rounded-xl border border-saffron/30 bg-saffron/10 py-2.5 text-xs font-semibold text-saffron hover:bg-saffron/15 transition-colors cursor-pointer"
                    >
                      Compare with Sample Answer →
                    </button>
                  </motion.div>
                )}

                {/* ── Sample Answer ── */}
                {!practiceMode && (
                  <motion.div
                    key="sample"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {!showSample ? (
                      <div className="rounded-xl border border-border/40 bg-muted/20 p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-1">
                          A premium-quality sample STAR answer is ready.
                        </p>
                        <p className="text-xs text-muted-foreground/70 mb-4">
                          Try the question yourself first — or reveal to study the structure.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowSample(true)}
                          className="rounded-xl bg-gradient-to-r from-saffron to-gold px-5 py-2.5 text-sm font-bold text-background hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-saffron/20"
                        >
                          Reveal Sample Answer
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        {STAR_CONFIG.map((s, i) => (
                          <motion.div
                            key={s.key}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.25 }}
                            className={`rounded-xl border ${s.border} ${s.bg} overflow-hidden`}
                          >
                            {/* Section header */}
                            <div className={`flex items-center gap-2.5 px-4 py-2.5 ${s.headerBg} border-b ${s.border}`}>
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-sm border ${s.border} ${s.color} bg-background/50`}
                              >
                                {s.letter}
                              </span>
                              <div>
                                <span className={`text-xs font-bold uppercase tracking-wider ${s.color}`}>
                                  {s.label}
                                </span>
                                <span className="text-[10px] text-muted-foreground ml-2">
                                  {s.description}
                                </span>
                              </div>
                            </div>
                            {/* Section body */}
                            <div className="px-4 py-3">
                              <p className="text-sm text-foreground/90 leading-relaxed">
                                {q.star[s.key]}
                              </p>
                            </div>
                          </motion.div>
                        ))}

                        {/* Key takeaway bar */}
                        <div className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/5 to-saffron/5 px-4 py-3 flex items-start gap-3">
                          <span className="text-base mt-0.5">💡</span>
                          <div>
                            <p className="text-xs font-semibold text-gold mb-1">Pro Tips for This Answer</p>
                            <ul className="text-xs text-muted-foreground space-y-1 list-none">
                              <li>• Lead with the business impact — interviewers evaluate results first</li>
                              <li>• Use specific numbers and metrics wherever possible</li>
                              <li>• &quot;I&quot; not &quot;We&quot; — own your individual contribution clearly</li>
                              <li>• Keep Situation and Task brief; Action and Result deserve the most airtime</li>
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function StarSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border/40 bg-surface p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/60 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted/60 rounded w-4/5" />
              <div className="h-3 bg-muted/40 rounded w-2/5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── STAR Legend ───────────────────────────────────────────────────────────────

function StarLegend() {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {STAR_CONFIG.map((s) => (
        <span
          key={s.key}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${s.border} ${s.bg} ${s.color}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.letter} — {s.label}
        </span>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function StarSection() {
  const [questions, setQuestions] = useState<StarQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState("All");
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyFilter>("All");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const tabsRef = useRef<HTMLDivElement>(null);

  // Load questions — handles both flat array and company-grouped format
  useEffect(() => {
    fetch("/content/star-questions.json")
      .then((r) => r.json())
      .then((data: unknown) => {
        let flat: StarQuestion[] = [];
        if (Array.isArray(data) && data.length > 0) {
          if ("questions" in (data[0] as Record<string, unknown>)) {
            // Company-grouped format: [{company, questions: [...]}, ...]
            for (const group of data as { company: string; questions: Record<string, unknown>[] }[]) {
              for (const q of group.questions) {
                flat.push({
                  id: String(q.id ?? flat.length + 1),
                  company: (q.company as string) ?? group.company,
                  principle: (q.principle as string) ?? "",
                  difficulty: (q.difficulty as "Easy" | "Medium" | "Hard") ?? "Medium",
                  question: (q.question as string) ?? "",
                  tags: (q.tags as string[]) ?? [],
                  star: (q.starAnswer ?? q.star) as StarAnswer,
                  tips: (q.tips as string[]) ?? [],
                  followUps: (q.followUps as string[]) ?? [],
                });
              }
            }
          } else {
            // Flat format: [{id, company, question, star, ...}, ...]
            flat = data as StarQuestion[];
          }
        }
        setQuestions(flat);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load bookmarks from localStorage
  useEffect(() => {
    setBookmarks(getBookmarks());
  }, []);

  function toggleBookmark(id: string) {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveBookmarks(next);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // Filter logic
  const filtered = questions.filter((q) => {
    if (showBookmarksOnly && !bookmarks.has(q.id)) return false;
    if (activeCompany !== "All" && q.company !== activeCompany) return false;
    if (activeDifficulty !== "All" && q.difficulty !== activeDifficulty) return false;
    return true;
  });

  return (
    <section>
      {/* Section Header */}
      <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-surface to-indigo/5 overflow-hidden mb-4">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-saffron/10 to-gold/5 border-b border-saffron/15">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⭐</span>
            <div>
              <h2 className="font-heading text-base font-bold text-foreground tracking-tight leading-none">
                STAR Interview Prep
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide">
                Situation · Task · Action · Result
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold text-gold">
              {questions.length} Questions
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-teal/30 bg-teal/10 px-2.5 py-1 text-[10px] font-semibold text-teal">
              FAANG Ready
            </span>
          </div>
        </div>

        {/* Company tabs */}
        <div
          ref={tabsRef}
          className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto category-tabs"
          style={{ scrollbarWidth: "none" }}
        >
          {COMPANIES.map((company) => {
            const isActive = activeCompany === company.name;
            return (
              <button
                key={company.name}
                type="button"
                onClick={() => setActiveCompany(company.name)}
                className={`shrink-0 flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? `${company.border} ${company.activeBg} ${company.color}`
                    : `border-border/40 text-muted-foreground hover:${company.border} hover:${company.bg}`
                }`}
              >
                <span className="text-sm">{company.emoji}</span>
                <span>{company.name}</span>
                {isActive && (
                  <motion.span
                    layoutId="company-active-dot"
                    className={`w-1.5 h-1.5 rounded-full ${company.dot ?? "bg-gold"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 flex-wrap px-4 pb-3">
          {/* Difficulty filters */}
          <div className="flex items-center gap-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDifficulty(d)}
                className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
                  activeDifficulty === d
                    ? d === "All"
                      ? "border-saffron/40 bg-saffron/10 text-saffron"
                      : DIFFICULTY_COLORS[d]
                    : "border-border/40 text-muted-foreground hover:border-border"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bookmark filter */}
          <button
            type="button"
            onClick={() => setShowBookmarksOnly((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              showBookmarksOnly
                ? "border-gold/40 bg-gold/15 text-gold"
                : "border-border/40 text-muted-foreground hover:border-border hover:text-gold/70"
            }`}
          >
            {showBookmarksOnly ? "★" : "☆"} Bookmarked
            {bookmarks.size > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold/20 text-gold text-[9px] font-bold">
                {bookmarks.size}
              </span>
            )}
          </button>

          {/* Result count */}
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} of {questions.length}
          </span>
        </div>
      </div>

      {/* STAR Legend */}
      <div className="mb-3">
        <StarLegend />
      </div>

      {/* Questions list */}
      {loading ? (
        <StarSkeleton />
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 py-12 text-center">
          <p className="text-2xl mb-2">
            {showBookmarksOnly ? "★" : "🔍"}
          </p>
          <p className="text-sm text-muted-foreground">
            {showBookmarksOnly
              ? "No bookmarked questions yet. Star a question to save it here."
              : "No questions match your current filters."}
          </p>
          {(activeCompany !== "All" || activeDifficulty !== "All") && (
            <button
              type="button"
              onClick={() => { setActiveCompany("All"); setActiveDifficulty("All"); }}
              className="mt-3 text-xs text-saffron hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((q) => (
              <StarCard
                key={q.id}
                q={q}
                isExpanded={expandedId === q.id}
                onToggle={() => toggleExpand(q.id)}
                isBookmarked={bookmarks.has(q.id)}
                onToggleBookmark={() => toggleBookmark(q.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Footer note */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-indigo/20 bg-indigo/5 px-4 py-3">
        <span className="text-base">🎯</span>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-indigo">Practice Tip:</span> Use the Practice Mode
          to write your own answer first — then reveal the sample. Studies show recall is 2x better
          with active retrieval than passive reading.
        </p>
      </div>
    </section>
  );
}
