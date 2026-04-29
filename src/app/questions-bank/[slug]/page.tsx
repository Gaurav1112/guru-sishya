import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getIndexableQuestions,
  findQuestionBySlug,
} from "@/lib/content/server-loader";

// ── Static generation ───────────────────────────────────────────────────────

export async function generateStaticParams() {
  const questions = getIndexableQuestions();
  return questions.map((q) => ({ slug: q.slug }));
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
  const q = findQuestionBySlug(slug);
  if (!q) return {};

  const title = truncate(q.question, 60);
  const description = `${q.topicName} interview question (${difficultyLabel(q.difficulty)}). ${truncate(q.question, 120)} Practice with Guru Sishya.`;

  return {
    title,
    description,
    keywords: [
      `${q.topicName} interview question`,
      `${q.question.split(" ").slice(0, 5).join(" ")} interview`,
      `${q.category} interview questions`,
      "software engineering interview",
      "coding interview preparation",
    ],
    alternates: {
      canonical: `https://www.guru-sishya.in/questions-bank/${slug}`,
    },
    openGraph: {
      title: `${title} | Interview Question`,
      description,
      url: `https://www.guru-sishya.in/questions-bank/${slug}`,
      type: "article",
      siteName: "Guru Sishya",
      images: [{ url: "https://www.guru-sishya.in/api/og", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Interview Question`,
      description,
      images: ["https://www.guru-sishya.in/api/og"],
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function difficultyLabel(d: number): string {
  if (d <= 1) return "Easy";
  if (d <= 2) return "Medium-Easy";
  if (d <= 3) return "Medium";
  if (d <= 4) return "Medium-Hard";
  return "Hard";
}

function difficultyColor(d: number): string {
  if (d <= 1) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (d <= 2) return "text-teal bg-teal/10 border-teal/30";
  if (d <= 3) return "text-gold bg-gold/10 border-gold/30";
  if (d <= 4) return "text-saffron bg-saffron/10 border-saffron/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
}

function bloomDescription(bloom: string): string {
  const map: Record<string, string> = {
    Remember: "Tests recall of fundamental facts and definitions.",
    Understand: "Tests comprehension and ability to explain concepts.",
    Apply: "Tests ability to use knowledge in practical scenarios.",
    Analyze: "Tests ability to break down and examine complex problems.",
    Evaluate: "Tests ability to make judgments and justify decisions.",
    Create: "Tests ability to design and build novel solutions.",
  };
  return map[bloom] ?? "Tests your understanding of this concept.";
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function QuestionPage({ params }: PageProps) {
  const { slug } = await params;
  const q = findQuestionBySlug(slug);
  if (!q) notFound();

  const baseUrl = "https://www.guru-sishya.in";

  // Get sibling questions from same topic for "More questions" section
  const allQuestions = getIndexableQuestions();
  const siblings = allQuestions
    .filter((s) => s.topicName === q.topicName && s.slug !== q.slug)
    .slice(0, 5);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <li>
            <Link
              href="/questions-bank"
              className="hover:text-foreground transition-colors"
            >
              Questions Bank
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/learn/${q.topicSlug}`}
              className="hover:text-foreground transition-colors"
            >
              {q.topicName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium truncate max-w-[200px]">
            Question
          </li>
        </ol>
      </nav>

      {/* Question header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${difficultyColor(q.difficulty)}`}
          >
            {difficultyLabel(q.difficulty)}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground bg-card/50 capitalize">
            {q.bloomLabel}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-saffron/30 text-saffron bg-saffron/10">
            {q.topicName}
          </span>
          <span className="text-xs text-muted-foreground">
            {q.format === "mcq" ? "Multiple Choice" : q.format}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground leading-snug">
          {q.question}
        </h1>
      </header>

      {/* Bloom taxonomy info */}
      <section className="mb-8 p-4 rounded-lg border border-border/30 bg-card/30">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground capitalize">
            {q.bloomLabel}
          </span>{" "}
          &mdash; {bloomDescription(q.bloomLabel)}
        </p>
      </section>

      {/* Answer options (shown but correct answer hidden) */}
      {q.options && q.options.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
            Answer Options
          </h2>
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/50"
              >
                <span className="shrink-0 size-7 rounded-full border border-border/50 flex items-center justify-center text-xs font-medium text-muted-foreground">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm text-foreground pt-0.5">
                  {opt.replace(/^[A-Z]\)\s*/, "")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA: See the answer */}
      <section className="mb-10 p-6 rounded-xl border-2 border-saffron/40 bg-gradient-to-br from-saffron/5 to-gold/5 text-center">
        <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
          Want to see the correct answer?
        </h2>
        <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
          Get the answer with a detailed explanation, plus practice{" "}
          {allQuestions.filter((s) => s.topicName === q.topicName).length}+
          more {q.topicName} questions with adaptive quizzes and timed
          interviews.
        </p>
        <Link
          href={`/app/topic/${encodeURIComponent(q.topicName)}/quiz`}
          className="inline-flex items-center justify-center rounded-md text-sm font-semibold h-11 px-8 bg-saffron hover:bg-saffron/90 text-white transition-colors shadow-lg shadow-saffron/20"
        >
          See the Answer on Guru Sishya &rarr;
        </Link>
      </section>

      {/* Topic link */}
      <section className="mb-8 p-4 rounded-lg border border-border/30 bg-card/30">
        <p className="text-sm text-muted-foreground mb-2">
          This question is from the{" "}
          <span className="font-medium text-foreground">{q.topicName}</span>{" "}
          topic ({q.category}).
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/learn/${q.topicSlug}`}
            className="text-sm text-saffron hover:text-saffron/80 transition-colors"
          >
            Learn {q.topicName} &rarr;
          </Link>
          <Link
            href="/questions-bank"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse All Questions
          </Link>
        </div>
      </section>

      {/* More questions from same topic */}
      {siblings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4">
            More {q.topicName} Questions
          </h2>
          <div className="space-y-2">
            {siblings.map((s) => (
              <Link
                key={s.slug}
                href={`/questions-bank/${s.slug}`}
                className="group block p-3 rounded-lg border border-border/30 hover:border-saffron/40 bg-card/50 transition-all hover:bg-card/80"
              >
                <p className="text-sm text-foreground group-hover:text-saffron transition-colors line-clamp-2">
                  {s.question}
                </p>
                <span
                  className={`text-xs mt-1 inline-block ${difficultyColor(s.difficulty).split(" ")[0]}`}
                >
                  {difficultyLabel(s.difficulty)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD: Question schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Question",
            name: q.question,
            text: q.question,
            answerCount: q.options?.length ?? 0,
            dateCreated: "2026-03-01",
            author: {
              "@type": "Organization",
              name: "Guru Sishya",
              url: baseUrl,
            },
            about: {
              "@type": "Thing",
              name: q.topicName,
            },
            educationalLevel: difficultyLabel(q.difficulty),
            suggestedAnswer: q.options?.map((opt) => ({
              "@type": "Answer",
              text: opt.replace(/^[A-Z]\)\s*/, ""),
            })),
            acceptedAnswer: {
              "@type": "Answer",
              text: "Sign in to Guru Sishya to see the correct answer with detailed explanation.",
              url: `${baseUrl}/app/topic/${encodeURIComponent(q.topicName)}/quiz`,
            },
          }),
        }}
      />

      {/* JSON-LD: BreadcrumbList */}
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
                name: "Questions Bank",
                item: `${baseUrl}/questions-bank`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: q.topicName,
                item: `${baseUrl}/learn/${q.topicSlug}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: truncate(q.question, 50),
                item: `${baseUrl}/questions-bank/${slug}`,
              },
            ],
          }),
        }}
      />
    </article>
  );
}
