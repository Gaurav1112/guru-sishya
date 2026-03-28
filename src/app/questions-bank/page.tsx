import type { Metadata } from "next";
import Link from "next/link";
import {
  getIndexableQuestions,
  slugify,
} from "@/lib/content/server-loader";

export const metadata: Metadata = {
  title:
    "Software Engineering Interview Questions Bank | Guru Sishya",
  description:
    "200+ curated software engineering interview questions on system design, data structures, algorithms, and core CS. Practice with detailed explanations.",
  keywords: [
    "software engineering interview questions",
    "system design interview questions",
    "data structures interview questions",
    "coding interview questions",
    "FAANG interview questions",
    "DSA interview questions",
    "java interview questions",
    "software developer interview prep",
  ],
  alternates: {
    canonical: "https://www.guru-sishya.in/questions-bank",
  },
  openGraph: {
    title:
      "Software Engineering Interview Questions Bank | Guru Sishya",
    description:
      "200+ curated software engineering interview questions with detailed explanations. System design, DSA, and core CS.",
    url: "https://www.guru-sishya.in/questions-bank",
    type: "website",
  },
};

// ── Difficulty labels ────────────────────────────────────────────────────────

function difficultyLabel(d: number): string {
  if (d <= 1) return "Easy";
  if (d <= 2) return "Medium-Easy";
  if (d <= 3) return "Medium";
  if (d <= 4) return "Medium-Hard";
  return "Hard";
}

function difficultyColor(d: number): string {
  if (d <= 1) return "text-emerald-400";
  if (d <= 2) return "text-teal";
  if (d <= 3) return "text-gold";
  if (d <= 4) return "text-saffron";
  return "text-red-400";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function QuestionsBankPage() {
  const questions = getIndexableQuestions();

  // Group by topic
  const grouped = new Map<
    string,
    {
      topicName: string;
      topicSlug: string;
      category: string;
      questions: typeof questions;
    }
  >();

  for (const q of questions) {
    if (!grouped.has(q.topicName)) {
      grouped.set(q.topicName, {
        topicName: q.topicName,
        topicSlug: q.topicSlug,
        category: q.category,
        questions: [],
      });
    }
    grouped.get(q.topicName)!.questions.push(q);
  }

  const groups = Array.from(grouped.values());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
          Software Engineering Interview Questions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
          {questions.length}+ curated interview questions covering system
          design, data structures &amp; algorithms, and core computer
          science. Each question includes difficulty level, Bloom taxonomy
          level, and answer options.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Grouped by {groups.length} high-demand topics
        </p>
        <Link
          href="/app/topics"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
        >
          Practice All Questions Free &rarr;
        </Link>
      </div>

      {/* Topic groups */}
      {groups.map((group) => (
        <section key={group.topicName} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground">
              {group.topicName}
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-saffron/30 text-saffron bg-saffron/10">
              {group.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {group.questions.length} question
              {group.questions.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {group.questions.map((q) => (
              <Link
                key={q.slug}
                href={`/questions-bank/${q.slug}`}
                className="group block rounded-xl border border-border/30 hover:border-saffron/40 bg-card/50 p-4 transition-all hover:bg-card/80 hover:shadow-md"
              >
                <p className="text-sm font-medium text-foreground group-hover:text-saffron transition-colors mb-2 line-clamp-2">
                  {q.question}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className={difficultyColor(q.difficulty)}>
                    {difficultyLabel(q.difficulty)}
                  </span>
                  <span>&middot;</span>
                  <span className="capitalize">{q.bloomLabel}</span>
                  <span>&middot;</span>
                  <span>{q.format === "mcq" ? "Multiple Choice" : q.format}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Link to learn page for this topic */}
          <div className="mt-3">
            <Link
              href={`/learn/${group.topicSlug}`}
              className="text-sm text-saffron hover:text-saffron/80 transition-colors"
            >
              Learn {group.topicName} &rarr;
            </Link>
          </div>
        </section>
      ))}

      {/* Bottom CTA */}
      <div className="text-center py-12 border-t border-border/30">
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
          Ready to ace your next interview?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Practice with adaptive quizzes, timed interviews, code playground,
          and detailed explanations &mdash; all free, no signup required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/app/topics"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
          >
            Start Practicing Free &rarr;
          </Link>
          <Link
            href="/learn"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            Browse All Topics
          </Link>
        </div>
      </div>

      {/* JSON-LD: ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Software Engineering Interview Questions",
            description: `${questions.length}+ curated interview questions for software engineers`,
            numberOfItems: questions.length,
            itemListElement: questions.slice(0, 100).map((q, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: q.question,
              url: `https://www.guru-sishya.in/questions-bank/${q.slug}`,
            })),
          }),
        }}
      />
    </div>
  );
}
