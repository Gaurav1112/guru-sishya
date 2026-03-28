import type { Metadata } from "next";
import Link from "next/link";
import {
  loadAllContentFromDisk,
  slugify,
} from "@/lib/content/server-loader";

export const metadata: Metadata = {
  title: "Learn 138 Software Engineering Interview Topics | Guru Sishya",
  description:
    "Master software engineering interviews with free lessons on system design, data structures, algorithms, and core CS. 138 topics, 1933 questions, all free.",
  keywords: [
    "software engineering interview topics",
    "system design interview",
    "data structures and algorithms",
    "coding interview preparation",
    "FAANG interview topics",
    "java interview questions",
    "DSA interview preparation",
    "system design fundamentals",
  ],
  alternates: {
    canonical: "https://www.guru-sishya.in/learn",
  },
  openGraph: {
    title: "Learn 138 Software Engineering Interview Topics | Guru Sishya",
    description:
      "Master software engineering interviews with free lessons on system design, data structures, algorithms, and core CS.",
    url: "https://www.guru-sishya.in/learn",
    type: "website",
  },
};

// ── Category display config ─────────────────────────────────────────────────

const CATEGORY_DISPLAY: Record<
  string,
  { label: string; color: string; border: string }
> = {
  "System Design": {
    label: "System Design",
    color: "text-saffron",
    border: "border-saffron/30 hover:border-saffron/60",
  },
  "System Design Cases": {
    label: "System Design Cases",
    color: "text-teal",
    border: "border-teal/30 hover:border-teal/60",
  },
  "Data Structures": {
    label: "Data Structures & Algorithms",
    color: "text-indigo-400",
    border: "border-indigo-400/30 hover:border-indigo-400/60",
  },
  Algorithms: {
    label: "Data Structures & Algorithms",
    color: "text-indigo-400",
    border: "border-indigo-400/30 hover:border-indigo-400/60",
  },
  "Programming Languages": {
    label: "Languages & Frameworks",
    color: "text-gold",
    border: "border-gold/30 hover:border-gold/60",
  },
  Frontend: {
    label: "Languages & Frameworks",
    color: "text-gold",
    border: "border-gold/30 hover:border-gold/60",
  },
  Backend: {
    label: "Languages & Frameworks",
    color: "text-gold",
    border: "border-gold/30 hover:border-gold/60",
  },
  Databases: {
    label: "Databases",
    color: "text-emerald-400",
    border: "border-emerald-400/30 hover:border-emerald-400/60",
  },
  "Software Engineering": {
    label: "Software Engineering",
    color: "text-purple-400",
    border: "border-purple-400/30 hover:border-purple-400/60",
  },
  "Computer Science Fundamentals": {
    label: "Core CS",
    color: "text-sky-400",
    border: "border-sky-400/30 hover:border-sky-400/60",
  },
  "Distributed Systems": {
    label: "DevOps & Infrastructure",
    color: "text-orange-400",
    border: "border-orange-400/30 hover:border-orange-400/60",
  },
  "Cloud Computing": {
    label: "DevOps & Infrastructure",
    color: "text-orange-400",
    border: "border-orange-400/30 hover:border-orange-400/60",
  },
  "DevOps & Containers": {
    label: "DevOps & Infrastructure",
    color: "text-orange-400",
    border: "border-orange-400/30 hover:border-orange-400/60",
  },
};

function getCategoryStyle(category: string) {
  return (
    CATEGORY_DISPLAY[category] ?? {
      label: category,
      color: "text-muted-foreground",
      border: "border-border/30 hover:border-border/60",
    }
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LearnIndexPage() {
  const allTopics = loadAllContentFromDisk();

  // Group topics by normalized category label
  const grouped = new Map<
    string,
    Array<{
      topic: string;
      slug: string;
      category: string;
      sessionCount: number;
      quizCount: number;
    }>
  >();

  for (const t of allTopics) {
    const style = getCategoryStyle(t.category);
    const label = style.label;
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label)!.push({
      topic: t.topic,
      slug: slugify(t.topic),
      category: t.category,
      sessionCount: t.plan?.sessions?.length ?? 0,
      quizCount: t.quizBank?.length ?? 0,
    });
  }

  const categories = Array.from(grouped.entries());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
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
          <li className="text-foreground font-medium">Learn</li>
        </ol>
      </nav>

      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
          Learn Software Engineering Interview Topics
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          138 topics covering system design, data structures, algorithms, and
          core CS. Each topic includes lessons, quizzes, cheat sheets, and
          curated resources &mdash; all free.
        </p>
        <Link
          href="/app/topics"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
        >
          Start Learning Free &rarr;
        </Link>
      </div>

      {/* Category sections */}
      {categories.map(([label, topics]) => {
        const style = getCategoryStyle(topics[0].category);
        return (
          <section key={label} className="mb-12">
            <h2
              className={`text-xl sm:text-2xl font-heading font-semibold mb-4 ${style.color}`}
            >
              {label}
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({topics.length} topic{topics.length !== 1 ? "s" : ""})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/learn/${t.slug}`}
                  className={`group block rounded-xl border ${style.border} bg-card/50 p-5 transition-all hover:bg-card/80 hover:shadow-md`}
                >
                  <h3 className="font-semibold text-foreground group-hover:text-saffron transition-colors mb-2">
                    {t.topic}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {t.sessionCount > 0 && (
                      <span>{t.sessionCount} lessons</span>
                    )}
                    {t.quizCount > 0 && (
                      <span>{t.quizCount} quiz questions</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Bottom CTA */}
      <div className="text-center py-12 border-t border-border/30">
        <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
          Ready to ace your next interview?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Get quizzes, flashcards, code playground, progress tracking, and more
          &mdash; all free, no signup required.
        </p>
        <Link
          href="/app/topics"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
        >
          Start Learning Free &rarr;
        </Link>
      </div>

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
                name: "Home",
                item: "https://www.guru-sishya.in",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Learn",
                item: "https://www.guru-sishya.in/learn",
              },
            ],
          }),
        }}
      />

      {/* JSON-LD: ItemList for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Software Engineering Interview Topics",
            description:
              "138 topics for software engineering interview preparation",
            numberOfItems: allTopics.length,
            itemListElement: allTopics.slice(0, 50).map((t, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: t.topic,
              url: `https://www.guru-sishya.in/learn/${slugify(t.topic)}`,
            })),
          }),
        }}
      />
    </div>
  );
}
