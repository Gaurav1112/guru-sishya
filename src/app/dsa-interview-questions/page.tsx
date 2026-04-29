import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  loadAllContentFromDisk,
  slugify,
} from "@/lib/content/server-loader";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Top 50 DSA Interview Questions (2026) - Data Structures & Algorithms | Guru Sishya",
  description:
    "Curated list of the 50 most-asked data structures and algorithms interview questions for software engineers. Organized by topic with difficulty levels, company tags, and free practice materials.",
  keywords: [
    "DSA interview questions",
    "data structures interview questions",
    "algorithm interview questions",
    "coding interview DSA",
    "arrays interview questions",
    "trees interview questions",
    "dynamic programming questions",
    "graph interview questions",
    "FAANG DSA questions",
    "data structures and algorithms",
  ],
  alternates: { canonical: `${BASE}/dsa-interview-questions` },
  openGraph: {
    title: "Top 50 DSA Interview Questions (2026) | Guru Sishya",
    description:
      "Master 50 essential data structures and algorithms questions asked at Google, Amazon, Meta, and more. Free lessons, quizzes, and code playground.",
    url: `${BASE}/dsa-interview-questions`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top 50 DSA Interview Questions (2026) | Guru Sishya",
    description:
      "Master 50 essential DSA questions asked at Google, Amazon, Meta. Free lessons, quizzes, and code playground.",
    images: [`${BASE}/api/og`],
  },
};

// ── Curated DSA question list ───────────────────────────────────────────────

interface DSAQuestion {
  id: number;
  question: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  learnTopic?: string;
}

const DSA_QUESTIONS: DSAQuestion[] = [
  // Arrays & Strings
  { id: 1, question: "Two Sum", topic: "Arrays", difficulty: "Easy", companies: ["Google", "Amazon", "Meta"], learnTopic: "Arrays" },
  { id: 2, question: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: "Easy", companies: ["Amazon", "Meta", "Goldman Sachs"], learnTopic: "Arrays" },
  { id: 3, question: "Contains Duplicate", topic: "Arrays", difficulty: "Easy", companies: ["Google", "Apple", "Microsoft"], learnTopic: "Arrays" },
  { id: 4, question: "Product of Array Except Self", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Meta", "Apple"], learnTopic: "Arrays" },
  { id: 5, question: "Maximum Subarray (Kadane's Algorithm)", topic: "Arrays", difficulty: "Medium", companies: ["Google", "Microsoft", "Amazon"], learnTopic: "Arrays" },
  { id: 6, question: "Container With Most Water", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Arrays" },
  { id: 7, question: "3Sum", topic: "Arrays", difficulty: "Medium", companies: ["Meta", "Google", "Microsoft"], learnTopic: "Arrays" },
  { id: 8, question: "Merge Intervals", topic: "Arrays", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Arrays" },

  // Linked Lists
  { id: 9, question: "Reverse Linked List", topic: "Linked Lists", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Apple"], learnTopic: "Linked Lists" },
  { id: 10, question: "Merge Two Sorted Lists", topic: "Linked Lists", difficulty: "Easy", companies: ["Amazon", "Google", "Meta"], learnTopic: "Linked Lists" },
  { id: 11, question: "Linked List Cycle Detection", topic: "Linked Lists", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Google"], learnTopic: "Linked Lists" },
  { id: 12, question: "Remove Nth Node From End of List", topic: "Linked Lists", difficulty: "Medium", companies: ["Meta", "Amazon", "Apple"], learnTopic: "Linked Lists" },

  // Stacks & Queues
  { id: 13, question: "Valid Parentheses", topic: "Stacks & Queues", difficulty: "Easy", companies: ["Amazon", "Meta", "Google"], learnTopic: "Stacks" },
  { id: 14, question: "Min Stack", topic: "Stacks & Queues", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Stacks" },
  { id: 15, question: "Implement Queue Using Stacks", topic: "Stacks & Queues", difficulty: "Easy", companies: ["Microsoft", "Amazon", "Apple"], learnTopic: "Queues" },

  // Trees
  { id: 16, question: "Maximum Depth of Binary Tree", topic: "Trees", difficulty: "Easy", companies: ["Google", "Amazon", "Meta"], learnTopic: "Binary Trees" },
  { id: 17, question: "Validate Binary Search Tree", topic: "Trees", difficulty: "Medium", companies: ["Amazon", "Meta", "Microsoft"], learnTopic: "Binary Search Trees" },
  { id: 18, question: "Level Order Traversal", topic: "Trees", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Binary Trees" },
  { id: 19, question: "Lowest Common Ancestor of BST", topic: "Trees", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Binary Search Trees" },
  { id: 20, question: "Serialize and Deserialize Binary Tree", topic: "Trees", difficulty: "Hard", companies: ["Amazon", "Google", "Meta"], learnTopic: "Binary Trees" },
  { id: 21, question: "Invert Binary Tree", topic: "Trees", difficulty: "Easy", companies: ["Google", "Amazon", "Apple"], learnTopic: "Binary Trees" },
  { id: 22, question: "Diameter of Binary Tree", topic: "Trees", difficulty: "Easy", companies: ["Meta", "Amazon", "Google"], learnTopic: "Binary Trees" },

  // Graphs
  { id: 23, question: "Number of Islands", topic: "Graphs", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Graphs" },
  { id: 24, question: "Clone Graph", topic: "Graphs", difficulty: "Medium", companies: ["Meta", "Google", "Microsoft"], learnTopic: "Graphs" },
  { id: 25, question: "Course Schedule (Topological Sort)", topic: "Graphs", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Graphs" },
  { id: 26, question: "Word Ladder", topic: "Graphs", difficulty: "Hard", companies: ["Amazon", "Google", "Meta"], learnTopic: "Graphs" },
  { id: 27, question: "Pacific Atlantic Water Flow", topic: "Graphs", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Graphs" },

  // Dynamic Programming
  { id: 28, question: "Climbing Stairs", topic: "Dynamic Programming", difficulty: "Easy", companies: ["Amazon", "Google", "Apple"], learnTopic: "Dynamic Programming" },
  { id: 29, question: "Longest Increasing Subsequence", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 30, question: "Coin Change", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Dynamic Programming" },
  { id: 31, question: "House Robber", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Apple"], learnTopic: "Dynamic Programming" },
  { id: 32, question: "0/1 Knapsack", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Dynamic Programming" },
  { id: 33, question: "Longest Common Subsequence", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 34, question: "Edit Distance", topic: "Dynamic Programming", difficulty: "Hard", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 35, question: "Word Break", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Dynamic Programming" },

  // Heaps & Priority Queues
  { id: 36, question: "Kth Largest Element in an Array", topic: "Heaps", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Heaps" },
  { id: 37, question: "Top K Frequent Elements", topic: "Heaps", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Heaps" },
  { id: 38, question: "Merge K Sorted Lists", topic: "Heaps", difficulty: "Hard", companies: ["Amazon", "Google", "Meta"], learnTopic: "Heaps" },
  { id: 39, question: "Find Median from Data Stream", topic: "Heaps", difficulty: "Hard", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Heaps" },

  // Binary Search
  { id: 40, question: "Binary Search", topic: "Binary Search", difficulty: "Easy", companies: ["Google", "Amazon", "Apple"], learnTopic: "Searching Algorithms" },
  { id: 41, question: "Search in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Searching Algorithms" },
  { id: 42, question: "Find Minimum in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Searching Algorithms" },

  // Tries
  { id: 43, question: "Implement Trie (Prefix Tree)", topic: "Tries", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Tries" },
  { id: 44, question: "Word Search II", topic: "Tries", difficulty: "Hard", companies: ["Amazon", "Google", "Meta"], learnTopic: "Tries" },

  // Backtracking
  { id: 45, question: "Permutations", topic: "Backtracking", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Recursion and Backtracking" },
  { id: 46, question: "Subsets", topic: "Backtracking", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Recursion and Backtracking" },
  { id: 47, question: "N-Queens", topic: "Backtracking", difficulty: "Hard", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Recursion and Backtracking" },

  // Sliding Window
  { id: 48, question: "Longest Substring Without Repeating Characters", topic: "Sliding Window", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Sliding Window" },
  { id: 49, question: "Minimum Window Substring", topic: "Sliding Window", difficulty: "Hard", companies: ["Meta", "Google", "Amazon"], learnTopic: "Sliding Window" },

  // Sorting
  { id: 50, question: "Meeting Rooms II", topic: "Sorting & Greedy", difficulty: "Medium", companies: ["Google", "Meta", "Amazon"], learnTopic: "Sorting Algorithms" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-teal bg-teal/10 border-teal/30",
  Medium: "text-gold bg-gold/10 border-gold/30",
  Hard: "text-destructive bg-destructive/10 border-destructive/30",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DSAInterviewQuestionsPage() {
  const allTopics = loadAllContentFromDisk();
  const topicSlugs = new Map(
    allTopics.map((t) => [t.topic.toLowerCase(), slugify(t.topic)]),
  );

  // Group questions by topic
  const grouped = new Map<string, DSAQuestion[]>();
  for (const q of DSA_QUESTIONS) {
    if (!grouped.has(q.topic)) grouped.set(q.topic, []);
    grouped.get(q.topic)!.push(q);
  }

  const topicOrder = Array.from(grouped.keys());

  function findSlug(learnTopic?: string): string | null {
    if (!learnTopic) return null;
    const key = learnTopic.toLowerCase();
    return topicSlugs.get(key) ?? null;
  }

  // JSON-LD ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top 50 DSA Interview Questions (2026)",
    description:
      "Curated list of the 50 most-asked data structures and algorithms interview questions for software engineers.",
    numberOfItems: DSA_QUESTIONS.length,
    itemListElement: DSA_QUESTIONS.slice(0, 20).map((q, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: q.question,
      url: findSlug(q.learnTopic)
        ? `${BASE}/learn/${findSlug(q.learnTopic)}`
        : `${BASE}/dsa-interview-questions`,
    })),
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNavbar />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">DSA Interview Questions</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Top 50 DSA Interview Questions for 2026
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Data structures and algorithms form the backbone of every technical interview at top tech companies.
              Whether you are preparing for Google, Amazon, Meta, Microsoft, or any other FAANG company, mastering
              these 50 questions will put you ahead of 90% of candidates. This curated list covers arrays, linked lists,
              trees, graphs, dynamic programming, and more &mdash; organized by topic with difficulty levels and
              company frequency tags.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice These Questions Free &rarr;
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Browse All 81 Topics
              </Link>
            </div>
          </header>

          {/* Quick stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-saffron">50</div>
              <div className="text-xs text-muted-foreground mt-1">Essential Questions</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-teal">12</div>
              <div className="text-xs text-muted-foreground mt-1">DSA Topics</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-gold">6+</div>
              <div className="text-xs text-muted-foreground mt-1">Companies Covered</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-indigo-400">Free</div>
              <div className="text-xs text-muted-foreground mt-1">Full Practice Access</div>
            </div>
          </section>

          {/* Why DSA matters */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Why DSA Matters in Technical Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Data structures and algorithms (DSA) are the most heavily tested topics in software engineering
                interviews. Companies like Google, Amazon, and Meta use DSA problems to assess your problem-solving
                ability, code quality, and understanding of time and space complexity. Unlike system design or
                behavioral rounds, DSA rounds are pass-or-fail: you either solve the problem or you do not.
              </p>
              <p>
                The good news is that DSA interviews follow predictable patterns. Over 80% of interview questions
                are variations of well-known problems. If you master the core patterns &mdash; two pointers, sliding
                window, BFS/DFS, dynamic programming, and binary search &mdash; you can solve most interview
                questions in under 30 minutes.
              </p>
              <p>
                This list is organized by data structure and algorithm pattern. For each question, we provide the
                difficulty level, the companies that most frequently ask it, and a direct link to our free learning
                material. We recommend working through each section in order: start with arrays and strings, then
                move to linked lists, trees, graphs, and finally dynamic programming.
              </p>
            </div>
          </section>

          {/* Table of contents */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Jump to Topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {topicOrder.map((topic) => (
                <a
                  key={topic}
                  href={`#${topic.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-muted-foreground hover:text-saffron transition-colors"
                >
                  {topic} ({grouped.get(topic)!.length})
                </a>
              ))}
            </div>
          </section>

          {/* Questions by topic */}
          {topicOrder.map((topic) => {
            const questions = grouped.get(topic)!;
            const topicSlug = topic.toLowerCase().replace(/\s+/g, "-");
            return (
              <section key={topic} id={topicSlug} className="mb-10">
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4">
                  {topic} Questions
                </h2>
                <div className="space-y-3">
                  {questions.map((q) => {
                    const slug = findSlug(q.learnTopic);
                    return (
                      <div
                        key={q.id}
                        className="p-4 rounded-lg border border-border/30 bg-card/50 flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-mono">
                              #{q.id}
                            </span>
                            <h3 className="text-sm font-semibold text-foreground">
                              {q.question}
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}
                            >
                              {q.difficulty}
                            </span>
                            {q.companies.map((c) => (
                              <span
                                key={c}
                                className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                        {slug && (
                          <Link
                            href={`/learn/${slug}`}
                            className="text-xs text-saffron hover:text-saffron/80 transition-colors shrink-0"
                          >
                            Study Topic &rarr;
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* How to prepare section */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              How to Prepare for DSA Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Step 1: Learn the Fundamentals
              </h3>
              <p>
                Before diving into problem-solving, make sure you have a solid understanding of core data structures:
                arrays, linked lists, stacks, queues, hash maps, trees, graphs, heaps, and tries. For each data
                structure, understand the time complexity of basic operations (insert, delete, search, traverse).
                Our free lessons on Guru Sishya cover each data structure with visual explanations, code examples
                in Java and Python, and practice quizzes.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Step 2: Master Algorithm Patterns
              </h3>
              <p>
                Most DSA interview questions can be mapped to one of 15 common patterns: two pointers, sliding window,
                fast and slow pointers, merge intervals, cyclic sort, in-place reversal of linked list, BFS, DFS,
                two heaps, subsets, modified binary search, bitwise XOR, top K elements, K-way merge, and topological
                sort. Learning to recognize these patterns is more valuable than memorizing individual solutions.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Step 3: Practice with a System
              </h3>
              <p>
                Random practice is inefficient. Follow the structure in this list: start with Easy problems in each
                category, then move to Medium, and finally Hard. Aim to solve 2-3 problems per day. For each problem,
                spend 20 minutes attempting it before looking at hints. After solving, write out the time and space
                complexity and explain your approach out loud (the Feynman technique). Guru Sishya includes a built-in
                Feynman practice mode for every topic.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Step 4: Simulate Real Interviews
              </h3>
              <p>
                Once you are comfortable solving Medium problems in 20-25 minutes, start timed practice. Use
                Guru Sishya&apos;s interview mode which simulates real interview conditions with a timer, progressive
                difficulty (Easy, Medium, Hard), and immediate feedback on your solutions. Focus on thinking out loud,
                asking clarifying questions, and discussing trade-offs &mdash; these soft skills matter as much as
                getting the right answer.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Step 5: Review and Iterate
              </h3>
              <p>
                Track which problems and patterns give you trouble. Guru Sishya&apos;s spaced repetition system
                automatically creates flashcards for problems you get wrong and schedules reviews at optimal intervals.
                Focus 70% of your time on weak areas and 30% on maintaining strong areas. Most successful candidates
                report that 4-6 weeks of focused preparation (2-3 hours per day) is sufficient to pass DSA rounds
                at top companies.
              </p>
            </div>
          </section>

          {/* Difficulty breakdown */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Difficulty Breakdown
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(["Easy", "Medium", "Hard"] as const).map((diff) => {
                const count = DSA_QUESTIONS.filter(
                  (q) => q.difficulty === diff,
                ).length;
                return (
                  <div
                    key={diff}
                    className={`p-5 rounded-xl border ${DIFFICULTY_COLORS[diff]} text-center`}
                  >
                    <div className="text-3xl font-bold">{count}</div>
                    <div className="text-sm mt-1">{diff} Problems</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Related topics */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Related Learning Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTopics
                .filter(
                  (t) =>
                    t.category === "Data Structures" ||
                    t.category === "Algorithms",
                )
                .slice(0, 12)
                .map((t) => (
                  <Link
                    key={t.topic}
                    href={`/learn/${slugify(t.topic)}`}
                    className="group p-4 rounded-lg border border-border/30 hover:border-saffron/40 bg-card/50 hover:bg-card/80 transition-all"
                  >
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-saffron transition-colors">
                      {t.topic}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {(t.plan?.sessions?.length ?? 0) > 0 && (
                        <span>{t.plan.sessions.length} lessons</span>
                      )}
                      {(t.quizBank?.length ?? 0) > 0 && (
                        <span>{t.quizBank.length} questions</span>
                      )}
                    </div>
                  </Link>
                ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 border-t border-border/30 text-center">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
              Ready to Ace Your DSA Interview?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Practice all 50 questions with interactive lessons, quizzes, code playground (Java, Python, JavaScript),
              and progress tracking &mdash; completely free, no signup required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start Practicing Free &rarr;
              </Link>
              <Link
                href="/top-coding-questions"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                View Top 100 Coding Questions
              </Link>
            </div>
          </section>

          {/* JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "ItemList",
                name: "Top 50 DSA Interview Questions",
                description:
                  "Curated list of the 50 most-asked data structures and algorithms interview questions for software engineers.",
                numberOfItems: DSA_QUESTIONS.length,
                itemListElement: DSA_QUESTIONS.map((q) => ({
                  "@type": "ListItem",
                  position: q.id,
                  name: q.question,
                  url: `${BASE}/dsa-interview-questions#${q.topic.toLowerCase().replace(/\s+/g, "-")}`,
                })),
              }),
            }}
          />
        </article>
      </main>
      <SeoFooter />
    </div>
  );
}

// ── Shared Navbar & Footer (server components) ──────────────────────────────

function SeoNavbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30"
    >
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.png"
              alt="Guru Sishya"
              className="size-8 rounded-lg"
              width={32}
              height={32}
            />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">
              GURU SISHYA
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Topics
            </Link>
            <Link href="/dsa-interview-questions" className="text-sm text-foreground font-medium">
              DSA Questions
            </Link>
            <Link href="/system-design-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              System Design
            </Link>
            <Link href="/behavioral-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Behavioral
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/app/topics"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-saffron hover:bg-saffron/90 text-white transition-colors"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}

function SeoFooter() {
  return (
    <footer className="border-t border-border/30 bg-background/50 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Interview Prep</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dsa-interview-questions" className="hover:text-foreground transition-colors">DSA Questions</Link></li>
              <li><Link href="/system-design-interview" className="hover:text-foreground transition-colors">System Design</Link></li>
              <li><Link href="/behavioral-interview" className="hover:text-foreground transition-colors">Behavioral Interview</Link></li>
              <li><Link href="/cloud-devops-interview" className="hover:text-foreground transition-colors">Cloud & DevOps</Link></li>
              <li><Link href="/database-interview" className="hover:text-foreground transition-colors">Database Interview</Link></li>
              <li><Link href="/backend-interview" className="hover:text-foreground transition-colors">Backend Interview</Link></li>
              <li><Link href="/top-coding-questions" className="hover:text-foreground transition-colors">Top 100 Coding Questions</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/learn" className="hover:text-foreground transition-colors">All Topics</Link></li>
              <li><Link href="/app/topics" className="hover:text-foreground transition-colors">Start Learning</Link></li>
              <li><Link href="/leetcode-alternative" className="hover:text-foreground transition-colors">Why Guru Sishya</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Free Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>81 Topics</li>
              <li>1,730+ Quiz Questions</li>
              <li>Code Playground</li>
              <li>No Signup Required</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
          <div className="flex items-center gap-2">
            <Image src="/logo-mark.png" alt="Guru Sishya" className="size-6 rounded" width={24} height={24} />
            <span className="text-sm text-muted-foreground">
              Guru Sishya &mdash; Free Interview Prep for Engineers
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
