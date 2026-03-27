"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Send,
  Bot,
  Sparkles,
  Crown,
  Lock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  PenLine,
  Mic,
  MicOff,
} from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useMitraLimit } from "@/hooks/use-mitra-limit";

// ── Types ──────────────────────────────────────────────────────────────────────

interface QAItem {
  question: string;
  answer: string;
  category?: string;
  difficulty?: string;
}

interface DailyQuestion {
  question: string;
  explanation?: string;
  answer?: string;
  correctAnswer?: string;
  topic?: string;
}

interface KnowledgeBase {
  items: QAItem[];
  loaded: boolean;
}

interface RelatedLink {
  label: string;
  href: string;
  icon: "lesson" | "quiz" | "explore";
}

interface ChatMessage {
  id: string;
  role: "user" | "mitra";
  text: string;
  fullText?: string;         // untruncated answer for "Show more"
  matchedQuestion?: string;  // the Q&A question that matched
  relatedLinks?: RelatedLink[];
  followUps?: string[];      // suggested follow-up questions
  timestamp: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Expanded keyword → topic label mapping (multi-word phrases checked first)
const TOPIC_MAP: Record<string, string> = {
  // Kafka
  "kafka stream":    "Apache Kafka",
  "kafka connect":   "Apache Kafka",
  "kafka topic":     "Apache Kafka",
  "kafka consumer":  "Apache Kafka",
  "kafka producer":  "Apache Kafka",
  kafka:             "Apache Kafka",
  // AWS
  "amazon web":      "AWS",
  cloudfront:        "AWS",
  dynamodb:          "AWS",
  lambda:            "AWS",
  ec2:               "AWS",
  eks:               "AWS",
  ecs:               "AWS",
  rds:               "AWS",
  s3:                "AWS",
  aws:               "AWS",
  // Kubernetes / Docker
  "docker compose":  "Kubernetes & Docker",
  kubernetes:        "Kubernetes & Docker",
  container:         "Kubernetes & Docker",
  docker:            "Kubernetes & Docker",
  helm:              "Kubernetes & Docker",
  kube:              "Kubernetes & Docker",
  k8s:               "Kubernetes & Docker",
  pod:               "Kubernetes & Docker",
  // Design Patterns
  "design pattern":  "Design Patterns",
  "solid principle": "Design Patterns",
  decorator:         "Design Patterns",
  factory:           "Design Patterns",
  observer:          "Design Patterns",
  singleton:         "Design Patterns",
  solid:             "Design Patterns",
  strategy:          "Design Patterns",
  // Java
  "spring boot":     "Java",
  concurrency:       "Java",
  garbage:           "Java",
  hashmap:           "Java",
  hibernate:         "Java",
  java:              "Java",
  jvm:               "Java",
  spring:            "Java",
  springboot:        "Java",
  thread:            "Java",
  // System Design
  "api gateway":     "System Design",
  "cap theorem":     "System Design",
  "load balanc":     "System Design",
  "message queue":   "System Design",
  "rate limit":      "System Design",
  "system design":   "System Design",
  caching:           "System Design",
  cdn:               "System Design",
  database:          "System Design",
  elasticsearch:     "System Design",
  graphql:           "System Design",
  grpc:              "System Design",
  "micro-service":   "System Design",
  microservice:      "System Design",
  mongodb:           "System Design",
  nosql:             "System Design",
  partitioning:      "System Design",
  postgres:          "System Design",
  redis:             "System Design",
  rest:              "System Design",
  sharding:          "System Design",
  sql:               "System Design",
  db:                "System Design",
  // Frontend / Languages
  "node.js":         "Core CS & Languages",
  javascript:        "Core CS & Languages",
  nodejs:            "Core CS & Languages",
  python:            "Core CS & Languages",
  react:             "Core CS & Languages",
  typescript:        "Core CS & Languages",
  js:                "Core CS & Languages",
  ts:                "Core CS & Languages",
  // DSA
  "binary search":   "Data Structures & Algorithms",
  "data structure":  "Data Structures & Algorithms",
  "dynamic programming": "Data Structures & Algorithms",
  "linked list":     "Data Structures & Algorithms",
  algorithm:         "Data Structures & Algorithms",
  array:             "Data Structures & Algorithms",
  dp:                "Data Structures & Algorithms",
  graph:             "Data Structures & Algorithms",
  hash:              "Data Structures & Algorithms",
  heap:              "Data Structures & Algorithms",
  queue:             "Data Structures & Algorithms",
  recursion:         "Data Structures & Algorithms",
  sorting:           "Data Structures & Algorithms",
  stack:             "Data Structures & Algorithms",
  tree:              "Data Structures & Algorithms",
};

// Synonym expansion — bidirectional: user alias expands to canonical terms
const SYNONYMS: Record<string, string[]> = {
  kubernetes:            ["k8s", "kube"],
  database:              ["db", "rdbms"],
  javascript:            ["js"],
  typescript:            ["ts"],
  microservices:         ["microservice", "micro-service"],
  docker:                ["container", "containerization"],
  "spring boot":         ["spring", "springboot"],
  "dynamic programming": ["dp"],
  elasticsearch:         ["es", "elastic"],
  postgresql:            ["postgres", "pg"],
  redis:                 ["cache", "in-memory"],
  "load balancer":       ["lb", "load balanc"],
  "api gateway":         ["gateway"],
  thread:                ["threading", "multithreading", "concurrent"],
  cache:                 ["caching", "cached"],
  node:                  ["nodejs", "node.js"],
};

// Stem pairs: if query contains the left stem, also search for the right form
const STEMS: [string, string][] = [
  ["thread",    "threading"],
  ["cache",     "caching"],
  ["partition", "partitioning"],
  ["shard",     "sharding"],
  ["replica",   "replication"],
  ["distribut", "distributed"],
  ["optimiz",   "optimization"],
  ["implement", "implementation"],
  ["abstract",  "abstraction"],
  ["inherit",   "inheritance"],
  ["encapsul",  "encapsulation"],
  ["synchron",  "synchronization"],
  ["consumer",  "consuming"],
  ["producer",  "producing"],
];

// Quick-action chips shown beneath the greeting
const QUICK_ACTIONS = [
  "Java Basics",
  "System Design",
  "Apache Kafka",
  "AWS",
  "Data Structures",
  "Kubernetes",
];

const GREETING_MESSAGE: ChatMessage = {
  id: "greeting",
  role: "mitra",
  text: "Hi! I'm Mitra, your study buddy. What would you like to explore today?",
  timestamp: 0,
};

const CONTENT_FILES = [
  "/content/company-tech-qa.json",
  "/content/kafka-qa.json",
  "/content/aws-qa.json",
  "/content/k8s-docker-qa.json",
  "/content/design-patterns-qa.json",
  "/content/java-qa-all.json",
];

// ── Knowledge base (module-level cache) ───────────────────────────────────────

let knowledgeCache: KnowledgeBase = { items: [], loaded: false };

async function loadKnowledge(): Promise<QAItem[]> {
  if (knowledgeCache.loaded) return knowledgeCache.items;

  const results: QAItem[] = [];

  const fetches = CONTENT_FILES.map((url) =>
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          for (const item of data) {
            if (
              item &&
              typeof item.question === "string" &&
              typeof item.answer === "string"
            ) {
              results.push({
                question: item.question,
                answer: item.answer,
                category: item.category,
                difficulty: item.difficulty,
              });
            }
          }
        }
      })
      .catch(() => {})
  );

  // Sample daily-questions — huge file, cap at 500 for responsiveness
  const dailyFetch = fetch("/content/daily-questions.json")
    .then((r) => (r.ok ? r.json() : []))
    .then((data: unknown) => {
      if (Array.isArray(data)) {
        const sample = data.slice(0, 500) as DailyQuestion[];
        for (const item of sample) {
          if (!item) continue;
          const q = item.question;
          const a = item.explanation ?? item.answer ?? item.correctAnswer ?? "";
          if (q && a) results.push({ question: q, answer: a, category: item.topic });
        }
      }
    })
    .catch(() => {});

  await Promise.all([...fetches, dailyFetch]);

  knowledgeCache = { items: results, loaded: true };
  return results;
}

// ── Keyword helpers ───────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  const stopWords = new Set([
    "what", "how", "why", "when", "where", "which", "who",
    "the", "is", "are", "does", "can", "do", "a", "an",
    "in", "of", "and", "or", "to", "it", "be", "for",
    "with", "on", "at", "by", "from", "this", "that",
    "give", "me", "tell", "explain", "describe", "define",
  ]);
  return text
    .toLowerCase()
    .replace(/[?!.,;:]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

function expandQuery(words: string[]): string[] {
  const expanded = new Set(words);

  // Bidirectional synonym expansion
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    const canonWords = canonical.toLowerCase().split(/\s+/);
    const hasCanon = canonWords.every((cw) =>
      words.some((w) => w.includes(cw) || cw.includes(w))
    );
    if (hasCanon) {
      for (const alias of aliases) {
        alias.split(/\s+/).forEach((a) => expanded.add(a));
      }
    }
    for (const alias of aliases) {
      if (words.some((w) => w.includes(alias) || alias.includes(w))) {
        canonWords.forEach((cw) => expanded.add(cw));
      }
    }
  }

  // Stem pair expansion
  for (const [stem, full] of STEMS) {
    if (words.some((w) => w.startsWith(stem) || w === full)) {
      expanded.add(stem);
      expanded.add(full);
    }
  }

  return Array.from(expanded);
}

// ── Search algorithm ──────────────────────────────────────────────────────────

function scoreItem(
  queryWords: string[],
  expandedWords: string[],
  item: QAItem
): number {
  const qText = item.question.toLowerCase();
  const aText = item.answer.toLowerCase();

  let score = 0;

  // Phrase bonus: consecutive query words appearing in the question
  const queryPhrase = queryWords.join(" ");
  if (queryPhrase.length > 3 && qText.includes(queryPhrase)) score += 0.5;

  // Per-word scoring: question matches weight more than answer matches
  for (const word of expandedWords) {
    if (word.length < 2) continue;
    if (qText.includes(word)) score += 0.4;
    else if (aText.includes(word)) score += 0.15;
  }

  // Normalise so longer expanded sets don't dominate
  return score / Math.max(expandedWords.length, 1);
}

function findBestAnswer(
  query: string,
  knowledge: QAItem[]
): { answer: string; confidence: number; question: string; category: string } {
  const queryWords = tokenize(query);

  if (queryWords.length === 0) {
    return { answer: "", confidence: 0, question: "", category: "" };
  }

  const expandedWords = expandQuery(queryWords);
  let bestMatch = { answer: "", confidence: 0, question: "", category: "" };

  for (const item of knowledge) {
    const confidence = scoreItem(queryWords, expandedWords, item);
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        answer: item.answer,
        confidence,
        question: item.question,
        category: item.category ?? "",
      };
    }
  }

  return bestMatch;
}

function findRelatedQuestions(
  category: string,
  currentQuestion: string,
  knowledge: QAItem[],
  count = 3
): string[] {
  if (!category) return [];
  return knowledge
    .filter((item) => item.category === category && item.question !== currentQuestion)
    .slice(0, count)
    .map((item) => item.question);
}

function detectTopicLabel(query: string): string | null {
  const lower = query.toLowerCase();
  // Sort by length descending so longer phrases match first
  const entries = Object.entries(TOPIC_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, label] of entries) {
    if (lower.includes(keyword)) return label;
  }
  return null;
}

// Map topic labels to search-friendly URLs
// The topics page has search — linking with a pre-filled search finds the exact topic
function getTopicSearchUrl(topicLabel: string | null): string {
  if (!topicLabel) return "/app/topics";
  // Encode the topic name as a search parameter
  const slug = encodeURIComponent(topicLabel.toLowerCase().replace(/\s+&\s+/g, " "));
  return `/app/topics?search=${slug}`;
}

function buildRelatedLinks(topicLabel: string | null, category?: string): RelatedLink[] {
  const links: RelatedLink[] = [];

  if (topicLabel) {
    links.push({
      label: `Learn: ${topicLabel}`,
      href: getTopicSearchUrl(topicLabel),
      icon: "lesson",
    });
  }

  links.push({
    label: topicLabel ? `${topicLabel} questions` : "Practice questions",
    href: "/app/questions",
    icon: "quiz",
  });

  if (!topicLabel) {
    links.push({
      label: "Browse all topics",
      href: "/app/topics",
      icon: "explore",
    });
  }

  return links;
}

function buildMitraResponse(
  query: string,
  knowledge: QAItem[]
): Omit<ChatMessage, "id" | "role" | "timestamp"> {
  const { answer, confidence, question, category } = findBestAnswer(query, knowledge);
  const topicLabel = detectTopicLabel(query) ?? (category || null);

  if (confidence < 0.35 || !answer) {
    return {
      text: "I don't have specific information on that yet. Try asking about: Java, System Design, Kafka, AWS, Kubernetes, Design Patterns, or Data Structures.",
      relatedLinks: buildRelatedLinks(topicLabel),
    };
  }

  const PREVIEW_LENGTH = 400;
  const isLong = answer.length > PREVIEW_LENGTH;
  const previewText = isLong ? answer.slice(0, PREVIEW_LENGTH).trimEnd() + "…" : answer;

  const followUps = findRelatedQuestions(category, question, knowledge, 3);
  const relatedLinks = buildRelatedLinks(topicLabel);

  if (confidence >= 0.4) {
    return {
      text: previewText,
      fullText: isLong ? answer : undefined,
      matchedQuestion: question || undefined,
      relatedLinks,
      followUps: followUps.length > 0 ? followUps : undefined,
    };
  }

  // Partial match
  return {
    text: previewText,
    fullText: isLong ? answer : undefined,
    matchedQuestion: question ? `Related: ${question}` : undefined,
    relatedLinks,
    followUps: followUps.length > 0 ? followUps : undefined,
  };
}

// ── Link icon map ──────────────────────────────────────────────────────────────

const LINK_ICON_MAP: Record<RelatedLink["icon"], React.ReactNode> = {
  lesson:  <BookOpen className="size-3" />,
  quiz:    <PenLine className="size-3" />,
  explore: <Sparkles className="size-3" />,
};

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onFollowUp,
}: {
  msg: ChatMessage;
  onFollowUp: (q: string) => void;
}) {
  const isUser = msg.role === "user";
  const [expanded, setExpanded] = useState(false);
  const hasMore = Boolean(msg.fullText);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
          <Bot className="size-3.5 text-indigo-400" />
        </div>
      )}

      <div
        className={`flex max-w-[85%] flex-col gap-1.5 ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        {/* Matched question heading */}
        {!isUser && msg.matchedQuestion && (
          <p className="text-[11px] font-semibold text-indigo-400/80 px-0.5 leading-snug">
            {msg.matchedQuestion}
          </p>
        )}

        {/* Main bubble */}
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "rounded-tr-sm bg-saffron/90 text-background font-medium"
              : "rounded-tl-sm bg-indigo-500/15 border border-indigo-500/20 text-foreground"
          }`}
        >
          {!isUser && hasMore && !expanded
            ? msg.text
            : expanded && msg.fullText
            ? msg.fullText
            : msg.text}
        </div>

        {/* Show more / less */}
        {!isUser && hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors px-0.5"
          >
            {expanded ? (
              <>
                <ChevronUp className="size-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                Show more
              </>
            )}
          </button>
        )}

        {/* Related links */}
        {!isUser && msg.relatedLinks && msg.relatedLinks.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {msg.relatedLinks.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
              >
                {LINK_ICON_MAP[link.icon]}
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Follow-up suggestions */}
        {!isUser && msg.followUps && msg.followUps.length > 0 && (
          <div className="mt-1 flex flex-col gap-1 w-full">
            <p className="text-[10px] text-muted-foreground px-0.5 uppercase tracking-wide font-medium">
              You might also ask:
            </p>
            {msg.followUps.map((q) => (
              <button
                key={q}
                onClick={() => onFollowUp(q)}
                className="text-left text-[11px] text-indigo-300/80 hover:text-indigo-200 border border-indigo-500/20 rounded-lg px-2.5 py-1.5 bg-indigo-500/5 hover:bg-indigo-500/15 transition-colors leading-snug"
              >
                {q.length > 80 ? q.slice(0, 77) + "…" : q}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Greeting quick-action chips ────────────────────────────────────────────────

function GreetingChips({ onSelect }: { onSelect: (topic: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action}
          onClick={() => onSelect(action)}
          className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/25 hover:text-indigo-200"
        >
          {action}
        </button>
      ))}
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex gap-2"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 mt-0.5">
        <Bot className="size-3.5 text-indigo-400" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-indigo-500/15 border border-indigo-500/20 px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block size-1.5 rounded-full bg-indigo-400"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Upgrade nudge ──────────────────────────────────────────────────────────────

function UpgradeNudge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-2 mb-2 flex flex-col items-center gap-2 rounded-xl border border-saffron/30 bg-gradient-to-br from-saffron/10 via-gold/5 to-transparent p-3 text-center"
    >
      <Crown className="size-5 text-saffron" />
      <p className="text-xs font-semibold text-foreground">
        Upgrade to Pro for unlimited Mitra conversations
      </p>
      <Link
        href="/app/pricing"
        className="inline-flex items-center gap-1.5 rounded-lg bg-saffron px-3 py-1.5 text-xs font-bold text-background transition-opacity hover:opacity-90"
      >
        <Crown className="size-3" />
        Upgrade to Pro
      </Link>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MitraChat() {
  const { isPremium, premiumUntil } = useStore();
  const mitraLimit = useMitraLimit();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<QAItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Voice input
  const {
    isSupported: micSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang: "en-IN", continuous: false });

  // Active premium check
  const isActivePro =
    isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  // Whether free user has hit message limit (Dexie-backed, persists across refreshes)
  const hitLimit = !mitraLimit.allowed;

  // Fill input from voice transcript and auto-send when speech stops
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
    // When listening stops and we have a transcript, auto-send
    if (!isListening && transcript.trim()) {
      const trimmed = transcript.trim();
      resetTranscript();
      setInput("");
      dispatchQuery(trimmed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isListening]);

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setInput("");
      startListening();
    }
  }, [isListening, startListening, stopListening, resetTranscript]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Lazy-load knowledge base on first open
  useEffect(() => {
    if (!open || knowledgeLoaded) return;
    loadKnowledge().then((items) => {
      setKnowledgeItems(items);
      setKnowledgeLoaded(true);
    });
  }, [open, knowledgeLoaded]);

  // Core query dispatcher — shared by typed input, chips, and follow-ups
  const dispatchQuery = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isTyping) return;

      // Check and increment Dexie-backed usage limit
      const canSend = await mitraLimit.increment();
      if (!canSend) {
        const limitMsg: ChatMessage = {
          id: `mitra-limit-${Date.now()}`,
          role: "mitra",
          text: `You've reached your daily limit of ${mitraLimit.limit} Mitra messages. Upgrade to Pro for unlimited conversations!`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, limitMsg]);
        return;
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      // Simulate thinking delay proportional to query length
      const delay = Math.max(500, Math.min(1200, trimmed.length * 10));
      await new Promise((res) => setTimeout(res, delay));

      const partial = buildMitraResponse(trimmed, knowledgeItems);

      const mitraMsg: ChatMessage = {
        id: `mitra-${Date.now()}`,
        role: "mitra",
        ...partial,
        timestamp: Date.now(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, mitraMsg]);
    },
    [isTyping, knowledgeItems, mitraLimit]
  );

  const sendMessage = useCallback(() => {
    dispatchQuery(input);
  }, [input, dispatchQuery]);

  const handleFollowUp = useCallback(
    (q: string) => {
      dispatchQuery(q);
    },
    [dispatchQuery]
  );

  const handleQuickAction = useCallback(
    (topic: string) => {
      dispatchQuery(`Tell me about ${topic}`);
    },
    [dispatchQuery]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show greeting chips only while no user message has been sent yet
  const showGreetingChips =
    messages.length === 1 &&
    messages[0].id === "greeting" &&
    knowledgeLoaded;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating action button */}
      <AnimatePresence>
        {!open &&
          (isActivePro ? (
            <motion.button
              key="mitra-fab-pro"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen(true)}
              aria-label="Open Mitra — your study buddy"
              className="fixed bottom-5 right-5 z-[90] flex size-14 items-center justify-center rounded-full border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-[0_4px_24px_rgba(99,102,241,0.45)] transition-shadow hover:shadow-[0_6px_32px_rgba(99,102,241,0.65)]"
            >
              <Bot className="size-6 text-white" />
              <span className="absolute inset-0 animate-ping rounded-full border border-indigo-400/30 opacity-60" />
            </motion.button>
          ) : (
            <motion.button
              key="mitra-fab-free"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen(true)}
              aria-label="Mitra — upgrade to Pro to unlock unlimited chat"
              className="fixed bottom-5 right-5 z-[90] flex size-14 items-center justify-center rounded-full border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-[0_4px_24px_rgba(99,102,241,0.45)] transition-shadow hover:shadow-[0_6px_32px_rgba(99,102,241,0.65)]"
            >
              <Bot className="size-6 text-white opacity-70" />
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-saffron border border-background shadow">
                <Lock className="size-2.5 text-background" />
              </span>
            </motion.button>
          ))}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mitra-window"
            initial={{ opacity: 0, scale: 0.88, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className={`fixed z-[90] flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_8px_48px_rgba(0,0,0,0.5)]
              inset-0 sm:inset-auto
              sm:bottom-5 sm:right-5 sm:w-[370px] sm:h-[560px]`}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border/50 bg-gradient-to-r from-indigo-950/80 to-background px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
                <Bot className="size-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground leading-tight">
                  Mitra
                </p>
                <p className="text-[11px] text-indigo-400/80 leading-tight">
                  Your Study Buddy
                </p>
              </div>

              {!isActivePro && (
                <span className="inline-flex items-center gap-1 rounded-full border border-saffron/30 bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron">
                  {!mitraLimit.allowed
                    ? "Limit reached"
                    : mitraLimit.limit !== Infinity
                    ? `${mitraLimit.remaining} free left`
                    : null}
                </span>
              )}
              {isActivePro && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                  <Crown className="size-2.5" />
                  Pro
                </span>
              )}

              <button
                onClick={() => setOpen(false)}
                aria-label="Close Mitra"
                className="flex size-8 sm:size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="size-5 sm:size-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {/* Loading state */}
              {!knowledgeLoaded && open && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground px-1"
                >
                  <motion.div
                    className="size-3 rounded-full border-2 border-indigo-400 border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  Loading knowledge base...
                </motion.div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} onFollowUp={handleFollowUp} />
              ))}

              {/* Quick-action chips below the greeting (disappear after first message) */}
              {showGreetingChips && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <GreetingChips onSelect={handleQuickAction} />
                </motion.div>
              )}

              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Footer: upgrade nudge or input bar */}
            {hitLimit ? (
              <UpgradeNudge />
            ) : (
              <div className="sticky bottom-0 border-t border-border/50 bg-background/80 px-3 py-2.5">
                {!isActivePro &&
                  mitraLimit.remaining > 0 &&
                  mitraLimit.limit !== Infinity &&
                  mitraLimit.remaining < mitraLimit.limit && (
                    <p className="mb-1.5 text-center text-[10px] text-muted-foreground">
                      {mitraLimit.remaining} free message
                      {mitraLimit.remaining !== 1 ? "s" : ""} remaining
                      {" • "}
                      <Link
                        href="/app/pricing"
                        className="text-saffron hover:underline"
                      >
                        Upgrade for unlimited
                      </Link>
                    </p>
                  )}

                <div className="flex items-center gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Listening..." : "Ask about Java, Kafka, AWS..."}
                    disabled={isTyping || !knowledgeLoaded}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 disabled:opacity-50 transition-colors ${
                      isListening
                        ? "border-red-500/50 bg-red-500/5 focus:ring-red-500/30"
                        : "border-border/50 bg-surface focus:border-indigo-500/50 focus:ring-indigo-500/30"
                    }`}
                  />
                  {/* Mic button */}
                  {micSupported && (
                    <button
                      onClick={handleMicToggle}
                      disabled={isTyping || !knowledgeLoaded}
                      aria-label={isListening ? "Stop recording" : "Speak your question"}
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-95 disabled:opacity-40 ${
                        isListening
                          ? "bg-red-600 text-white animate-pulse"
                          : "bg-surface border border-border/50 text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                      }`}
                    >
                      {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                    </button>
                  )}
                  {/* Send button */}
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping || !knowledgeLoaded}
                    aria-label="Send message"
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
