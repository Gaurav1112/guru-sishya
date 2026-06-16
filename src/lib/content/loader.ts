// ────────────────────────────────────────────────────────────────────────────
// Content Loader — loads pre-generated topic content from JSON files
// ────────────────────────────────────────────────────────────────────────────

import type { GeneratedSession } from "@/lib/plan/types";
import type { LadderLevel } from "@/lib/ladder/types";
import type { CuratedResource } from "@/lib/resources/types";

// ── Exported types ────────────────────────────────────────────────────────

export interface QuizBankQuestion {
  question: string;
  format: string;
  difficulty: number;
  bloomLabel: string;
  options?: string[];
  correctAnswer?: string;
  explanation: string;
}

export interface TopicContent {
  topic: string; // normalised — always populated after load
  name?: string; // some files use "name" instead of "topic"
  category: string;
  cheatSheet: string; // markdown
  resources: CuratedResource[];
  ladder: { levels: LadderLevel[] };
  plan: {
    overview: string;
    skippedTopics: string;
    sessions: GeneratedSession[];
  };
  quizBank: QuizBankQuestion[];
}

// ── Internal cache ────────────────────────────────────────────────────────

const CONTENT_FILES = [
  "/content/ds-algo.json",
  "/content/dsa-patterns.json",
  "/content/system-design-fundamentals.json",
  "/content/system-design-cases.json",
  "/content/core-cs.json",
  "/content/design-patterns.json",
  "/content/estimation.json",
  "/content/interview-framework.json",
  "/content/kafka.json",
  "/content/aws.json",
  "/content/k8s-docker.json",
  "/content/javascript.json",
  "/content/react-nextjs.json",
  "/content/html-css.json",
  "/content/java-core.json",
  "/content/spring-boot.json",
  "/content/nosql.json",
  "/content/rdbms-sql.json",
  "/content/nodejs.json",
  "/content/dsa-advanced.json",
  "/content/system-design-cases-detailed.json",
  "/content/segment-trees.json",
  "/content/string-algorithms.json",
  "/content/advanced-graphs.json",
  "/content/greedy-algorithms.json",
  "/content/fenwick-tree.json",
];

let _contentCache: TopicContent[] | null = null;

// ── Internal per-file fetch ───────────────────────────────────────────────

async function fetchFileContent(file: string): Promise<TopicContent[]> {
  try {
    const response = await fetch(file);
    if (!response.ok) return [];
    const raw = (await response.json()) as TopicContent | TopicContent[];
    const items: TopicContent[] = Array.isArray(raw) ? raw : [raw];
    const normalized: TopicContent[] = [];
    for (const item of items) {
      const norm = (!item.topic && item.name) ? { ...item, topic: item.name } : item;
      if (norm.plan?.sessions) {
        norm.plan.sessions = norm.plan.sessions.map((s, idx) => ({
          ...s,
          sessionNumber: s.sessionNumber ?? idx + 1,
        }));
      }
      if (norm.topic) normalized.push(norm);
    }
    return normalized;
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Load all pre-generated content from /public/content/*.json.
 * Results are cached in memory after the first successful load.
 */
export async function loadAllContent(): Promise<TopicContent[]> {
  if (_contentCache !== null) return _contentCache;
  const results = (await Promise.all(CONTENT_FILES.map(fetchFileContent))).flat();
  _contentCache = results;
  return results;
}

/**
 * Stream content progressively — calls onBatch as each file resolves so the
 * UI can render partial results immediately instead of waiting for all files.
 * Also populates the module-level cache once all files are loaded.
 */
export function streamContent(
  onBatch: (items: TopicContent[]) => void
): Promise<void> {
  if (_contentCache !== null) {
    onBatch(_contentCache);
    return Promise.resolve();
  }

  const all: TopicContent[] = [];
  let remaining = CONTENT_FILES.length;

  return new Promise<void>((resolve) => {
    for (const file of CONTENT_FILES) {
      fetchFileContent(file).then((items) => {
        if (items.length > 0) {
          all.push(...items);
          onBatch(items);
        }
        remaining--;
        if (remaining === 0) {
          _contentCache = all;
          resolve();
        }
      });
    }
  });
}

/**
 * Find content for a specific topic using fuzzy name matching.
 * Matches if the stored topic name contains the search term or vice versa
 * (case-insensitive).
 */
export async function findTopicContent(
  topicName: string
): Promise<TopicContent | null> {
  const all = await loadAllContent();
  if (all.length === 0) return null;

  const needle = topicName.toLowerCase().trim();

  // Exact match first
  const exact = all.find((t) => t.topic.toLowerCase().trim() === needle);
  if (exact) return exact;

  // Contains match — either direction
  const contains = all.find((t) => {
    const stored = t.topic.toLowerCase().trim();
    return stored.includes(needle) || needle.includes(stored);
  });
  if (contains) return contains;

  // Word overlap scoring — find best match
  const needleWords = needle.split(/\s+/);
  let bestMatch: TopicContent | null = null;
  let bestScore = 0;

  for (const topic of all) {
    const storedWords = topic.topic.toLowerCase().trim().split(/\s+/);
    let score = 0;
    for (const word of needleWords) {
      if (word.length < 3) continue;
      if (storedWords.some((sw) => sw.includes(word) || word.includes(sw))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = topic;
    }
  }

  // Require at least one meaningful word match
  return bestScore >= 1 ? bestMatch : null;
}

/**
 * Get all available pre-generated topic names.
 */
export async function getAvailableTopics(): Promise<string[]> {
  const all = await loadAllContent();
  return all.map((t) => t.topic);
}

/**
 * Clear the in-memory cache (useful for testing or forced reload).
 */
export function clearContentCache(): void {
  _contentCache = null;
}
