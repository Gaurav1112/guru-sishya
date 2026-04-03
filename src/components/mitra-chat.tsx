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
import { usePathname } from "next/navigation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useMitraLimit } from "@/hooks/use-mitra-limit";
import { createAIProvider } from "@/lib/ai";
import { db } from "@/lib/db";

// ── Types ──────────────────────────────────────────────────────────────────────

interface QAItem {
  question: string;
  answer: string;
  category?: string;
  difficulty?: string;
  topicId?: number;       // numeric topic ID for source linking
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

interface SourceAttribution {
  category: string;
  topicId?: number;
  sessionNumber?: number;
  label: string;     // e.g. "Java > Core Concepts"
  href: string;      // link to the relevant topic/session
}

interface ChatMessage {
  id: string;
  role: "user" | "mitra";
  text: string;
  fullText?: string;         // untruncated answer for "Show more"
  matchedQuestion?: string;  // the Q&A question that matched
  relatedLinks?: RelatedLink[];
  followUps?: string[];      // suggested follow-up questions
  source?: SourceAttribution; // where the answer came from
  timestamp: number;
}

// ── Page context types ───────────────────────────────────────────────────────

interface PageContext {
  topicId: number | null;
  topicName: string | null;
  subPage: string | null;   // "quiz", "plan", "cheatsheet", "ladder", etc.
  sessionNumber: number | null;
}

/**
 * Parse the current pathname to extract topic context.
 * Routes: /app/topic/3, /app/topic/3/quiz, /app/topic/3/plan/session/2
 */
function parsePageContext(pathname: string): Omit<PageContext, "topicName"> {
  const topicMatch = pathname.match(/\/app\/topic\/(\d+)/);
  if (!topicMatch) {
    return { topicId: null, subPage: null, sessionNumber: null };
  }

  const topicId = parseInt(topicMatch[1], 10);

  // Check for session: /app/topic/3/plan/session/2
  const sessionMatch = pathname.match(/\/plan\/session\/(\d+)/);
  const sessionNumber = sessionMatch ? parseInt(sessionMatch[1], 10) : null;

  // Sub-page: /app/topic/3/quiz → "quiz"
  const subPageMatch = pathname.match(/\/app\/topic\/\d+\/(\w+)/);
  const subPage = subPageMatch ? subPageMatch[1] : null;

  return { topicId, subPage, sessionNumber };
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
  css:               "Core CS & Languages",
  html:              "Core CS & Languages",
  dom:               "Core CS & Languages",
  closure:           "Core CS & Languages",
  promise:           "Core CS & Languages",
  async:             "Core CS & Languages",
  await:             "Core CS & Languages",
  "event loop":      "Core CS & Languages",
  // DSA
  "binary search":   "Data Structures & Algorithms",
  "binary tree":     "Data Structures & Algorithms",
  "data structure":  "Data Structures & Algorithms",
  "dynamic programming": "Data Structures & Algorithms",
  "hash map":        "Data Structures & Algorithms",
  "linked list":     "Data Structures & Algorithms",
  "merge sort":      "Data Structures & Algorithms",
  "quick sort":      "Data Structures & Algorithms",
  "sliding window":  "Data Structures & Algorithms",
  "two pointer":     "Data Structures & Algorithms",
  algorithm:         "Data Structures & Algorithms",
  array:             "Data Structures & Algorithms",
  arraylist:         "Data Structures & Algorithms",
  bfs:               "Data Structures & Algorithms",
  dfs:               "Data Structures & Algorithms",
  dp:                "Data Structures & Algorithms",
  graph:             "Data Structures & Algorithms",
  hash:              "Data Structures & Algorithms",
  heap:              "Data Structures & Algorithms",
  linkedlist:        "Data Structures & Algorithms",
  queue:             "Data Structures & Algorithms",
  recursion:         "Data Structures & Algorithms",
  sorting:           "Data Structures & Algorithms",
  stack:             "Data Structures & Algorithms",
  tree:              "Data Structures & Algorithms",
  trie:              "Data Structures & Algorithms",
  "segment tree":    "Data Structures & Algorithms",
  "topological sort": "Data Structures & Algorithms",
  dijkstra:          "Data Structures & Algorithms",
  bellman:           "Data Structures & Algorithms",
  floyd:             "Data Structures & Algorithms",
  kruskal:           "Data Structures & Algorithms",
  prim:              "Data Structures & Algorithms",
  knapsack:          "Data Structures & Algorithms",
  backtracking:      "Data Structures & Algorithms",
  greedy:            "Data Structures & Algorithms",
  "bit manipulation": "Data Structures & Algorithms",
  // More System Design
  websocket:         "System Design",
  oauth:             "System Design",
  jwt:               "System Design",
  "circuit breaker": "System Design",
  "saga pattern":    "System Design",
  "event sourcing":  "System Design",
  cqrs:              "System Design",
  // Database
  index:             "System Design",
  "b-tree":          "System Design",
  acid:              "System Design",
  transaction:       "System Design",
  normalization:     "System Design",
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
  "linked list":         ["linkedlist", "linked-list"],
  "array list":          ["arraylist", "array-list"],
  "hash map":            ["hashmap", "hash-map"],
  "binary search tree":  ["bst"],
  "breadth first search": ["bfs", "breadth-first"],
  "depth first search":  ["dfs", "depth-first"],
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
  "/content/java-qa-part2.json",
  "/content/java-qa-part3.json",
  "/content/company-tech-qa-part3.json",
  "/content/core-cs-expanded-1.json",
];

// Topic content files — quizBank Q&A and lesson content extracted from these
const TOPIC_CONTENT_FILES = [
  "/content/java-core.json",
  "/content/spring-boot.json",
  "/content/ds-algo.json",
  "/content/dsa-patterns.json",
  "/content/system-design-fundamentals.json",
  "/content/system-design-cases.json",
  "/content/core-cs.json",
  "/content/design-patterns.json",
  "/content/javascript.json",
  "/content/react-nextjs.json",
  "/content/html-css.json",
  "/content/aws.json",
  "/content/kafka.json",
  "/content/k8s-docker.json",
  "/content/nosql.json",
  "/content/nodejs.json",
  "/content/rdbms-sql.json",
  "/content/estimation.json",
  "/content/interview-framework.json",
];

// ── Knowledge base (module-level cache) ───────────────────────────────────────

let knowledgeCache: KnowledgeBase = { items: [], loaded: false };

async function loadKnowledge(): Promise<QAItem[]> {
  if (knowledgeCache.loaded) return knowledgeCache.items;

  let items: QAItem[] = [];

  // Load existing Q&A files (flat array of {question, answer} objects)
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
              items.push({
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

  // Load all daily questions
  const dailyFetch = fetch("/content/daily-questions.json")
    .then((r) => (r.ok ? r.json() : []))
    .then((data: unknown) => {
      if (Array.isArray(data)) {
        const sample = (Array.isArray(data) ? data : []) as DailyQuestion[];
        for (const item of sample) {
          if (!item) continue;
          const q = item.question;
          const a = item.explanation ?? item.answer ?? item.correctAnswer ?? "";
          if (q && a) items.push({ question: q, answer: a, category: item.topic });
        }
      }
    })
    .catch(() => {});

  await Promise.all([...fetches, dailyFetch]);

  // Load topic content files — extract Q&A from quizBank and plan sessions (parallel)
  const topicFetches = TOPIC_CONTENT_FILES.map(async (file) => {
    try {
      const res = await fetch(file);
      if (!res.ok) return [];
      const data = await res.json();
      const topics = Array.isArray(data) ? data : [data];
      const localItems: QAItem[] = [];

      for (const topic of topics) {
        const category = topic.topic || topic.name || "";

        // Extract from quizBank
        if (topic.quizBank && Array.isArray(topic.quizBank)) {
          for (const q of topic.quizBank) {
            if (q.question && q.explanation) {
              localItems.push({
                question: q.question,
                answer: q.explanation,
                category,
                difficulty: String(q.difficulty || ""),
              });
            }
          }
        }

        // Extract from plan sessions (lesson content)
        if (topic.plan?.sessions && Array.isArray(topic.plan.sessions)) {
          for (const session of topic.plan.sessions) {
            if (session.title && session.content) {
              localItems.push({
                question: `Explain ${session.title}`,
                answer: typeof session.content === "string"
                  ? session.content.substring(0, 1500)
                  : JSON.stringify(session.content).substring(0, 1500),
                category,
              });
            }
          }
        }
      }
      return localItems;
    } catch {
      return [];
    }
  });

  const topicResults = await Promise.all(topicFetches);
  for (const batch of topicResults) {
    if (batch) items.push(...batch);
  }

  // Filter out items with empty or trivially short answers
  items = items.filter(item => item.answer && item.answer.trim().length > 10);

  // Deduplicate by question text to prevent stale/duplicate matches
  const seen = new Set<string>();
  items = items.filter(item => {
    const key = item.question.trim().toLowerCase().substring(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  knowledgeCache = { items, loaded: true };
  return items;
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

  // Bidirectional synonym expansion — use exact word match, not substring
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    const canonWords = canonical.toLowerCase().split(/\s+/);
    const hasCanon = canonWords.every((cw) =>
      words.some((w) => w === cw)
    );
    if (hasCanon) {
      for (const alias of aliases) {
        alias.split(/\s+/).forEach((a) => expanded.add(a));
      }
    }
    for (const alias of aliases) {
      if (words.some((w) => w === alias)) {
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
  item: QAItem,
  detectedTopic?: string | null,
  currentTopicName?: string | null
): number {
  const qText = item.question.toLowerCase();
  const aText = item.answer.toLowerCase();

  let score = 0;

  // Phrase bonus: consecutive query words in question (stronger weight)
  const queryPhrase = queryWords.join(" ");
  if (queryPhrase.length > 3 && wordBoundaryMatch(qText, queryPhrase)) score += 1.0;

  // Also check if the full query appears in the answer
  if (queryPhrase.length > 3 && wordBoundaryMatch(aText, queryPhrase)) score += 0.3;

  // Per-word scoring: question matches weight more than answer matches
  // Use word-boundary matching to prevent "java" matching "javascript"
  let questionHits = 0;
  let answerHits = 0;
  for (const word of expandedWords) {
    if (word.length < 3) continue; // skip very short words
    if (wordBoundaryMatch(qText, word)) {
      score += 0.4;
      questionHits++;
    } else if (wordBoundaryMatch(aText, word)) {
      score += 0.15;
      answerHits++;
    }
  }

  // Coverage bonus: reward when most query words match
  const totalHits = questionHits + answerHits;
  const coverage = totalHits / Math.max(expandedWords.length, 1);
  if (coverage >= 0.8) score += 0.3; // most words matched
  if (coverage >= 0.5) score += 0.1; // half matched

  // Topic relevance boost: when TOPIC_MAP detects a tech topic (e.g. "kafka" →
  // "Apache Kafka"), strongly prefer items whose category matches that topic.
  // This prevents generic/literary results from outranking tech content.
  if (detectedTopic && item.category) {
    const catLower = item.category.toLowerCase();
    const topicLower = detectedTopic.toLowerCase();
    if (catLower.includes(topicLower) || topicLower.includes(catLower)) {
      score += 0.8; // significant boost for category match
    }
  }

  // Page context boost: when user is on a specific topic page, prefer items from that topic
  if (currentTopicName && item.category) {
    const catLower = item.category.toLowerCase();
    const ctxLower = currentTopicName.toLowerCase();
    if (catLower.includes(ctxLower) || ctxLower.includes(catLower)) {
      score += 0.5; // moderate boost for page-context relevance
    }
  }

  // Normalize less aggressively — use sqrt to dampen long query penalty
  return score / Math.max(Math.sqrt(expandedWords.length), 1);
}

function findBestAnswer(
  query: string,
  knowledge: QAItem[],
  currentTopicName?: string | null
): { answer: string; confidence: number; question: string; category: string; topicId?: number } {
  const queryWords = tokenize(query);

  if (queryWords.length === 0) {
    return { answer: "", confidence: 0, question: "", category: "" };
  }

  const expandedWords = expandQuery(queryWords);
  // Detect tech topic from TOPIC_MAP so we can boost relevant items
  const detectedTopic = detectTopicLabel(query);
  let bestMatch: { answer: string; confidence: number; question: string; category: string; topicId?: number } = { answer: "", confidence: 0, question: "", category: "" };

  for (const item of knowledge) {
    const confidence = scoreItem(queryWords, expandedWords, item, detectedTopic, currentTopicName);
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        answer: item.answer,
        confidence,
        question: item.question,
        category: item.category ?? "",
        topicId: item.topicId,
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

/**
 * Check if a keyword appears in text as a whole word (word-boundary match).
 * This prevents "java" from matching "javascript".
 */
function wordBoundaryMatch(text: string, keyword: string): boolean {
  // Escape special regex chars in keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:^|[\\s,.;:!?/"'(\\[])${escaped}(?=$|[\\s,.;:!?/"'\\])})`, "i");
  return re.test(text);
}

function detectTopicLabel(query: string): string | null {
  const lower = query.toLowerCase();
  // Sort by length descending so longer phrases match first
  const entries = Object.entries(TOPIC_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [keyword, label] of entries) {
    if (wordBoundaryMatch(lower, keyword)) return label;
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
    href: topicLabel
      ? `/app/questions?category=${encodeURIComponent(topicLabel)}`
      : "/app/questions",
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

function getSuggestedQuestions(topic: string, knowledge: QAItem[], count: number = 3): string[] {
  const topicItems = knowledge.filter(item =>
    item.category?.toLowerCase().includes(topic.toLowerCase())
  );
  const shuffled = topicItems.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(item => item.question);
}

function buildSourceAttribution(
  category: string,
  topicId?: number
): SourceAttribution | undefined {
  if (!category) return undefined;
  // Build a link to the topic — use topicId if available, otherwise search
  const href = topicId
    ? `/app/topic/${topicId}`
    : `/app/topics?search=${encodeURIComponent(category.toLowerCase())}`;

  return {
    category,
    topicId,
    label: category,
    href,
  };
}

function buildMitraResponse(
  query: string,
  knowledge: QAItem[],
  recentMessages?: ChatMessage[],
  currentTopicName?: string | null
): Omit<ChatMessage, "id" | "role" | "timestamp"> {
  // Context enrichment for follow-up questions (pronouns only)
  let enrichedQuery = query;
  if (recentMessages && recentMessages.length > 0) {
    const pronouns = /\b(it|this|that|they|them|its|these|those|the same)\b/i;
    if (pronouns.test(query)) {
      // Find the last Mitra response's topic
      const lastMitra = [...recentMessages].reverse().find(m => m.role === "mitra" && m.matchedQuestion);
      if (lastMitra?.matchedQuestion) {
        // Strip "Related: " prefix if present
        const topic = lastMitra.matchedQuestion.replace(/^Related:\s*/i, "");
        enrichedQuery = `${topic} ${query}`;
      }
    }
  }

  // Search with enriched query first
  const enrichedResult = findBestAnswer(enrichedQuery, knowledge, currentTopicName);

  // If enrichment made it worse, fall back to original query
  let result = enrichedResult;
  if (enrichedQuery !== query) {
    const originalResult = findBestAnswer(query, knowledge, currentTopicName);
    if (originalResult.confidence > enrichedResult.confidence) {
      result = originalResult;
    }
  }

  const { answer, confidence, question, category, topicId: matchedTopicId } = result;
  const topicLabel = detectTopicLabel(enrichedQuery) ?? (category || null);

  if (confidence < 0.30 || !answer) {
    // Get 3 closest matching questions regardless of threshold
    const queryWords = tokenize(enrichedQuery);
    const expandedWords = expandQuery(queryWords);
    const fallbackTopic = detectTopicLabel(enrichedQuery);
    const topMatches = knowledge
      .map(item => ({ item, score: scoreItem(queryWords, expandedWords, item, fallbackTopic, currentTopicName) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const relatedQuestions = topMatches
      .filter(m => m.score > 0.1)
      .map(m => m.item.question);

    return {
      text: topicLabel
        ? `I found some related content in ${topicLabel}. Here are questions I can help with:`
        : `I'm not sure about that exact question, but here are some related topics I can help with:`,
      relatedLinks: buildRelatedLinks(topicLabel),
      followUps: relatedQuestions.length > 0 ? relatedQuestions : getSuggestedQuestions(topicLabel || "", knowledge),
    };
  }

  const PREVIEW_LENGTH = 400;
  const isLong = answer.length > PREVIEW_LENGTH;
  const previewText = isLong ? answer.slice(0, PREVIEW_LENGTH).trimEnd() + "…" : answer;

  const followUps = findRelatedQuestions(category, question, knowledge, 3);
  const relatedLinks = buildRelatedLinks(topicLabel);

  const source = buildSourceAttribution(category, matchedTopicId);

  if (confidence >= 0.4) {
    return {
      text: previewText,
      fullText: isLong ? answer : undefined,
      matchedQuestion: question || undefined,
      relatedLinks,
      followUps: followUps.length > 0 ? followUps : undefined,
      source,
    };
  }

  // Partial match
  return {
    text: previewText,
    fullText: isLong ? answer : undefined,
    matchedQuestion: question ? `Related: ${question}` : undefined,
    relatedLinks,
    followUps: followUps.length > 0 ? followUps : undefined,
    source,
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
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-saffron/90 text-background font-medium whitespace-pre-wrap"
              : "rounded-tl-sm bg-indigo-500/15 border border-indigo-500/20 text-foreground mitra-bubble"
          }`}
        >
          {isUser ? (
            msg.text
          ) : (
            <MarkdownRenderer
              content={
                hasMore && !expanded
                  ? msg.text
                  : expanded && msg.fullText
                  ? msg.fullText
                  : msg.text
              }
              className="mitra-md prose-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            />
          )}
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

        {/* Source attribution */}
        {!isUser && msg.source && (
          <Link
            href={msg.source.href}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 transition-colors px-0.5 mt-0.5"
          >
            <BookOpen className="size-3 shrink-0" />
            <span>Source: {msg.source.label}</span>
          </Link>
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
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeLoaded, setKnowledgeLoaded] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<QAItem[]>([]);
  const [pageContext, setPageContext] = useState<PageContext>({
    topicId: null,
    topicName: null,
    subPage: null,
    sessionNumber: null,
  });
  const prevPathnameRef = useRef<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resolve page context from pathname + Dexie topic lookup
  useEffect(() => {
    const parsed = parsePageContext(pathname);
    const newCtx: PageContext = { ...parsed, topicName: null };

    if (parsed.topicId) {
      db.topics
        .get(parsed.topicId)
        .then((topic) => {
          if (topic) {
            newCtx.topicName = topic.name;
          }
          setPageContext(newCtx);
        })
        .catch(() => {
          setPageContext(newCtx);
        });
    } else {
      setPageContext(newCtx);
    }
  }, [pathname]);

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

  // Focus input when chat opens + show contextual greeting on topic pages
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);

      // Show contextual greeting when opening on a topic page (only if chat is fresh)
      if (
        pageContext.topicName &&
        messages.length === 1 &&
        messages[0].id === "greeting" &&
        prevPathnameRef.current !== pathname
      ) {
        const subLabel = pageContext.subPage
          ? ` (${pageContext.subPage}${pageContext.sessionNumber ? ` session ${pageContext.sessionNumber}` : ""})`
          : "";
        const contextGreeting: ChatMessage = {
          id: "context-greeting",
          role: "mitra",
          text: `I see you're studying **${pageContext.topicName}**${subLabel}. Need help with anything here?`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, contextGreeting]);
        prevPathnameRef.current = pathname;
      }
    }
  }, [open, pageContext, pathname, messages]);

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

      try {
        // Simulate thinking delay proportional to query length
        const delay = Math.max(500, Math.min(1200, trimmed.length * 10));
        await new Promise((res) => setTimeout(res, delay));

        // Pass recent conversation context for follow-up resolution
        const recentMessages = messages.slice(-10);
        let partial = buildMitraResponse(trimmed, knowledgeItems, recentMessages, pageContext.topicName);

        // If knowledge base couldn't answer, try AI provider fallback
        const isLowConfidence = partial.text.includes("I'm not sure about that") ||
          partial.text.includes("Here are questions I can help with");
        if (isLowConfidence) {
          const { apiKey, aiProvider } = useStore.getState();
          if (aiProvider !== "static" && apiKey) {
            try {
              const provider = createAIProvider(apiKey, aiProvider);
              const systemPrompt =
                "You are Mitra, a friendly software engineering interview preparation tutor. " +
                "You're helping a student revise and learn. Be concise, practical, and encouraging. " +
                "Use examples and analogies. If the student asks about a topic, explain it clearly. " +
                "If they ask follow-up questions, maintain context from the conversation. " +
                "Keep responses under 300 words. Format with short paragraphs.";

              // Build conversation history for context
              const historyMessages = [...recentMessages, userMsg];
              const conversationContext = historyMessages
                .map((m) =>
                  m.role === "user" ? `Student: ${m.text}` : `Mitra: ${m.text}`
                )
                .join("\n\n");

              const userPrompt = `Conversation so far:\n${conversationContext}\n\nRespond to the student's latest message.`;
              const aiResponse = await provider.generateText(userPrompt, systemPrompt, { maxTokens: 800 });

              if (aiResponse && aiResponse.trim()) {
                partial = {
                  text: aiResponse.trim(),
                  relatedLinks: partial.relatedLinks,
                  followUps: partial.followUps,
                };
              }
            } catch {
              // Keep the knowledge base fallback response
            }
          }
        }

        const mitraMsg: ChatMessage = {
          id: `mitra-${Date.now()}`,
          role: "mitra",
          ...partial,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, mitraMsg]);
      } catch {
        // Always recover from errors
        setMessages((prev) => [
          ...prev,
          {
            id: `mitra-${Date.now()}`,
            role: "mitra" as const,
            text: "Sorry, I had trouble processing that. Could you rephrase your question?",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, knowledgeItems, mitraLimit, messages, pageContext.topicName]
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
              className="fixed bottom-24 right-4 sm:bottom-5 sm:right-5 z-[90] flex size-14 items-center justify-center rounded-full border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-[0_4px_24px_rgba(99,102,241,0.45)] transition-shadow hover:shadow-[0_6px_32px_rgba(99,102,241,0.65)]"
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
              className="fixed bottom-24 right-4 sm:bottom-5 sm:right-5 z-[90] flex size-14 items-center justify-center rounded-full border border-indigo-500/40 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-[0_4px_24px_rgba(99,102,241,0.45)] transition-shadow hover:shadow-[0_6px_32px_rgba(99,102,241,0.65)]"
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
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="mitra-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden fixed inset-0 z-[85] bg-black/50"
              onClick={() => setOpen(false)}
            />
          <motion.div
            key="mitra-window"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className={`fixed z-[90] flex flex-col overflow-hidden border border-border/60 bg-background shadow-[0_8px_48px_rgba(0,0,0,0.5)]
              inset-x-0 bottom-0 rounded-t-2xl h-[85vh]
              sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[370px] sm:h-[560px] sm:rounded-2xl`}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

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
                className="flex size-10 sm:size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <X className="size-5 sm:size-4" />
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-3">
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
              <div className="shrink-0 border-t border-border/50 bg-background/80 px-3 py-2.5 pb-safe">
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
