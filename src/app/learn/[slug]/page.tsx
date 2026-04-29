import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  loadAllContentFromDisk,
  findTopicBySlug,
  slugify,
  getRelatedTopics,
} from "@/lib/content/server-loader";

// ── Static generation ───────────────────────────────────────────────────────

export async function generateStaticParams() {
  const allTopics = loadAllContentFromDisk();
  return allTopics.map((t) => ({ slug: slugify(t.topic) }));
}

export const dynamicParams = false;

// ── Dynamic metadata ────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = findTopicBySlug(slug);
  if (!topic) return {};

  const title = `${topic.topic} - Interview Prep | Guru Sishya`;
  const description = truncateText(
    topic.plan?.overview ||
      `Learn ${topic.topic} for software engineering interviews. Covers key concepts, common questions, and best practices.`,
    160,
  );

  return {
    title,
    description,
    keywords: [
      `${topic.topic} interview questions`,
      `${topic.topic} tutorial`,
      `${topic.category} interview prep`,
      "software engineering interview",
      "coding interview preparation",
    ],
    alternates: {
      canonical: `https://www.guru-sishya.in/learn/${slug}`,
    },
    openGraph: {
      title: `${title} | Guru Sishya`,
      description,
      url: `https://www.guru-sishya.in/learn/${slug}`,
      type: "article",
      siteName: "Guru Sishya",
      images: [{ url: "https://www.guru-sishya.in/api/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Guru Sishya`,
      description,
      images: ["https://www.guru-sishya.in/api/og"],
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

/**
 * Strip markdown formatting for plain-text display.
 */
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`[^`]+`/g, "") // remove inline code
    .replace(/#{1,6}\s+/g, "") // remove headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/__([^_]+)__/g, "$1") // bold alt
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/_([^_]+)_/g, "$1") // italic alt
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "") // images
    .replace(/>\s?/g, "") // blockquotes
    .replace(/[-*+]\s+/g, "") // list markers
    .replace(/\d+\.\s+/g, "") // ordered lists
    .replace(/\|[^|]+\|/g, "") // tables
    .replace(/---+/g, "") // hr
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Truncate content to approximately N words, ending at a sentence boundary.
 */
function truncateToWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  const truncated = words.slice(0, maxWords).join(" ");
  // Try to end at a sentence boundary
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > truncated.length * 0.6) {
    return truncated.slice(0, lastPeriod + 1);
  }
  return truncated + "...";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function LearnTopicPage({ params }: PageProps) {
  const { slug } = await params;
  const topic = findTopicBySlug(slug);
  if (!topic) notFound();

  const sessions = topic.plan?.sessions ?? [];
  const overview = topic.plan?.overview ?? "";
  const firstSession = sessions[0];

  // Build content preview: overview + first session content
  let contentPreview = "";
  if (overview) {
    contentPreview += overview;
  }
  if (firstSession?.content) {
    contentPreview += "\n\n" + firstSession.content;
  }

  const plainContent = stripMarkdown(contentPreview);
  const truncatedContent = truncateToWords(plainContent, 500);
  const isTruncated = plainContent.length > truncatedContent.length;

  // Extract key concepts from session titles
  const keyConcepts = sessions.slice(0, 12).map((s) => s.title);

  // Quiz count
  const quizCount = topic.quizBank?.length ?? 0;

  // Related topics for internal linking
  const relatedTopics = getRelatedTopics(topic.topic, 3);

  // JSON-LD Course schema
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${topic.topic} - Interview Preparation`,
    description:
      overview ||
      `Comprehensive ${topic.topic} preparation for software engineering interviews.`,
    provider: {
      "@type": "Organization",
      name: "Guru Sishya",
      url: "https://www.guru-sishya.in",
    },
    isAccessibleForFree: true,
    numberOfCredits: sessions.length,
    educationalLevel: "Intermediate",
    about: {
      "@type": "Thing",
      name: topic.topic,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: `${sessions.length} lessons`,
    },
    inLanguage: "en",
    url: `https://www.guru-sishya.in/learn/${slug}`,
  };

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/learn"
              className="hover:text-foreground transition-colors"
            >
              Learn
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium truncate">
            {topic.topic}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded-full border border-saffron/30 text-saffron bg-saffron/10">
            {topic.category}
          </span>
          {sessions.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {sessions.length} lesson{sessions.length !== 1 ? "s" : ""}
            </span>
          )}
          {quizCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {quizCount} quiz question{quizCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
          {topic.topic}
        </h1>
        {overview && (
          <p className="text-lg text-muted-foreground leading-relaxed">
            {truncateText(overview, 300)}
          </p>
        )}
      </header>

      {/* Key concepts (session titles) */}
      {keyConcepts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-3">
            What You Will Learn
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {keyConcepts.map((concept, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="text-saffron mt-0.5 shrink-0">
                  &#10003;
                </span>
                <span>{concept}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Content preview */}
      <section className="mb-8">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-3">
          Overview
        </h2>
        <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
          {truncatedContent}
        </div>
        {isTruncated && (
          <div className="mt-6 p-6 rounded-xl border border-saffron/30 bg-saffron/5 text-center">
            <p className="text-foreground font-medium mb-3">
              Continue learning {topic.topic} with full lessons, quizzes, and
              interactive exercises.
            </p>
            <Link
              href={`/app/topic/${encodeURIComponent(topic.topic)}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
            >
              Continue Learning on Guru Sishya &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* Sample quiz questions */}
      {quizCount > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-3">
            Sample Quiz Questions
          </h2>
          <div className="space-y-3">
            {topic.quizBank.slice(0, 3).map((q, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border/30 bg-card/50"
              >
                <p className="text-sm text-foreground font-medium mb-1">
                  {idx + 1}. {q.question}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">{q.bloomLabel}</span>
                  <span>&middot;</span>
                  <span>Difficulty: {q.difficulty}/5</span>
                </div>
              </div>
            ))}
          </div>
          {quizCount > 3 && (
            <p className="text-sm text-muted-foreground mt-3">
              + {quizCount - 3} more questions available in the full app.
            </p>
          )}
        </section>
      )}

      {/* Related topics — internal linking */}
      {relatedTopics.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-3">
            Related Topics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedTopics.map((rt) => (
              <Link
                key={rt.slug}
                href={`/learn/${rt.slug}`}
                className="group block rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:bg-card/80 hover:border-saffron/30 hover:shadow-md"
              >
                <p className="font-semibold text-foreground group-hover:text-saffron transition-colors text-sm">
                  {rt.topic}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {rt.category}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA section */}
      <section className="py-8 border-t border-border/30">
        <div className="text-center">
          <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
            Master {topic.topic} for Your Next Interview
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Get access to full lessons, adaptive quizzes, cheat sheets, code
            playground, and progress tracking &mdash; completely free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/app/topic/${encodeURIComponent(topic.topic)}`}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
            >
              Start Learning {topic.topic} &rarr;
            </Link>
            <Link
              href="/learn"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
            >
              Browse All Topics
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: "https://www.guru-sishya.in",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Learn",
                item: "https://www.guru-sishya.in/learn",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: topic.topic,
                item: `https://www.guru-sishya.in/learn/${slug}`,
              },
            ],
          }),
        }}
      />
    </article>
  );
}
