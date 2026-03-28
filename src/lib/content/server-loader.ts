// ────────────────────────────────────────────────────────────────────────────
// Server-side Content Loader -- reads content JSON files from disk using fs
// Used by server components (e.g. /learn pages) for SSG/SSR
// ────────────────────────────────────────────────────────────────────────────

import * as fs from "node:fs";
import * as path from "node:path";

// ── Types (mirrors loader.ts TopicContent) ──────────────────────────────────

export interface ServerTopicContent {
  topic: string;
  name?: string;
  category: string;
  cheatSheet: string;
  plan: {
    overview: string;
    skippedTopics: string;
    sessions: Array<{
      sessionNumber: number;
      title: string;
      content: string;
      objectives?: string[];
      activities?: string[];
      reviewQuestions?: string[];
    }>;
  };
  quizBank: Array<{
    question: string;
    format: string;
    difficulty: number;
    bloomLabel: string;
    options?: string[];
    correctAnswer?: string;
    explanation: string;
  }>;
  resources: Array<{
    title: string;
    url: string;
    type: string;
    description?: string;
  }>;
  ladder?: {
    levels: Array<{
      level: number;
      title: string;
      description: string;
    }>;
  };
}

// ── Content files (mirrors loader.ts) ───────────────────────────────────────

const CONTENT_FILES = [
  "ds-algo.json",
  "dsa-patterns.json",
  "system-design-fundamentals.json",
  "system-design-cases.json",
  "core-cs.json",
  "design-patterns.json",
  "estimation.json",
  "interview-framework.json",
  "kafka.json",
  "aws.json",
  "k8s-docker.json",
  "javascript.json",
  "react-nextjs.json",
  "html-css.json",
  "java-core.json",
  "spring-boot.json",
  "nosql.json",
  "rdbms-sql.json",
  "nodejs.json",
];

// ── Slugify ─────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ── Cache ───────────────────────────────────────────────────────────────────

let _cache: ServerTopicContent[] | null = null;

/**
 * Load all content from disk. Cached after first call.
 * This runs at build time (server-side only).
 */
export function loadAllContentFromDisk(): ServerTopicContent[] {
  if (_cache !== null) return _cache;

  const contentDir = path.join(process.cwd(), "public", "content");
  const allTopics: ServerTopicContent[] = [];
  const seen = new Set<string>();

  for (const file of CONTENT_FILES) {
    try {
      const filePath = path.join(contentDir, file);
      if (!fs.existsSync(filePath)) continue;
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as
        | ServerTopicContent
        | ServerTopicContent[];
      const items: ServerTopicContent[] = Array.isArray(raw) ? raw : [raw];

      for (const item of items) {
        // Normalize: some files use "name" instead of "topic"
        const topicName = item.topic || item.name;
        if (!topicName) continue;

        const key = topicName.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        allTopics.push({
          ...item,
          topic: topicName,
        });
      }
    } catch {
      // Skip files that fail to parse
    }
  }

  _cache = allTopics;
  return allTopics;
}

/**
 * Find a topic by its slug.
 */
export function findTopicBySlug(
  slug: string,
): ServerTopicContent | null {
  const all = loadAllContentFromDisk();
  return all.find((t) => slugify(t.topic) === slug) ?? null;
}

/**
 * Get all topics with their slugs.
 */
export function getAllTopicsWithSlugs(): Array<{
  topic: string;
  slug: string;
  category: string;
}> {
  const all = loadAllContentFromDisk();
  return all.map((t) => ({
    topic: t.topic,
    slug: slugify(t.topic),
    category: t.category,
  }));
}

// ── Related Topics ─────────────────────────────────────────────────────────

/**
 * Get related topics for internal linking.
 * Returns topics in the same category first, then nearby categories.
 */
export function getRelatedTopics(
  currentTopic: string,
  limit = 3,
): Array<{ topic: string; slug: string; category: string }> {
  const all = loadAllContentFromDisk();
  const current = all.find(
    (t) => t.topic.toLowerCase().trim() === currentTopic.toLowerCase().trim(),
  );
  if (!current) return [];

  const currentKey = current.topic.toLowerCase().trim();

  // Same category first (excluding current), then other categories
  const sameCategory = all.filter(
    (t) =>
      t.category === current.category &&
      t.topic.toLowerCase().trim() !== currentKey,
  );
  const otherCategory = all.filter(
    (t) =>
      t.category !== current.category &&
      t.topic.toLowerCase().trim() !== currentKey,
  );

  // Shuffle same-category deterministically based on topic name
  const hash = currentTopic.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const shuffled = [...sameCategory].sort(
    (a, b) =>
      ((a.topic.charCodeAt(0) + hash) % 97) -
      ((b.topic.charCodeAt(0) + hash) % 97),
  );

  const candidates = [...shuffled, ...otherCategory].slice(0, limit);
  return candidates.map((t) => ({
    topic: t.topic,
    slug: slugify(t.topic),
    category: t.category,
  }));
}

// ── Question Bank helpers ──────────────────────────────────────────────────

export interface IndexableQuestion {
  slug: string;
  question: string;
  format: string;
  difficulty: number;
  bloomLabel: string;
  options?: string[];
  explanation: string;
  topicName: string;
  topicSlug: string;
  category: string;
}

/**
 * Generate a URL-safe slug from a question + topic.
 * Uses first 8 words of question text + topic slug, deduped.
 */
function questionSlug(question: string, topicName: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join("-");
  const topic = slugify(topicName);
  return `${words}-${topic}`.replace(/-+/g, "-").replace(/-$/, "");
}

/**
 * High-search-volume topics to prioritize for question bank SEO.
 * Order matters: earlier topics get more questions selected.
 */
const PRIORITY_TOPICS = [
  "Arrays & Strings",
  "Dynamic Programming",
  "Trees & BST",
  "Graphs",
  "Linked Lists",
  "System Design Interview Framework",
  "Load Balancing",
  "Caching",
  "Database Design",
  "Microservices Architecture",
  "Sorting & Searching",
  "Stacks & Queues",
  "Hash Tables",
  "Heaps & Priority Queues",
  "Recursion & Backtracking",
  "API Gateway",
  "Database Scaling",
  "Message Queues",
  "Distributed Systems Fundamentals",
  "Scalability Patterns",
  "Design: URL Shortener (TinyURL)",
  "Design: Chat System (WhatsApp/Slack)",
  "Design: News Feed (Facebook/Twitter)",
  "JavaScript Fundamentals",
  "React",
  "SQL",
  "OOP & Design Patterns",
  "Operating Systems",
  "Networking",
  "Java Core",
  "DSA Coding Patterns",
];

/**
 * Get the top ~200 indexable questions from priority topics.
 * Picks 10-15 questions per topic, deduplicating slugs.
 */
export function getIndexableQuestions(): IndexableQuestion[] {
  const all = loadAllContentFromDisk();
  const questions: IndexableQuestion[] = [];
  const seenSlugs = new Set<string>();

  // Map topics by name for fast lookup
  const topicMap = new Map<string, ServerTopicContent>();
  for (const t of all) {
    topicMap.set(t.topic.toLowerCase().trim(), t);
  }

  // Process priority topics first
  for (const name of PRIORITY_TOPICS) {
    const t = topicMap.get(name.toLowerCase().trim());
    if (!t || !t.quizBank?.length) continue;

    // Pick up to 12 questions per topic, spread across difficulty levels
    const sorted = [...t.quizBank].sort((a, b) => a.difficulty - b.difficulty);
    const pick = Math.min(12, sorted.length);
    const step = Math.max(1, Math.floor(sorted.length / pick));

    for (let i = 0; i < sorted.length && questions.length < 220; i += step) {
      const q = sorted[i];
      let slug = questionSlug(q.question, t.topic);

      // Deduplicate
      if (seenSlugs.has(slug)) {
        slug = `${slug}-${i}`;
      }
      if (seenSlugs.has(slug)) continue;
      seenSlugs.add(slug);

      questions.push({
        slug,
        question: q.question,
        format: q.format,
        difficulty: q.difficulty,
        bloomLabel: q.bloomLabel,
        options: q.options,
        explanation: q.explanation,
        topicName: t.topic,
        topicSlug: slugify(t.topic),
        category: t.category,
      });
    }

    if (questions.length >= 200) break;
  }

  return questions.slice(0, 220);
}

/**
 * Find an indexable question by its slug.
 */
export function findQuestionBySlug(
  slug: string,
): IndexableQuestion | null {
  const questions = getIndexableQuestions();
  return questions.find((q) => q.slug === slug) ?? null;
}
