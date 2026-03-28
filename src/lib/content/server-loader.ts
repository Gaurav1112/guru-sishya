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
