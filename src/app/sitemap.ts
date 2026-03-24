import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

// ── Topic content types (minimal, just what we need for sitemap) ──────────
interface TopicEntry {
  topic?: string;
  name?: string;
  category?: string;
}

// ── Content files that contain topic data ─────────────────────────────────
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
];

/**
 * Read all topic names from the pre-generated JSON content files at build time.
 * This runs server-side so we can use fs directly.
 */
function getAllTopicNames(): string[] {
  const contentDir = path.join(process.cwd(), "public", "content");
  const topics: string[] = [];

  for (const file of CONTENT_FILES) {
    try {
      const filePath = path.join(contentDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as TopicEntry | TopicEntry[];
      const items: TopicEntry[] = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const topicName = item.topic || item.name;
        if (topicName) topics.push(topicName);
      }
    } catch {
      // File may not exist — skip
      continue;
    }
  }

  return topics;
}

/**
 * Convert a topic name to a URL-safe slug.
 * e.g. "Arrays & Strings" -> "arrays-strings"
 *      "Design: URL Shortener (TinyURL)" -> "design-url-shortener-tinyurl"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.guru-sishya.in";
  const now = new Date();
  const topicNames = getAllTopicNames();

  // ── Static pages ────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/app/topics`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/app/questions`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/app/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/app/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/app/interview`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/app/roadmap`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/app/playground`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/app/review`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/app/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${baseUrl}/app/shop`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/app/profile`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  // ── Dynamic topic pages ─────────────────────────────────────────────────
  // These are SEO-friendly slug URLs that map to /app/topics#<slug>.
  // Even though topic detail pages use dynamic IndexedDB IDs internally,
  // we list them here so search engines discover the topic names.
  const topicPages: MetadataRoute.Sitemap = topicNames.map((name) => ({
    url: `${baseUrl}/app/topics#${slugify(name)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...topicPages];
}
