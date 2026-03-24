"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { PremiumGate } from "@/components/premium-gate";
import { Lock, ChevronDown, Building2 } from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TechQuestion {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  topic: string;
}

// ── Company config ────────────────────────────────────────────────────────────

const COMPANIES = [
  { name: "All", emoji: "🌟", color: "text-gold", border: "border-gold/40", bg: "bg-gold/10", activeBg: "bg-gold/20" },
  { name: "Google", emoji: "🔍", color: "text-[#4285F4]", border: "border-[#4285F4]/40", bg: "bg-[#4285F4]/10", activeBg: "bg-[#4285F4]/20" },
  { name: "Amazon", emoji: "📦", color: "text-[#FF9900]", border: "border-[#FF9900]/40", bg: "bg-[#FF9900]/10", activeBg: "bg-[#FF9900]/20" },
  { name: "Microsoft", emoji: "🪟", color: "text-[#00BCF2]", border: "border-[#00BCF2]/40", bg: "bg-[#00BCF2]/10", activeBg: "bg-[#00BCF2]/20" },
  { name: "Meta", emoji: "♾️", color: "text-[#0668E1]", border: "border-[#0668E1]/40", bg: "bg-[#0668E1]/10", activeBg: "bg-[#0668E1]/20" },
  { name: "Apple", emoji: "🍎", color: "text-[#A2AAAD]", border: "border-[#A2AAAD]/40", bg: "bg-[#A2AAAD]/10", activeBg: "bg-[#A2AAAD]/20" },
  { name: "Netflix", emoji: "🎬", color: "text-[#E50914]", border: "border-[#E50914]/40", bg: "bg-[#E50914]/10", activeBg: "bg-[#E50914]/20" },
];

const FREE_ANSWER_LIMIT = 3;

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({
  q,
  index,
  isExpanded,
  onToggle,
  answerLocked,
}: {
  q: TechQuestion;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  answerLocked: boolean;
}) {
  const company = COMPANIES.find((c) => c.name === q.category) ?? COMPANIES[0];

  return (
    <div className="rounded-xl border border-border/40 bg-surface overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/10 transition-colors cursor-pointer"
      >
        <span className={`shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg border text-sm ${company.border} ${company.bg}`}>
          {company.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${company.color}`}>
              {q.category}
            </span>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className="text-[10px] text-muted-foreground">{q.topic}</span>
            <span className="text-[10px] text-muted-foreground">•</span>
            <span className={`text-[10px] font-medium ${q.difficulty === "Hard" ? "text-red-400" : "text-gold"}`}>
              {q.difficulty}
            </span>
          </div>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/30">
              {answerLocked ? (
                <div className="py-4">
                  <PremiumGate feature="full-answers" overlay={false} />
                </div>
              ) : (
                <div className="pt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {q.answer}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CompanyQuestionsSection() {
  const [questions, setQuestions] = useState<TechQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCompany, setActiveCompany] = useState("All");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const { isPremium, premiumUntil } = useStore();
  const isActivePremium = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  // Load questions
  useEffect(() => {
    fetch("/content/company-tech-qa.json")
      .then((r) => r.json())
      .then((data: TechQuestion[]) => {
        setQuestions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeCompany === "All"
    ? questions
    : questions.filter((q) => q.category === activeCompany);

  function handleToggle(index: number) {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
      if (!isActivePremium && revealedCount < FREE_ANSWER_LIMIT) {
        setRevealedCount((c) => c + 1);
      }
    }
  }

  function isAnswerLocked(index: number): boolean {
    if (isActivePremium) return false;
    return revealedCount >= FREE_ANSWER_LIMIT && expandedIndex !== index;
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-surface p-6 space-y-4 animate-pulse">
        <div className="h-5 w-48 bg-muted/40 rounded" />
        <div className="h-4 w-full bg-muted/30 rounded" />
        <div className="h-4 w-3/4 bg-muted/30 rounded" />
      </div>
    );
  }

  if (questions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-saffron/30 bg-saffron/10">
            <Building2 className="size-4 text-saffron" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold">Company Interview Questions</h2>
            <p className="text-xs text-muted-foreground">
              Technical questions asked at top tech companies
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold text-gold">
            {questions.length} Questions
          </span>
          {!isActivePremium && (
            <span className="inline-flex items-center gap-1 rounded-full border border-saffron/30 bg-saffron/10 px-2.5 py-1 text-[10px] font-semibold text-saffron">
              <Lock className="size-2.5" />
              {Math.min(revealedCount, FREE_ANSWER_LIMIT)}/{FREE_ANSWER_LIMIT} free
            </span>
          )}
        </div>
      </div>

      {/* Company tabs */}
      <div className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {COMPANIES.map((company) => {
          const isActive = activeCompany === company.name;
          const count = company.name === "All" ? questions.length : questions.filter((q) => q.category === company.name).length;
          return (
            <button
              key={company.name}
              onClick={() => { setActiveCompany(company.name); setExpandedIndex(null); }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? `${company.border} ${company.activeBg} ${company.color}`
                  : "border-border/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="text-sm">{company.emoji}</span>
              <span>{company.name}</span>
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Questions list */}
      <div className="px-4 pb-4 space-y-2 max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {filtered.slice(0, 10).map((q, i) => (
          <QuestionCard
            key={`${q.category}-${i}`}
            q={q}
            index={i}
            isExpanded={expandedIndex === i}
            onToggle={() => handleToggle(i)}
            answerLocked={isAnswerLocked(i)}
          />
        ))}
        {filtered.length > 10 && (
          <Link
            href="/app/questions"
            className="flex items-center justify-center gap-2 rounded-xl border border-saffron/30 bg-saffron/5 px-4 py-3 text-sm font-medium text-saffron hover:bg-saffron/10 transition-colors"
          >
            View all {filtered.length} questions →
          </Link>
        )}
      </div>
    </div>
  );
}
