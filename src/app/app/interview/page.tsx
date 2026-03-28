"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Mic, MicOff, Send, Clock, RotateCcw, Trophy, ChevronDown, ArrowLeft, Lightbulb, SkipForward, BookOpen } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { PageTransition } from "@/components/page-transition";
import { PremiumGate } from "@/components/premium-gate";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { generateFlashcardsFromInterview } from "@/lib/flashcard-generator";
import { sounds } from "@/lib/audio";
import { getUserStats, checkAndUnlockBadges } from "@/lib/gamification/badges";
import { shouldDropChest, recordChest, generateChestContents } from "@/lib/gamification/treasure-chests";
import { checkOneMoreRound, type OneMoreRoundTrigger } from "@/lib/gamification/one-more-round";
import { xpProgressInLevel } from "@/lib/gamification/xp";

// ── Types ─────────────────────────────────────────────────────────────────────

interface InterviewQuestion {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
  company?: string;
  type: "technical" | "behavioral";
}

interface ChatMessage {
  id: string;
  role: "interviewer" | "user" | "feedback";
  content: string;
  timestamp: Date;
}

interface ScoreResult {
  score: number;
  matchedKeywords: string[];
  missedKeywords: string[];
}

interface InterviewConfig {
  company: string;
  type: "technical" | "behavioral" | "mixed";
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed";
  topic: string; // "All" or specific topic like "System Design", "Java", "Kafka"
}

interface InterviewRound {
  label: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: InterviewQuestion[];
  isBoss: boolean;
}

// ── Round builder ──────────────────────────────────────────────────────────────

function buildRounds(allQuestions: InterviewQuestion[], isPro: boolean): InterviewRound[] {
  const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const easy = shuffle(allQuestions.filter(q => q.difficulty === "Easy"));
  const medium = shuffle(allQuestions.filter(q => q.difficulty === "Medium"));
  const hard = shuffle(allQuestions.filter(q => q.difficulty === "Hard"));
  const allShuffled = shuffle(allQuestions);

  // Helper: pick N from pool, falling back to allShuffled if not enough
  const pick = (pool: InterviewQuestion[], n: number, exclude: Set<string>): InterviewQuestion[] => {
    const filtered = pool.filter(q => !exclude.has(q.question));
    if (filtered.length >= n) return filtered.slice(0, n);
    const remaining = allShuffled.filter(q => !exclude.has(q.question));
    return [...filtered, ...remaining].slice(0, n);
  };

  const used = new Set<string>();

  const easyCount = isPro ? 2 : 1;
  const mediumCount = isPro ? 3 : 1;
  const hardCount = isPro ? 3 : 1;

  const easyPicked = pick(easy, easyCount, used);
  easyPicked.forEach(q => used.add(q.question));

  const mediumPicked = pick(medium, mediumCount, used);
  mediumPicked.forEach(q => used.add(q.question));

  const hardPicked = pick(hard, hardCount, used);

  return [
    { label: "Round 1: Warm-Up", difficulty: "Easy", questions: easyPicked, isBoss: false },
    { label: "Round 2: Deep Dive", difficulty: "Medium", questions: mediumPicked, isBoss: false },
    { label: "Round 3: Boss Round", difficulty: "Hard", questions: hardPicked, isBoss: true },
  ];
}

// Helper: flatten rounds into a single question array
function flattenRounds(rounds: InterviewRound[]): InterviewQuestion[] {
  return rounds.flatMap(r => r.questions);
}

// Helper: find which round a global question index belongs to
function getRoundForIndex(rounds: InterviewRound[], globalIndex: number): { roundIndex: number; localIndex: number } {
  let offset = 0;
  for (let i = 0; i < rounds.length; i++) {
    if (globalIndex < offset + rounds[i].questions.length) {
      return { roundIndex: i, localIndex: globalIndex - offset };
    }
    offset += rounds[i].questions.length;
  }
  return { roundIndex: rounds.length - 1, localIndex: 0 };
}

// Helper: get the first global index of a round
function getRoundStartIndex(rounds: InterviewRound[], roundIndex: number): number {
  let offset = 0;
  for (let i = 0; i < roundIndex; i++) {
    offset += rounds[i].questions.length;
  }
  return offset;
}

const TOPICS = [
  "All Topics",
  "System Design",
  "Data Structures",
  "Algorithms",
  "Java",
  "Spring Boot",
  "Microservices",
  "Database / SQL",
  "Kafka",
  "AWS",
  "Kubernetes / Docker",
  "Design Patterns",
  "Concurrency",
  "Production & Debugging",
];

type InterviewPhase = "setup" | "active" | "complete";

// ── Company definitions ────────────────────────────────────────────────────────

const COMPANIES = [
  { id: "Google", label: "Google", emoji: "G", color: "from-blue-600 to-green-500", bgClass: "bg-gradient-to-br from-blue-600 to-green-500" },
  { id: "Amazon", label: "Amazon", emoji: "A", color: "from-orange-500 to-yellow-400", bgClass: "bg-gradient-to-br from-orange-500 to-yellow-400" },
  { id: "Microsoft", label: "Microsoft", emoji: "M", color: "from-blue-500 to-cyan-400", bgClass: "bg-gradient-to-br from-blue-500 to-cyan-400" },
  { id: "Meta", label: "Meta", emoji: "M", color: "from-blue-600 to-indigo-600", bgClass: "bg-gradient-to-br from-blue-600 to-indigo-600" },
  { id: "Apple", label: "Apple", emoji: "A", color: "from-gray-600 to-gray-400", bgClass: "bg-gradient-to-br from-gray-600 to-gray-400" },
  { id: "General", label: "Any Company", emoji: "?", color: "from-saffron to-gold", bgClass: "bg-gradient-to-br from-amber-500 to-yellow-400" },
];

const STOP_WORDS = new Set([
  "the", "and", "for", "that", "this", "with", "from", "have", "will",
  "when", "each", "which", "their", "about", "using", "would", "should",
  "could", "these", "those", "into", "also", "been", "more", "than",
  "some", "very", "just", "like", "make", "over", "such", "your", "they",
  "them", "then", "than", "here", "there", "what", "where", "were",
  "does", "done", "after", "before", "while", "since", "until", "both",
  "only", "either", "neither", "always", "never", "often", "well",
]);

// ── Keyword scoring ────────────────────────────────────────────────────────────

function scoreAnswer(userAnswer: string, modelAnswer: string): ScoreResult {
  // Extract important technical keywords and multi-word phrases
  const modelLower = modelAnswer.toLowerCase();

  // Get single keywords (4+ chars, not stop words)
  const singleKeywords = [
    ...new Set(
      modelLower
        .match(/\b[a-z]{4,}\b/g)
        ?.filter((w) => !STOP_WORDS.has(w)) ?? []
    ),
  ];

  // Also extract technical terms (capitalized words, acronyms, hyphenated terms from original)
  const techTerms = [
    ...new Set(
      modelAnswer
        .match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g)
        ?.map((t) => t.toLowerCase()) ?? []
    ),
  ];

  // Combine and deduplicate — prioritize technical terms
  const allKeywords = [...new Set([...techTerms, ...singleKeywords])];
  // Take top 20 most important (longer words = more important)
  const keywords = allKeywords
    .sort((a, b) => b.length - a.length)
    .slice(0, 20);

  const userLower = userAnswer.toLowerCase();
  const matched = keywords.filter((k) => userLower.includes(k));
  const missed = keywords.filter((k) => !userLower.includes(k)).slice(0, 6);

  // Score: matched/total, with a bonus for mentioning many keywords
  const score = Math.min(
    10,
    Math.round((matched.length / Math.max(keywords.length, 1)) * 10)
  );

  return {
    score,
    matchedKeywords: matched.slice(0, 6),
    missedKeywords: missed,
  };
}

// ── Question loader ────────────────────────────────────────────────────────────

async function loadInterviewQuestions(
  config: InterviewConfig,
  count: number
): Promise<InterviewQuestion[]> {
  const questions: InterviewQuestion[] = [];

  if (config.type === "technical" || config.type === "mixed") {
    // Load company-specific tech questions
    try {
      const res = await fetch("/content/company-tech-qa.json");
      if (res.ok) {
        const data = (await res.json()) as {
          question: string;
          answer: string;
          category: string;
          difficulty: string;
          topic?: string;
        }[];

        let filtered = config.company === "General"
          ? data
          : data.filter((q) => q.category === config.company);

        // Filter by topic if not "All Topics"
        if (config.topic !== "All Topics") {
          const topicLower = config.topic.toLowerCase();
          const topicFiltered = filtered.filter((q) =>
            (q.topic ?? "").toLowerCase().includes(topicLower) ||
            q.question.toLowerCase().includes(topicLower) ||
            q.answer.toLowerCase().includes(topicLower)
          );
          if (topicFiltered.length >= 2) filtered = topicFiltered;
        }

        const diffFiltered = config.difficulty === "Mixed"
          ? filtered
          : filtered.filter((q) => q.difficulty === config.difficulty);

        const pool = diffFiltered.length >= 3 ? diffFiltered : filtered;
        for (const q of pool) {
          questions.push({
            question: q.question,
            answer: q.answer,
            category: q.category,
            difficulty: q.difficulty,
            company: q.category,
            type: "technical",
          });
        }
      }
    } catch { /* ignore */ }

    // Also load topic-specific questions from the main Q&A files
    if (config.topic !== "All Topics") {
      const qaFiles = [
        "/content/kafka-qa.json",
        "/content/aws-qa.json",
        "/content/k8s-docker-qa.json",
        "/content/design-patterns-qa.json",
      ];
      const topicLower = config.topic.toLowerCase();
      const fileResults = await Promise.allSettled(
        qaFiles.map((f) => fetch(f).then((r) => r.ok ? r.json() : []))
      );
      for (const result of fileResults) {
        if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
        for (const q of result.value as { question: string; answer: string; category?: string; difficulty?: string }[]) {
          if (
            q.question.toLowerCase().includes(topicLower) ||
            (q.answer ?? "").toLowerCase().includes(topicLower) ||
            (q.category ?? "").toLowerCase().includes(topicLower)
          ) {
            questions.push({
              question: q.question,
              answer: q.answer ?? "",
              category: q.category ?? config.topic,
              difficulty: q.difficulty ?? "Medium",
              company: config.company,
              type: "technical",
            });
          }
        }
      }
    }
  }

  if (config.type === "behavioral" || config.type === "mixed") {
    try {
      const res = await fetch("/content/star-questions.json");
      if (res.ok) {
        const data = (await res.json()) as {
          company: string;
          questions: {
            question: string;
            difficulty?: string;
            starAnswer: {
              situation: string;
              task: string;
              action: string;
              result: string;
            };
          }[];
        }[];

        const companyBlocks =
          config.company === "General"
            ? data
            : data.filter((b) => b.company === config.company);

        const fallback = companyBlocks.length === 0 ? data : companyBlocks;

        for (const block of fallback) {
          for (const q of block.questions ?? []) {
            const { situation, task, action, result } = q.starAnswer ?? {};
            const modelAnswer = [
              situation ?? "",
              task ?? "",
              action ?? "",
              result ?? "",
            ].join(" ");
            questions.push({
              question: q.question,
              answer: modelAnswer,
              category: "Behavioral",
              difficulty: q.difficulty ?? "Medium",
              company: block.company,
              type: "behavioral",
            });
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // Shuffle
  const shuffled = [...questions].sort(() => Math.random() - 0.5);

  // For mixed: interleave technical and behavioral
  if (config.type === "mixed") {
    const tech = shuffled.filter((q) => q.type === "technical");
    const beh = shuffled.filter((q) => q.type === "behavioral");
    const result: InterviewQuestion[] = [];
    const totalNeeded = count;
    const behavCount = Math.floor(totalNeeded / 3);
    const techCount = totalNeeded - behavCount;
    result.push(...tech.slice(0, techCount));
    result.push(...beh.slice(0, behavCount));
    return result.sort(() => Math.random() - 0.5).slice(0, count);
  }

  return shuffled.slice(0, count);
}

// ── Typing indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-end gap-2"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo/20 border border-indigo/30 text-sm font-bold text-indigo">
        AI
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2 w-2 rounded-full bg-muted-foreground"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Score badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "border-green-500/40 bg-green-500/10 text-green-400"
      : score >= 5
      ? "border-saffron/40 bg-saffron/10 text-saffron"
      : "border-red-500/40 bg-red-500/10 text-red-400";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {score}/10
    </span>
  );
}


// ── Power-up bar ───────────────────────────────────────────────────────────────

interface PowerUpBarProps {
  onHint: () => void;
  onSkip: () => void;
  onPhoneAFriend: () => void;
  hintTokens: number;
  coins: number;
  hintsUsed: number;
  skipsUsed: number;
}

function PowerUpBar({
  onHint,
  onSkip,
  onPhoneAFriend,
  hintTokens,
  coins,
  hintsUsed,
  skipsUsed,
}: PowerUpBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-surface/50 rounded-lg border border-border/30 flex-wrap">
      <button
        onClick={onHint}
        disabled={hintTokens <= 0}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-medium hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Reveal key concepts from the answer"
      >
        <Lightbulb className="size-3.5" />
        Hint ({hintTokens})
      </button>

      <button
        onClick={onSkip}
        disabled={coins < 50 || skipsUsed >= 2}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Skip this question (50 coins)"
      >
        <SkipForward className="size-3.5" />
        Skip (50c)
      </button>

      <button
        onClick={onPhoneAFriend}
        disabled={coins < 30}
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Get a brief hint from the answer (30 coins)"
      >
        <BookOpen className="size-3.5" />
        Friend (30c)
      </button>
    </div>
  );
}

// ── Countdown bar ──────────────────────────────────────────────────────────────

function CountdownBar({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  const MAX_TIME = 180; // 3 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const progress = Math.max(0, 1 - elapsed / MAX_TIME);
  const color =
    elapsed < 60 ? "bg-emerald-500" : elapsed < 120 ? "bg-yellow-500" : "bg-red-500";
  const bonusLabel =
    elapsed < 60
      ? "Speed Bonus: 2x"
      : elapsed < 120
      ? "Speed Bonus: 1.5x"
      : elapsed < 180
      ? "Normal"
      : "0.75x";

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{elapsed}s</span>
        <span>{bonusLabel}</span>
      </div>
    </div>
  );
}

// ── Setup screen ───────────────────────────────────────────────────────────────

interface SetupScreenProps {
  onStart: (config: InterviewConfig) => void;
}

function SetupScreen({ onStart }: SetupScreenProps) {
  const [company, setCompany] = useState<string>("Google");
  const [type, setType] = useState<"technical" | "behavioral" | "mixed">("technical");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "Mixed">("Mixed");
  const [topic, setTopic] = useState<string>("All Topics");

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo/30 bg-indigo/10 px-4 py-1.5 text-xs font-semibold text-indigo uppercase tracking-wider">
            <Mic className="size-3.5" />
            Live AI Interviewer
          </div>
          <h1 className="font-heading text-3xl font-bold">
            Mock Interview Simulator
          </h1>
          <p className="text-sm text-muted-foreground">
            Powered by 828 pre-generated interview questions — no AI API needed.
            <br />
            Get real-time feedback on your answers using keyword analysis.
          </p>
        </div>

        {/* Company selection */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Select Company
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {COMPANIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCompany(c.id)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
                  company === c.id
                    ? "border-saffron/60 bg-saffron/10 scale-105 shadow-md shadow-saffron/10"
                    : "border-border/50 bg-surface hover:bg-surface-hover hover:scale-[1.02]"
                }`}
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-full text-white font-bold text-sm ${c.bgClass}`}
                >
                  {c.emoji}
                </div>
                <span className="text-xs font-medium leading-tight">{c.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Interview type */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Interview Type
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["technical", "behavioral", "mixed"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  type === t
                    ? "border-indigo/50 bg-indigo/10"
                    : "border-border/50 bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className="text-xl mb-1">
                  {t === "technical" ? "💻" : t === "behavioral" ? "🧠" : "🔀"}
                </div>
                <p className="text-sm font-semibold capitalize">{t}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t === "technical"
                    ? "Coding & system design"
                    : t === "behavioral"
                    ? "STAR method questions"
                    : "Both types mixed"}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Difficulty
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["Easy", "Medium", "Hard", "Mixed"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-xl border p-3 text-center text-sm font-medium transition-all ${
                  difficulty === d
                    ? d === "Easy"
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : d === "Medium"
                      ? "border-saffron/50 bg-saffron/10 text-saffron"
                      : d === "Hard"
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-indigo/50 bg-indigo/10 text-indigo"
                    : "border-border/50 bg-surface hover:bg-surface-hover text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "Easy" ? "Easy" : d === "Medium" ? "Medium" : d === "Hard" ? "Hard" : "Random"}
              </button>
            ))}
          </div>
        </section>

        {/* Topic filter */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Focus Topic
          </h2>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  topic === t
                    ? "border-teal/50 bg-teal/10 text-teal"
                    : "border-border/50 bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Start button */}
        <button
          type="button"
          onClick={() => onStart({ company, type, difficulty, topic })}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-saffron px-6 py-4 text-base font-semibold text-background transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-saffron/20"
        >
          <Mic className="size-4" />
          Start Interview
          <ChevronRight className="size-4" />
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Free: 3 questions per session &bull; Pro: 8 questions per session
        </p>
      </div>
    </PageTransition>
  );
}

// ── Results screen ─────────────────────────────────────────────────────────────

interface InterviewRewards {
  xp: number;
  coins: number;
  newBadges: { name: string; icon: string }[];
  chestDropped: boolean;
  oneMoreRound: OneMoreRoundTrigger | null;
  avgSpeedMultiplier: number;
}

interface ResultsScreenProps {
  messages: ChatMessage[];
  scores: number[];
  config: InterviewConfig;
  questions: InterviewQuestion[];
  rounds: InterviewRound[];
  onRestart: () => void;
  elapsed: number;
  rewards: InterviewRewards | null;
  hintsUsed: number;
  skipsUsed: number;
}

function ResultsScreen({
  scores,
  config,
  questions,
  rounds,
  onRestart,
  elapsed,
  rewards,
  hintsUsed,
  skipsUsed,
}: ResultsScreenProps) {
  const avg = scores.length > 0
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10)
    : 0;

  const strong = scores
    .map((s, i) => ({ s, q: questions[i] }))
    .filter((x) => x.s >= 7)
    .map((x) => x.q?.category ?? "");

  const weak = scores
    .map((s, i) => ({ s, q: questions[i] }))
    .filter((x) => x.s < 5)
    .map((x) => x.q?.category ?? "");

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const grade =
    avg >= 80 ? "Excellent" : avg >= 60 ? "Good" : avg >= 40 ? "Needs Work" : "Keep Practicing";
  const gradeColor =
    avg >= 80
      ? "text-green-400"
      : avg >= 60
      ? "text-saffron"
      : avg >= 40
      ? "text-amber-400"
      : "text-red-400";

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Score card */}
        <div className="rounded-2xl border border-saffron/20 bg-gradient-to-br from-saffron/5 via-gold/5 to-indigo/5 p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="size-6 text-gold" />
            <h2 className="font-heading text-2xl font-bold">Interview Complete!</h2>
          </div>
          <div className={`font-heading text-6xl font-bold mb-2 ${gradeColor}`}>
            {avg}%
          </div>
          <p className={`text-lg font-semibold mb-1 ${gradeColor}`}>{grade}</p>
          <p className="text-sm text-muted-foreground">
            {scores.length} questions &bull; {config.company} &bull; {config.type} &bull;{" "}
            {minutes}m {seconds}s
          </p>

          {/* Rewards earned */}
          {rewards && (rewards.xp > 0 || rewards.coins > 0) && (
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {rewards.xp > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-saffron/10 text-saffron text-sm font-semibold">
                  +{rewards.xp} XP
                </div>
              )}
              {rewards.coins > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-sm font-semibold">
                  +{rewards.coins} coins
                </div>
              )}
              {rewards.avgSpeedMultiplier > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
                  {rewards.avgSpeedMultiplier.toFixed(1)}x Speed Bonus
                </div>
              )}
            </div>
          )}

          {/* New badges */}
          {rewards && rewards.newBadges.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {rewards.newBadges.map((b) => (
                <div
                  key={b.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo/30 bg-indigo/10 text-sm font-medium text-indigo"
                >
                  <span>{b.icon}</span> {b.name}
                </div>
              ))}
            </div>
          )}

          {/* Treasure chest */}
          {rewards?.chestDropped && (
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-sm font-medium text-gold animate-pulse">
                Treasure Chest earned!
              </span>
            </div>
          )}
        </div>

        {/* Per-question scores — grouped by round */}
        <section className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
            Question Scores
          </h3>
          {rounds.length > 0 ? (
            rounds.map((round, rIdx) => {
              const startIdx = getRoundStartIndex(rounds, rIdx);
              return (
                <div key={rIdx} className="space-y-2">
                  <h4 className={`font-semibold text-sm flex items-center gap-2 ${
                    round.isBoss ? "text-red-400" : "text-foreground"
                  }`}>
                    {round.label}
                    {round.isBoss && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded uppercase tracking-wider">
                        Boss
                      </span>
                    )}
                  </h4>
                  {round.questions.map((q, qIdx) => {
                    const globalIdx = startIdx + qIdx;
                    const s = scores[globalIdx] ?? 0;
                    return (
                      <div
                        key={globalIdx}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                          round.isBoss
                            ? "border-red-500/20 bg-red-500/5"
                            : "border-border/50 bg-surface"
                        }`}
                      >
                        <span className="shrink-0 text-xs font-bold text-muted-foreground w-4">
                          Q{globalIdx + 1}
                        </span>
                        <p className="flex-1 text-sm truncate">
                          {q.question}
                        </p>
                        <ScoreBadge score={s} />
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            <div className="space-y-2">
              {scores.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface px-4 py-3"
                >
                  <span className="shrink-0 text-xs font-bold text-muted-foreground w-4">
                    Q{i + 1}
                  </span>
                  <p className="flex-1 text-sm truncate">
                    {questions[i]?.question ?? ""}
                  </p>
                  <ScoreBadge score={s} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Strengths & weaknesses */}
        {(strong.length > 0 || weak.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {strong.length > 0 && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-400 mb-2">
                  Strengths
                </p>
                <ul className="space-y-1">
                  {[...new Set(strong)].slice(0, 3).map((s) => (
                    <li key={s} className="text-sm text-foreground flex items-center gap-2">
                      <span className="text-green-400">+</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {weak.length > 0 && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
                  Areas to Improve
                </p>
                <ul className="space-y-1">
                  {[...new Set(weak)].slice(0, 3).map((s) => (
                    <li key={s} className="text-sm text-foreground flex items-center gap-2">
                      <span className="text-red-400">-</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* One More Round prompt */}
        {rewards?.oneMoreRound && (
          <div className="rounded-xl border border-saffron/20 bg-saffron/5 p-4 text-center space-y-2">
            <p className="text-sm text-foreground font-medium">
              {rewards.oneMoreRound.message}
            </p>
            {rewards.oneMoreRound.xpMultiplier > 1 && (
              <p className="text-xs text-saffron font-semibold">
                {rewards.oneMoreRound.xpMultiplier}x XP bonus on your next round!
              </p>
            )}
          </div>
        )}

        {/* Power-up usage summary */}
        {(hintsUsed > 0 || skipsUsed > 0) && (
          <div className="text-xs text-muted-foreground text-center">
            Power-ups used:{hintsUsed > 0 ? ` ${hintsUsed} hint${hintsUsed > 1 ? "s" : ""}` : ""}{skipsUsed > 0 ? ` ${skipsUsed} skip${skipsUsed > 1 ? "s" : ""}` : ""}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-surface px-4 py-3 text-sm font-semibold transition-all hover:bg-surface-hover"
          >
            <RotateCcw className="size-4" />
            {rewards?.oneMoreRound ? "One More Round!" : "New Interview"}
          </button>
          <Link
            href="/app/questions"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-3 text-sm font-semibold text-background transition-all hover:opacity-90"
          >
            Study All Questions
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}

// ── Main interview chat ────────────────────────────────────────────────────────

interface QuestionResult {
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  feedback: string;
  speedMultiplier: number;
}

interface InterviewChatProps {
  config: InterviewConfig;
  questions: InterviewQuestion[];
  rounds: InterviewRound[];
  onComplete: (scores: number[], elapsed: number, results: QuestionResult[], hintsUsed: number, skipsUsed: number) => void;
  isPremium: boolean;
}

function InterviewChat({ config, questions, rounds, onComplete }: InterviewChatProps) {
  const { hintTokens, coins, useHintToken, spendCoins } = useStore();
  const [hintsUsed, setHintsUsed] = useState(0);
  const [skipsUsed, setSkipsUsed] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [scores, setScores] = useState<number[]>([]);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [phase, setPhase] = useState<"welcome" | "asking" | "awaiting" | "feedback" | "done">("welcome");
  const [isThinking, setIsThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Speech Recognition ──────────────────────────────────────────────────
  const {
    isSupported: speechSupported,
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang: "en-IN", continuous: true, interimResults: true });

  // When speech transcript updates, fill it into the input field
  useEffect(() => {
    if (transcript && isListening) {
      setUserInput(transcript);
    }
  }, [transcript, isListening]);

  // When user stops recording, finalize the transcript into the input
  const prevListeningRef = useRef(false);
  useEffect(() => {
    if (prevListeningRef.current && !isListening && transcript) {
      setUserInput(transcript);
    }
    prevListeningRef.current = isListening;
  }, [isListening, transcript]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  const { addXP: chatAddXP, addCoins: chatAddCoins } = useStore();
  const company = COMPANIES.find((c) => c.id === config.company) ?? COMPANIES[5];
  const maxQuestions = questions.length;
  const hasRounds = rounds.length > 0;
  const currentRound = hasRounds ? rounds[currentRoundIndex] : null;
  const isBossRound = currentRound?.isBoss ?? false;

  // Auto-scroll within chat container only (not the whole page)
  useEffect(() => {
    const el = messagesEndRef.current;
    if (!el) return;
    const container = el.closest("[data-chat-scroll]");
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isThinking]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const addMessage = useCallback(
    (role: ChatMessage["role"], content: string) => {
      const msg: ChatMessage = {
        id: `${Date.now()}-${Math.random()}`,
        role,
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, msg]);
      return msg;
    },
    []
  );

  // Welcome message on mount
  useEffect(() => {
    const roundInfo = hasRounds
      ? ` We'll go through 3 rounds: Warm-Up, Deep Dive, and a Boss Round finale.`
      : "";
    const greetings = [
      `Welcome! I'm your interviewer from ${config.company === "General" ? "a top tech company" : config.company}. I'll be asking you ${maxQuestions} ${config.type} question${maxQuestions !== 1 ? "s" : ""} today.${roundInfo}`,
      `After each answer, I'll give you feedback on what you covered well and what you might have missed. Ready to begin?`,
    ];

    let delay = 300;
    greetings.forEach((g, i) => {
      setTimeout(() => {
        addMessage("interviewer", g);
        if (i === greetings.length - 1) {
          setTimeout(() => askNextQuestion(0), 1200);
        }
      }, delay);
      delay += 900;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askNextQuestion = useCallback(
    (index: number) => {
      if (index >= maxQuestions) {
        setPhase("done");
        addMessage(
          "interviewer",
          `That wraps up our interview! You answered ${maxQuestions} question${maxQuestions !== 1 ? "s" : ""}. Let me compile your results...`
        );
        return;
      }

      // Check if we're entering a new round
      if (hasRounds && index > 0) {
        const prevRound = getRoundForIndex(rounds, index - 1);
        const nextRound = getRoundForIndex(rounds, index);
        if (nextRound.roundIndex !== prevRound.roundIndex) {
          // Show round transition interstitial
          setShowRoundTransition(true);
          setTimeout(() => {
            setShowRoundTransition(false);
            setCurrentRoundIndex(nextRound.roundIndex);
            // Announce the new round in chat
            const round = rounds[nextRound.roundIndex];
            const roundAnnounce = round.isBoss
              ? `**${round.label}** -- The difficulty rises. Prove your mastery.`
              : `**${round.label}** -- Let's move on.`;
            addMessage("interviewer", roundAnnounce);
            // Then ask the question after a beat
            setTimeout(() => doAskQuestion(index), 1000);
          }, 2000);
          return;
        }
      }

      doAskQuestion(index);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage, maxQuestions, questions, hasRounds, rounds]
  );

  const doAskQuestion = useCallback(
    (index: number) => {
      setIsThinking(true);
      setTimeout(() => {
        setIsThinking(false);
        setCurrentQuestionIndex(index);
        setPhase("awaiting");
        setQuestionStartTime(Date.now());

        const q = questions[index];

        // Build prefix with round awareness
        let prefix: string;
        if (hasRounds) {
          const { roundIndex, localIndex } = getRoundForIndex(rounds, index);
          const round = rounds[roundIndex];
          const bossTag = round.isBoss ? " [BOSS]" : "";
          prefix = `${round.label}${bossTag} — Question ${localIndex + 1} of ${round.questions.length}:`;
        } else {
          prefix =
            index === 0
              ? "Let's start with our first question:"
              : index === maxQuestions - 1
              ? "Final question:"
              : `Question ${index + 1} of ${maxQuestions}:`;
        }

        addMessage("interviewer", `${prefix}\n\n**${q.question}**`);
        inputRef.current?.focus();
      }, 1200 + Math.random() * 600);
    },
    [addMessage, maxQuestions, questions, hasRounds, rounds]
  );

  const handleSubmitAnswer = useCallback(() => {
    const answer = userInput.trim();
    if (!answer || phase !== "awaiting") return;

    // Stop listening if speech recognition is active
    if (isListening) {
      stopListening();
    }
    resetTranscript();

    addMessage("user", answer);
    setUserInput("");
    setPhase("feedback");
    setIsThinking(true);

    const q = questions[currentQuestionIndex];
    const result = scoreAnswer(answer, q.answer);
    const elapsedSecs = questionStartTime ? (Date.now() - questionStartTime) / 1000 : 180;
    const speedMultiplier =
      elapsedSecs < 60 ? 2.0 : elapsedSecs < 120 ? 1.5 : elapsedSecs < 180 ? 1.0 : 0.75;
    if (speedMultiplier > 1) {
      toast(`Speed Bonus! ${speedMultiplier}x XP`);
    }

    setTimeout(() => {
      setIsThinking(false);
      setScores((prev) => [...prev, result.score]);

      // Immediately save wrong answers to revision (don't wait for interview end)
      if (result.score < 7 && q) {
        generateFlashcardsFromInterview([{
          question: q.question,
          modelAnswer: q.answer || "",
          userAnswer: answer,
          score: result.score,
          topic: config?.topic ?? "",
        }]).catch(() => {});
      }

      // Play sound based on score
      if (result.score >= 8) {
        sounds.correct();
      } else if (result.score < 4) {
        sounds.wrong();
      }

      // Feedback message
      const feedbackLines: string[] = [];

      if (result.score >= 8) {
        feedbackLines.push("Excellent answer! You covered the key concepts thoroughly.");
      } else if (result.score >= 6) {
        feedbackLines.push("Good answer! You hit the main points.");
      } else if (result.score >= 4) {
        feedbackLines.push("Decent start. There's room to deepen your answer.");
      } else {
        feedbackLines.push("This one needs more work. Let's review the key points you missed.");
      }

      if (result.matchedKeywords.length > 0) {
        feedbackLines.push(
          `\n**Concepts you covered:** ${result.matchedKeywords.join(", ")}`
        );
      }

      if (result.missedKeywords.length > 0) {
        feedbackLines.push(
          `**Missing from your answer:** ${result.missedKeywords.join(", ")}`
        );
      }

      feedbackLines.push(`\n**Score: ${result.score}/10**`);

      // Boss defeat bonus
      const currentRoundInfo = hasRounds ? getRoundForIndex(rounds, currentQuestionIndex) : null;
      const isCurrentBoss = currentRoundInfo ? rounds[currentRoundInfo.roundIndex]?.isBoss : false;
      if (isCurrentBoss && result.score >= 7) {
        chatAddXP(30);
        chatAddCoins(20, "Boss Defeated");
        feedbackLines.push(`\n**Boss Defeated! +30 XP, +20 coins**`);
        toast("Boss Defeated! +30 XP, +20 coins");
        sounds.coin();
      }

      const feedbackText = feedbackLines.join("\n");
      addMessage("feedback", feedbackText);

      // Record the result for history
      setQuestionResults((prev) => [
        ...prev,
        {
          question: q.question,
          userAnswer: answer,
          modelAnswer: q.answer,
          score: result.score,
          feedback: feedbackText,
          speedMultiplier,
        },
      ]);

      // Show model answer after short delay
      setTimeout(() => {
        const modelMsgId = `model-${currentQuestionIndex}`;
        setMessages((prev) => [
          ...prev,
          {
            id: modelMsgId,
            role: "interviewer",
            content: `### Model Answer\n\n${q.answer.replace(/\. /g, '.\n\n')}`,
            timestamp: new Date(),
          },
        ]);

        const nextIndex = currentQuestionIndex + 1;
        if (nextIndex >= maxQuestions) {
          setTimeout(() => {
            addMessage(
              "interviewer",
              `That concludes our interview! You answered all ${maxQuestions} questions. Great effort — let me compile your results...`
            );
            setPhase("done");
          }, 1000);
        } else {
          setTimeout(() => {
            addMessage(
              "interviewer",
              "Ready for the next question? Here we go..."
            );
            setTimeout(() => askNextQuestion(nextIndex), 800);
          }, 1500);
        }
      }, 1000);
    }, 1500 + Math.random() * 800);
  }, [
    addMessage,
    askNextQuestion,
    chatAddCoins,
    chatAddXP,
    currentQuestionIndex,
    hasRounds,
    isListening,
    maxQuestions,
    phase,
    questionStartTime,
    questions,
    resetTranscript,
    rounds,
    stopListening,
    userInput,
  ]);


  const handleHint = useCallback(() => {
    const success = useHintToken();
    if (!success) {
      toast("No hint tokens available");
      return;
    }
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const answer = currentQ.answer ?? "";
    const keywords = answer
      .split(/\s+/)
      .filter((w) => w.length >= 4)
      .filter(
        (w) =>
          !["this", "that", "with", "from", "have", "been", "will", "would", "could", "should", "they", "them", "their", "these", "those", "about", "which", "where", "when"].includes(
            w.toLowerCase()
          )
      )
      .slice(0, 3)
      .map((w) => w.replace(/[^a-zA-Z]/g, ""))
      .filter(Boolean);
    setHintsUsed((n) => n + 1);
    toast(`Hint: Key concepts — ${keywords.join(", ") || "review the fundamentals"}`);
  }, [useHintToken, questions, currentQuestionIndex]);

  const handleSkip = useCallback(() => {
    if (skipsUsed >= 2) {
      toast("Maximum 2 skips per interview");
      return;
    }
    const success = spendCoins(50, "Interview Skip");
    if (!success) {
      toast("Not enough coins (need 50)");
      return;
    }
    const q = questions[currentQuestionIndex];
    if (!q || phase !== "awaiting") return;
    setSkipsUsed((n) => n + 1);
    addMessage("user", "⏭ Skipped");
    setScores((prev) => [...prev, 0]);
    setQuestionResults((prev) => [
      ...prev,
      {
        question: q.question,
        userAnswer: "(skipped)",
        modelAnswer: q.answer,
        score: 0,
        feedback: "Question was skipped.",
        speedMultiplier: 1,
      },
    ]);
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= maxQuestions) {
      setTimeout(() => {
        addMessage("interviewer", `That concludes our interview! You answered all ${maxQuestions} questions. Great effort — let me compile your results...`);
        setPhase("done");
      }, 600);
    } else {
      setPhase("feedback");
      setTimeout(() => {
        addMessage("interviewer", "No problem — moving to the next question...");
        setTimeout(() => askNextQuestion(nextIndex), 800);
      }, 600);
    }
  }, [skipsUsed, spendCoins, questions, currentQuestionIndex, phase, addMessage, maxQuestions, askNextQuestion]);

  const handlePhoneAFriend = useCallback(() => {
    const success = spendCoins(30, "Phone a Friend");
    if (!success) {
      toast("Not enough coins (need 30)");
      return;
    }
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    const answer = currentQ.answer ?? "";
    const hint = answer.substring(0, 120).trimEnd() + "...";
    toast(`Your friend says: "${hint}"`, { duration: 6000 });
  }, [spendCoins, questions, currentQuestionIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progress =
    currentQuestionIndex >= 0
      ? Math.round(((currentQuestionIndex + (phase === "done" ? 1 : 0)) / maxQuestions) * 100)
      : 0;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Interview header */}
      <div className="shrink-0 flex items-center gap-4 rounded-t-xl border border-b-0 border-border/50 bg-surface px-4 py-3">
        {/* Interviewer avatar */}
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ${company.bgClass}`}
        >
          {company.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {config.company === "General" ? "Tech" : config.company} Interviewer
          </p>
          <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
            {config.type} &bull; {currentRound ? currentRound.label : config.difficulty}
            {isBossRound && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded uppercase tracking-wider">
                Boss
              </span>
            )}
          </p>
        </div>

        {/* Progress — compact on mobile, full on sm+ */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">
              {currentQuestionIndex >= 0
                ? `Q${Math.min(currentQuestionIndex + 1, maxQuestions)} of ${maxQuestions}`
                : `0 of ${maxQuestions}`}
            </p>
            <div className="mt-1 h-1.5 w-16 sm:w-24 rounded-full bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-saffron transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs font-mono text-muted-foreground">
          <Clock className="size-3" />
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Round transition overlay */}
      <AnimatePresence>
        {showRoundTransition && (
          <motion.div
            key="round-transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          >
            <div className="text-center space-y-3">
              {hasRounds && currentRoundIndex + 1 < rounds.length && (
                <>
                  <div className={`text-3xl font-bold ${
                    rounds[currentRoundIndex + 1]?.isBoss ? "text-red-400" : "text-saffron"
                  }`}>
                    {rounds[currentRoundIndex + 1]?.label || "Final Results"}
                  </div>
                  {rounds[currentRoundIndex + 1]?.isBoss && (
                    <div className="text-red-400/70 text-lg animate-pulse">Prepare yourself...</div>
                  )}
                  {!rounds[currentRoundIndex + 1]?.isBoss && (
                    <div className="text-muted-foreground text-sm">Difficulty increasing...</div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat area */}
      <div data-chat-scroll className={`flex-1 overflow-y-auto overscroll-contain border border-t-0 border-b-0 border-border/50 bg-background/50 p-4 space-y-4 transition-all duration-500 ${
        isBossRound ? "ring-2 ring-red-500/30 shadow-lg shadow-red-500/10" : ""
      }`}>
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => {
            const isInterviewer = msg.role === "interviewer";
            const isUser = msg.role === "user";
            const isFeedback = msg.role === "feedback";
            const isModelAnswer =
              isInterviewer && msg.content.startsWith("**Model Answer:**");

            // Direction: interviewer slides from left, user from right, feedback from bottom
            const chatInitial = isFeedback
              ? { opacity: 0, y: 16, x: 0 }
              : isUser
              ? { opacity: 0, x: 40, y: 0 }
              : { opacity: 0, x: -40, y: 0 };

            return (
              <motion.div
                key={msg.id}
                initial={chatInitial}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                {!isUser && (
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isFeedback
                        ? "bg-indigo/10 border border-indigo/30 text-indigo"
                        : `${company.bgClass} text-white`
                    }`}
                  >
                    {isFeedback ? "AI" : company.emoji}
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[82%] ${
                    isUser
                      ? "rounded-2xl rounded-br-sm border border-saffron/30 bg-saffron/15 px-4 py-3"
                      : isFeedback
                      ? "rounded-2xl rounded-bl-sm border border-indigo/20 bg-indigo/5 px-4 py-3"
                      : isModelAnswer
                      ? "w-full rounded-2xl rounded-bl-sm border border-gold/20 bg-gold/5 px-4 py-3"
                      : "rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3"
                  }`}
                >
                  {isModelAnswer ? (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedModel(
                            expandedModel === msg.id ? null : msg.id
                          )
                        }
                        className="flex w-full items-center justify-between gap-2 text-left"
                      >
                        <span className="text-xs font-semibold text-gold uppercase tracking-wider">
                          Model Answer
                        </span>
                        <ChevronDown
                          className={`size-4 text-gold transition-transform ${
                            expandedModel === msg.id ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedModel === msg.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border-t border-gold/20 pt-3">
                              {msg.content.replace("**Model Answer:**\n\n", "")}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed">
                      {isUser ? (
                        <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} className="prose-sm" />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {isThinking && (
            <motion.div key="thinking" className="flex gap-2">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${company.bgClass} text-white`}
              >
                {company.emoji}
              </div>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Done state */}
        {phase === "done" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center pt-2"
          >
            <button
              type="button"
              onClick={() => onComplete(scores, elapsed, questionResults, hintsUsed, skipsUsed)}
              className="flex items-center gap-2 rounded-xl bg-saffron px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 shadow-lg shadow-saffron/20"
            >
              <Trophy className="size-4" />
              View Results
            </button>

          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Power-up bar */}
      {phase === "awaiting" && (
        <div className="shrink-0 border border-t-0 border-b-0 border-border/50 bg-surface px-4 py-2">
          <PowerUpBar
            onHint={handleHint}
            onSkip={handleSkip}
            onPhoneAFriend={handlePhoneAFriend}
            hintTokens={hintTokens}
            coins={coins}
            hintsUsed={hintsUsed}
            skipsUsed={skipsUsed}
          />
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 rounded-b-xl border border-t border-border/50 bg-surface p-4">
        {/* Countdown timer bar — visible only while awaiting an answer */}
        {phase === "awaiting" && questionStartTime !== null && (
          <div className="mb-3">
            <CountdownBar startTime={questionStartTime} />
          </div>
        )}

        {/* Live transcription preview */}
        <AnimatePresence>
          {isListening && interimTranscript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
                <p className="text-xs text-muted-foreground italic truncate">
                  {interimTranscript}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speech error message */}
        {speechError && (
          <div className="mb-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
            {speechError}
          </div>
        )}

        <div className="relative flex items-end gap-2">
          {/* Mic button */}
          {speechSupported && (
            <button
              type="button"
              onClick={handleMicToggle}
              disabled={phase !== "awaiting"}
              title={
                isListening
                  ? "Stop recording"
                  : "Speak your answer"
              }
              className={`shrink-0 flex items-center justify-center rounded-xl p-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500/15 border border-red-500/40 text-red-400 hover:bg-red-500/25 shadow-md shadow-red-500/10"
                  : "bg-background border border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-hover"
              }`}
            >
              {isListening ? (
                <span className="relative flex items-center justify-center">
                  <span className="absolute inline-flex size-7 animate-ping rounded-full bg-red-400 opacity-20" />
                  <MicOff className="relative size-4" />
                </span>
              ) : (
                <Mic className="size-4" />
              )}
            </button>
          )}

          {/* Text input */}
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                phase === "awaiting"
                  ? isListening
                    ? "Listening... speak your answer"
                    : "Type or speak your answer... (Enter to submit)"
                  : phase === "done"
                  ? "Interview complete!"
                  : "Wait for the next question..."
              }
              disabled={phase !== "awaiting"}
              rows={3}
              className={`w-full resize-none rounded-xl border bg-background px-4 py-3 pr-14 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-saffron/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isListening
                  ? "border-red-500/40 ring-1 ring-red-500/20"
                  : "border-border/50"
              }`}
            />
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={phase !== "awaiting" || !userInput.trim()}
              className="absolute right-3 bottom-3 flex items-center justify-center rounded-lg bg-saffron p-2 text-background transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="size-4" />
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          {speechSupported ? (
            <>
              {isListening ? (
                <>Recording... click <MicOff className="inline size-3" /> to stop</>
              ) : (
                <>Enter to submit &bull; <Mic className="inline size-3" /> to speak your answer</>
              )}
            </>
          ) : (
            <>Enter to submit &bull; Shift+Enter for new line</>
          )}
        </p>

        {/* Unsupported browser notice */}
        {!speechSupported && (
          <p className="mt-1 text-center text-xs text-muted-foreground/60">
            Voice input requires Chrome, Edge, or Safari
          </p>
        )}
      </div>
    </div>
  );
}

// ── Free tier gate wrapper ─────────────────────────────────────────────────────

const FREE_DAILY_KEY = "interview_free_count_";

function getFreeInterviewsToday(): number {
  if (typeof window === "undefined") return 0;
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem(FREE_DAILY_KEY + today);
  return raw ? parseInt(raw, 10) : 0;
}

function incrementFreeInterviews(): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const key = FREE_DAILY_KEY + today;
  const current = parseInt(localStorage.getItem(key) ?? "0", 10);
  localStorage.setItem(key, String(current + 1));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [elapsedFinal, setElapsedFinal] = useState(0);
  const [freeInterviewsUsed, setFreeInterviewsUsed] = useState(0);
  const [interviewRewards, setInterviewRewards] = useState<InterviewRewards | null>(null);
  const [finalHintsUsed, setFinalHintsUsed] = useState(0);
  const [finalSkipsUsed, setFinalSkipsUsed] = useState(0);
  const [interviewRounds, setInterviewRounds] = useState<InterviewRound[]>([]);

  const { isPremium, premiumUntil, addXP, addCoins, queueCelebration, totalXP, currentStreak, longestStreak, level } = useStore();
  const isActivePremium =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  useEffect(() => {
    setFreeInterviewsUsed(getFreeInterviewsToday());
  }, []);

  const FREE_LIMIT = 1; // 1 full interview per day for free users
  const FREE_QUESTIONS = 3;
  const PRO_QUESTIONS = 8;

  const canStartFree = freeInterviewsUsed < FREE_LIMIT;

  async function handleStart(cfg: InterviewConfig) {
    setLoading(true);
    setError(null);
    setConfig(cfg);

    try {
      // Load a generous pool so we can partition by difficulty into rounds
      // Override difficulty to "Mixed" to get all difficulty levels
      const poolConfig = { ...cfg, difficulty: "Mixed" as const };
      const pool = await loadInterviewQuestions(poolConfig, 50);

      if (pool.length === 0) {
        setError(
          "No questions found for this combination. Try 'General' company or 'Mixed' type."
        );
        setLoading(false);
        return;
      }

      if (!isActivePremium) {
        incrementFreeInterviews();
        setFreeInterviewsUsed((n) => n + 1);
      }

      // Build progressive rounds from the pool
      const rounds = buildRounds(pool, isActivePremium);
      setInterviewRounds(rounds);
      setQuestions(flattenRounds(rounds));
      setChatKey((k) => k + 1);
      setPhase("active");
    } catch {
      setError("Failed to load questions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleComplete(finalScores: number[], finalElapsed: number, results: QuestionResult[], finalHintsUsed: number = 0, finalSkipsUsed: number = 0) {
    setScores(finalScores);
    setElapsedFinal(finalElapsed);
    setFinalHintsUsed(finalHintsUsed);
    setFinalSkipsUsed(finalSkipsUsed);
    setPhase("complete");

    // ── Calculate rewards ────────────────────────────────────────────────
    const totalQuestions = finalScores.length;
    const correctCount = finalScores.filter((s) => s >= 7).length;
    const avgScore = totalQuestions > 0
      ? finalScores.reduce((sum, s) => sum + s, 0) / totalQuestions
      : 0;
    const overallScorePercent = totalQuestions > 0
      ? Math.round((finalScores.reduce((a, b) => a + b, 0) / totalQuestions) * 10)
      : 0;

    // Speed multiplier: average across all answers
    const avgSpeedMultiplier =
      results.length > 0
        ? results.reduce((sum, r) => sum + (r.speedMultiplier ?? 1), 0) / results.length
        : 1;

    // XP: 10 base per question + 5 bonus per correct answer, scaled by speed multiplier
    const baseXP = totalQuestions * 10;
    const bonusXP = correctCount * 5;
    const earnedXP = Math.round((baseXP + bonusXP) * avgSpeedMultiplier);

    // Coins: 5 per question + 20 bonus if avg >= 70%
    const baseCoins = totalQuestions * 5;
    const bonusCoins = avgScore >= 7 ? 20 : 0;
    const earnedCoins = baseCoins + bonusCoins;

    // Award XP and coins
    addXP(earnedXP);
    addCoins(earnedCoins, "Mock Interview");

    // Play completion sound
    if (avgScore >= 9) {
      sounds.perfect();
    } else {
      sounds.levelUp();
    }

    // Queue celebrations
    if (avgScore >= 9) {
      queueCelebration({ type: "perfect_round", data: { score: overallScorePercent } });
    } else {
      queueCelebration({ type: "xp_gain", data: { amount: earnedXP } });
    }

    // Save results to localStorage for the Revision page
    if (config) {
      try {
        const history = JSON.parse(
          localStorage.getItem("gs-interview-history") ?? "[]"
        ) as object[];

        history.push({
          date: new Date().toISOString(),
          company: config.company,
          topic: config.topic,
          questions: results,
          overallScore: overallScorePercent,
        });

        localStorage.setItem(
          "gs-interview-history",
          JSON.stringify(history.slice(-20))
        );
      } catch {
        // ignore localStorage errors
      }
    }

    // ── Treasure chest check ─────────────────────────────────────────────
    let chestDropped = false;
    try {
      const history = JSON.parse(
        localStorage.getItem("gs-interview-history") ?? "[]"
      ) as object[];
      const roundsCompleted = history.length;
      const lastChestAt = parseInt(localStorage.getItem("gs-interview-last-chest") ?? "0", 10);
      if (shouldDropChest(roundsCompleted, lastChestAt)) {
        chestDropped = true;
        localStorage.setItem("gs-interview-last-chest", String(roundsCompleted));
        recordChest().catch(() => {});
        sounds.coin();
      }
    } catch {
      // ignore
    }

    // ── Badge check (async) ──────────────────────────────────────────────
    const rewardsPayload: InterviewRewards = {
      xp: earnedXP,
      coins: earnedCoins,
      newBadges: [],
      chestDropped,
      oneMoreRound: null,
      avgSpeedMultiplier,
    };

    getUserStats({ currentStreak, longestStreak, totalXP: totalXP + earnedXP, level })
      .then((stats) => checkAndUnlockBadges(stats))
      .then((newBadges) => {
        if (newBadges.length > 0) {
          for (const badge of newBadges) {
            queueCelebration({ type: "badge", data: { badge: { name: badge.name, icon: badge.icon } } });
            sounds.badge();
          }
          rewardsPayload.newBadges = newBadges.map((b) => ({ name: b.name, icon: b.icon }));
        }

        // ── One More Round check ────────────────────────────────────────
        const progress = xpProgressInLevel(totalXP + earnedXP);
        const xpToNextLevel = progress.needed - progress.current;
        const oneMore = checkOneMoreRound({
          lastQuizScore: overallScorePercent,
          xpToNextLevel,
          badgesNearUnlock: 0,
          inSessionStreak: correctCount,
          dailyChallengeAvailable: false,
          decayedTopicCount: 0,
          consecutivePrompts: 0,
        });
        rewardsPayload.oneMoreRound = oneMore;

        setInterviewRewards({ ...rewardsPayload });
      })
      .catch(() => {
        // Still show rewards even if badge check fails
        setInterviewRewards({ ...rewardsPayload });
      });

    // Set initial rewards immediately (badges update async)
    setInterviewRewards(rewardsPayload);

    // Auto-feed wrong answers into the revision (flashcard) system
    // Ensure ALL questions are included, even unanswered ones (score = 0)
    const interviewResults = questions.map((q, i) => ({
      question: q.question,
      modelAnswer: q.answer || "",
      userAnswer: results[i]?.userAnswer || "(not answered)",
      score: results[i]?.score ?? 0,
      topic: config?.topic ?? "",
    }));
    generateFlashcardsFromInterview(interviewResults).then((cardsCreated) => {
      if (cardsCreated > 0) {
        toast(`${cardsCreated} question${cardsCreated > 1 ? "s" : ""} added to your revision queue`);
      }
    }).catch(() => {
      // Non-critical — ignore errors
    });
  }

  function handleRestart() {
    setPhase("setup");
    setConfig(null);
    setQuestions([]);
    setScores([]);
    setElapsedFinal(0);
    setError(null);
    setInterviewRewards(null);
    setInterviewRounds([]);
  }

  return (
    <div className={phase === "active" ? "flex flex-col h-[calc(100dvh-4rem)]" : "space-y-4"}>
      {/* Back link when active */}
      {phase !== "setup" && (
        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Setup
        </button>
      )}

      {/* Pro only gate */}
      {phase === "setup" && !isActivePremium && (
        <PremiumGate feature="mock-interview" overlay={false}>
          <div className="rounded-xl bg-surface p-8 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              The AI Mock Interviewer is a Pro-only feature.
              Practice unlimited interviews with instant feedback.
            </p>
          </div>
        </PremiumGate>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <div className="size-5 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
          <span className="text-sm">Loading questions...</span>
        </div>
      )}

      {/* Setup — Pro only */}
      {phase === "setup" && !loading && isActivePremium && (
        <SetupScreen onStart={handleStart} />
      )}

      {/* Active interview */}
      {phase === "active" && !loading && config && questions.length > 0 && (
        <InterviewChat
          key={chatKey}
          config={config}
          questions={questions}
          rounds={interviewRounds}
          onComplete={(scores, elapsed, results, hu, su) => handleComplete(scores, elapsed, results, hu, su)}
          isPremium={isActivePremium}
        />
      )}

      {/* Results */}
      {phase === "complete" && config && (
        <ResultsScreen
          messages={[]}
          scores={scores}
          config={config}
          questions={questions}
          rounds={interviewRounds}
          onRestart={handleRestart}
          elapsed={elapsedFinal}
          rewards={interviewRewards}
          hintsUsed={finalHintsUsed}
          skipsUsed={finalSkipsUsed}
        />
      )}
    </div>
  );
}
