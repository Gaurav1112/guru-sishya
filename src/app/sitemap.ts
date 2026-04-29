import * as fs from "node:fs";
import * as path from "node:path";
import type { MetadataRoute } from "next";
import { getIndexableQuestions } from "@/lib/content/server-loader";

// ── Content files that contain topic data (mirrors loader.ts CONTENT_FILES) ──
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

interface ContentItem {
  topic?: string;
  name?: string;
  category?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Read all content JSON files from disk and extract unique topic names.
 * Runs at build time (server-side only).
 */
function getAllTopicNames(): string[] {
  const contentDir = path.join(process.cwd(), "public", "content");
  const seen = new Set<string>();
  const topics: string[] = [];

  for (const file of CONTENT_FILES) {
    try {
      const filePath = path.join(contentDir, file);
      if (!fs.existsSync(filePath)) continue;
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as
        | ContentItem
        | ContentItem[];
      const items: ContentItem[] = Array.isArray(raw) ? raw : [raw];

      for (const item of items) {
        const topicName = item.topic || item.name;
        if (!topicName) continue;
        const key = topicName.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          topics.push(topicName);
        }
      }
    } catch {
      // Skip files that fail to parse
    }
  }

  return topics;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.guru-sishya.in";
  const now = new Date();

  // ── Static pages ────────────────────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dsa-interview-questions`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/system-design-interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/behavioral-interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/top-coding-questions`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leetcode-alternative`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cloud-devops-interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/database-interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/backend-interview`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // ── App pages (crawlable, valuable for SEO) ────────────────────────────
  const appPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/app/topics`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/app/dashboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/app/questions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/app/interview`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/app/review`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/app/playground`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/app/leaderboard`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/app/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/app/roadmap`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // ── Learn pages (public, SEO-friendly) ────────────────────────────────
  const topicNames = getAllTopicNames();

  const learnEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...topicNames.map((name) => ({
      url: `${baseUrl}/learn/${slugify(name)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  // ── Topic pages (one entry per topic, linked via search param) ────────
  const topicEntries: MetadataRoute.Sitemap = topicNames.map((name) => ({
    url: `${baseUrl}/app/topics?search=${encodeURIComponent(name)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── Questions Bank pages ──────────────────────────────────────────────
  const questions = getIndexableQuestions();
  const questionEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/questions-bank`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...questions.map((q) => ({
      url: `${baseUrl}/questions-bank/${q.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  return [
    ...staticEntries,
    ...learnEntries,
    ...appPages,
    ...topicEntries,
    ...questionEntries,
  ];
}
