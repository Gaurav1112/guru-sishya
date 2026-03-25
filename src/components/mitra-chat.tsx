"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Send, Bot, Sparkles, Crown, Lock } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

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

interface ChatMessage {
  id: string;
  role: "user" | "mitra";
  text: string;
  linkTopic?: string | null;
  linkHref?: string | null;
  timestamp: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FREE_MESSAGE_LIMIT = 3;

const TOPIC_MAP: Record<string, { label: string; href: string }> = {
  kafka:           { label: "Apache Kafka",     href: "/app/topics" },
  aws:             { label: "AWS",              href: "/app/topics" },
  kubernetes:      { label: "Kubernetes",       href: "/app/topics" },
  k8s:             { label: "Kubernetes",       href: "/app/topics" },
  docker:          { label: "Docker",           href: "/app/topics" },
  "design pattern":{ label: "Design Patterns",  href: "/app/topics" },
  singleton:       { label: "Design Patterns",  href: "/app/topics" },
  factory:         { label: "Design Patterns",  href: "/app/topics" },
  observer:        { label: "Design Patterns",  href: "/app/topics" },
  java:            { label: "Java",             href: "/app/topics" },
  spring:          { label: "Java",             href: "/app/topics" },
  jvm:             { label: "Java",             href: "/app/topics" },
  hashmap:         { label: "Java",             href: "/app/topics" },
  "system design": { label: "System Design",    href: "/app/topics" },
  microservice:    { label: "System Design",    href: "/app/topics" },
  database:        { label: "System Design",    href: "/app/topics" },
  sql:             { label: "System Design",    href: "/app/topics" },
  nosql:           { label: "System Design",    href: "/app/topics" },
  react:           { label: "React",            href: "/app/topics" },
  javascript:      { label: "JavaScript",       href: "/app/topics" },
  typescript:      { label: "TypeScript",       href: "/app/topics" },
  python:          { label: "Python",           href: "/app/topics" },
  algorithm:       { label: "Data Structures & Algorithms", href: "/app/topics" },
  "data structure":{ label: "Data Structures & Algorithms", href: "/app/topics" },
  array:           { label: "Data Structures & Algorithms", href: "/app/topics" },
  tree:            { label: "Data Structures & Algorithms", href: "/app/topics" },
  graph:           { label: "Data Structures & Algorithms", href: "/app/topics" },
  sorting:         { label: "Data Structures & Algorithms", href: "/app/topics" },
};

const GREETING_MESSAGE: ChatMessage = {
  id: "greeting",
  role: "mitra",
  text: "Hi! I'm Mitra, your study buddy. Ask me anything about interview topics — Java, System Design, Kafka, AWS, Kubernetes, Design Patterns, and more!",
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

  // Load structured Q&A files
  const fetches = CONTENT_FILES.map((url) =>
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && typeof item.question === "string" && typeof item.answer === "string") {
              results.push({ question: item.question, answer: item.answer, category: item.category });
            }
          }
        }
      })
      .catch(() => {
        // Silently skip files that fail to load
      })
  );

  // Load daily-questions — they're huge so we load a sample
  const dailyFetch = fetch("/content/daily-questions.json")
    .then((r) => (r.ok ? r.json() : []))
    .then((data: unknown) => {
      if (Array.isArray(data)) {
        // Sample up to 500 questions to keep search responsive
        const sample = data.slice(0, 500) as DailyQuestion[];
        for (const item of sample) {
          if (!item) continue;
          const q = item.question;
          // daily-questions may have explanation or correctAnswer
          const a = item.explanation ?? item.answer ?? item.correctAnswer ?? "";
          if (q && a) {
            results.push({ question: q, answer: a, category: item.topic });
          }
        }
      }
    })
    .catch(() => {});

  await Promise.all([...fetches, dailyFetch]);

  knowledgeCache = { items: results, loaded: true };
  return results;
}

// ── Search algorithm ──────────────────────────────────────────────────────────

function findBestAnswer(
  query: string,
  knowledge: QAItem[]
): { answer: string; confidence: number; question: string } {
  const stopWords = new Set(["what", "how", "why", "when", "the", "is", "are", "does", "can", "do", "a", "an", "in", "of", "and", "or", "to", "it", "be", "for"]);
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (queryWords.length === 0) {
    return { answer: "", confidence: 0, question: "" };
  }

  let bestMatch = { answer: "", confidence: 0, question: "" };

  for (const item of knowledge) {
    const itemText = (item.question + " " + item.answer).toLowerCase();
    // Count how many query words appear in the item text
    const matchCount = queryWords.filter((w) => itemText.includes(w)).length;
    // Bonus: if the question itself strongly matches
    const questionText = item.question.toLowerCase();
    const questionMatchCount = queryWords.filter((w) => questionText.includes(w)).length;
    const questionBonus = questionMatchCount / queryWords.length * 0.3;

    const confidence = matchCount / queryWords.length + questionBonus;

    if (confidence > bestMatch.confidence) {
      bestMatch = { answer: item.answer, confidence, question: item.question };
    }
  }

  return bestMatch;
}

function detectTopic(query: string): { label: string; href: string } | null {
  const lower = query.toLowerCase();
  for (const [keyword, topic] of Object.entries(TOPIC_MAP)) {
    if (lower.includes(keyword)) {
      return topic;
    }
  }
  return null;
}

function buildMitraResponse(
  query: string,
  knowledge: QAItem[]
): { text: string; linkTopic: string | null; linkHref: string | null } {
  const { answer, confidence, question } = findBestAnswer(query, knowledge);
  const detectedTopic = detectTopic(query);

  // No meaningful match
  if (confidence < 0.2 || !answer) {
    return {
      text: "I don't have specific information about that. Try asking about: Java, System Design, Kafka, AWS, Kubernetes, Design Patterns, or behavioral interview questions.",
      linkTopic: null,
      linkHref: null,
    };
  }

  // Trim answer to a readable length (max ~600 chars)
  const trimmedAnswer = answer.length > 600 ? answer.slice(0, 597).trimEnd() + "..." : answer;

  if (confidence >= 0.5) {
    // Good match
    const prefix = question ? `**${question}**\n\n` : "";
    return {
      text: `${prefix}${trimmedAnswer}`,
      linkTopic: detectedTopic?.label ?? null,
      linkHref: detectedTopic?.href ?? "/app/topics",
    };
  }

  // Partial match
  return {
    text: `I found something related:\n\n${trimmedAnswer}`,
    linkTopic: detectedTopic?.label ?? null,
    linkHref: detectedTopic?.href ?? "/app/topics",
  };
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 text-sm">
          <Bot className="size-3.5 text-indigo-400" />
        </div>
      )}

      <div className={`flex max-w-[82%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "rounded-tr-sm bg-saffron/90 text-background font-medium"
              : "rounded-tl-sm bg-indigo-500/15 border border-indigo-500/20 text-foreground"
          }`}
        >
          {msg.text}
        </div>

        {/* Topic link for Mitra messages */}
        {!isUser && msg.linkTopic && msg.linkHref && (
          <Link
            href={msg.linkHref}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
          >
            <Sparkles className="size-3" />
            Explore: {msg.linkTopic}
          </Link>
        )}
      </div>
    </motion.div>
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
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
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
      <p className="text-xs font-semibold text-foreground">Upgrade to Pro for unlimited Mitra conversations</p>
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
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [freeCount, setFreeCount] = useState(0); // messages used this session
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<QAItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active premium check
  const isActivePro = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  // Whether free user has hit message limit
  const hitLimit = !isActivePro && freeCount >= FREE_MESSAGE_LIMIT;

  // Scroll to bottom whenever messages change
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

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || hitLimit) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    if (!isActivePro) setFreeCount((c) => c + 1);

    // Simulate search delay (makes it feel like it's "thinking")
    const delay = Math.max(600, Math.min(1400, trimmed.length * 12));
    await new Promise((res) => setTimeout(res, delay));

    const { text, linkTopic, linkHref } = buildMitraResponse(trimmed, knowledgeItems);

    const mitraMsg: ChatMessage = {
      id: `mitra-${Date.now()}`,
      role: "mitra",
      text,
      linkTopic,
      linkHref,
      timestamp: Date.now(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, mitraMsg]);
  }, [input, isTyping, hitLimit, knowledgeItems, isActivePro]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Floating button — always visible; lock icon for free users */}
      <AnimatePresence>
        {!open && (
          isActivePro ? (
            /* Pro user: open chat */
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
              {/* Pulse ring */}
              <span className="absolute inset-0 animate-ping rounded-full border border-indigo-400/30 opacity-60" />
            </motion.button>
          ) : (
            /* Free user: show lock overlay, clicking opens upgrade prompt inside chat */
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
              {/* Lock badge overlay */}
              <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-saffron border border-background shadow">
                <Lock className="size-2.5 text-background" />
              </span>
            </motion.button>
          )
        )}
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
              /* Mobile: full screen */
              inset-0 sm:inset-auto
              /* Desktop: fixed size, bottom-right */
              sm:bottom-5 sm:right-5 sm:w-[350px] sm:h-[520px]`}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 border-b border-border/50 bg-gradient-to-r from-indigo-950/80 to-background px-4 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30">
                <Bot className="size-4 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-foreground leading-tight">Mitra</p>
                <p className="text-[11px] text-indigo-400/80 leading-tight">Your Study Buddy</p>
              </div>
              {!isActivePro && (
                <span className="inline-flex items-center gap-1 rounded-full border border-saffron/30 bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron">
                  {FREE_MESSAGE_LIMIT - freeCount > 0
                    ? `${FREE_MESSAGE_LIMIT - freeCount} free left`
                    : "Limit reached"}
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
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                  Loading knowledge base...
                </motion.div>
              )}

              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}

              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Upgrade nudge or input */}
            {hitLimit ? (
              <UpgradeNudge />
            ) : (
              <div className="sticky bottom-0 border-t border-border/50 bg-background/80 px-3 py-2.5">
                {/* Free message counter for non-Pro */}
                {!isActivePro && freeCount > 0 && freeCount < FREE_MESSAGE_LIMIT && (
                  <p className="mb-1.5 text-center text-[10px] text-muted-foreground">
                    {FREE_MESSAGE_LIMIT - freeCount} free message{FREE_MESSAGE_LIMIT - freeCount !== 1 ? "s" : ""} remaining •{" "}
                    <Link href="/app/pricing" className="text-saffron hover:underline">Upgrade for unlimited</Link>
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about Java, Kafka, AWS..."
                    disabled={isTyping || !knowledgeLoaded}
                    className="flex-1 rounded-xl border border-border/50 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 transition-colors"
                  />
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
