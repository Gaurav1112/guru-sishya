import type { Metadata } from "next";
import Link from "next/link";
import {
  loadAllContentFromDisk,
  slugify,
} from "@/lib/content/server-loader";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Top 100 Coding Interview Questions by Company (2026) - Google, Amazon, Meta | Guru Sishya",
  description:
    "The 100 most frequently asked coding interview questions organized by company (Google, Amazon, Meta, Microsoft, Apple). Difficulty ratings, topic tags, and free practice on Guru Sishya.",
  keywords: [
    "top 100 coding questions",
    "most asked interview questions",
    "Google interview questions",
    "Amazon coding questions",
    "Meta interview questions",
    "Microsoft coding interview",
    "Apple interview questions",
    "coding interview preparation",
    "FAANG interview questions",
    "blind 75",
  ],
  alternates: { canonical: `${BASE}/top-coding-questions` },
  openGraph: {
    title: "Top 100 Coding Interview Questions by Company (2026) | Guru Sishya",
    description:
      "Curated list of 100 most-asked coding questions at Google, Amazon, Meta, Microsoft, and Apple. Free practice with lessons, quizzes, and code playground.",
    url: `${BASE}/top-coding-questions`,
    type: "website",
    siteName: "Guru Sishya",
  },
};

// ── Curated 100 questions by company ────────────────────────────────────────

interface CodingQuestion {
  id: number;
  question: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  companies: string[];
  learnTopic?: string;
}

const CODING_QUESTIONS: CodingQuestion[] = [
  // Google favorites
  { id: 1, question: "Two Sum", topic: "Arrays", difficulty: "Easy", companies: ["Google", "Amazon", "Meta"], learnTopic: "Arrays" },
  { id: 2, question: "Longest Substring Without Repeating Characters", topic: "Sliding Window", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Sliding Window" },
  { id: 3, question: "Median of Two Sorted Arrays", topic: "Binary Search", difficulty: "Hard", companies: ["Google", "Amazon", "Apple"], learnTopic: "Searching Algorithms" },
  { id: 4, question: "Regular Expression Matching", topic: "Dynamic Programming", difficulty: "Hard", companies: ["Google", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 5, question: "Merge K Sorted Lists", topic: "Heaps", difficulty: "Hard", companies: ["Google", "Amazon", "Meta"], learnTopic: "Heaps" },
  { id: 6, question: "Trapping Rain Water", topic: "Arrays", difficulty: "Hard", companies: ["Google", "Amazon", "Goldman Sachs"], learnTopic: "Arrays" },
  { id: 7, question: "Word Ladder", topic: "Graphs", difficulty: "Hard", companies: ["Google", "Amazon", "Meta"], learnTopic: "Graphs" },
  { id: 8, question: "LRU Cache", topic: "Design", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Linked Lists" },
  { id: 9, question: "Course Schedule", topic: "Graphs", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Graphs" },
  { id: 10, question: "Serialize and Deserialize Binary Tree", topic: "Trees", difficulty: "Hard", companies: ["Google", "Meta", "Microsoft"], learnTopic: "Binary Trees" },

  // Amazon favorites
  { id: 11, question: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: "Easy", companies: ["Amazon", "Meta", "Goldman Sachs"], learnTopic: "Arrays" },
  { id: 12, question: "Number of Islands", topic: "Graphs", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Graphs" },
  { id: 13, question: "Merge Intervals", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Arrays" },
  { id: 14, question: "Word Break", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Dynamic Programming" },
  { id: 15, question: "Copy List with Random Pointer", topic: "Linked Lists", difficulty: "Medium", companies: ["Amazon", "Meta", "Microsoft"], learnTopic: "Linked Lists" },
  { id: 16, question: "Reorder Data in Log Files", topic: "Strings", difficulty: "Medium", companies: ["Amazon"], learnTopic: "Arrays" },
  { id: 17, question: "Partition Labels", topic: "Greedy", difficulty: "Medium", companies: ["Amazon", "Google"], learnTopic: "Greedy Algorithms" },
  { id: 18, question: "K Closest Points to Origin", topic: "Heaps", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Heaps" },
  { id: 19, question: "Rotting Oranges", topic: "Graphs", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Graphs" },
  { id: 20, question: "Min Cost to Connect All Points", topic: "Graphs", difficulty: "Medium", companies: ["Amazon", "Google"], learnTopic: "Graphs" },

  // Meta favorites
  { id: 21, question: "Valid Palindrome", topic: "Strings", difficulty: "Easy", companies: ["Meta", "Amazon", "Microsoft"], learnTopic: "Arrays" },
  { id: 22, question: "Add Binary", topic: "Math", difficulty: "Easy", companies: ["Meta", "Amazon", "Google"], learnTopic: "Arrays" },
  { id: 23, question: "Move Zeroes", topic: "Arrays", difficulty: "Easy", companies: ["Meta", "Amazon", "Apple"], learnTopic: "Arrays" },
  { id: 24, question: "Subarray Sum Equals K", topic: "Arrays", difficulty: "Medium", companies: ["Meta", "Google", "Amazon"], learnTopic: "Arrays" },
  { id: 25, question: "Binary Tree Right Side View", topic: "Trees", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Binary Trees" },
  { id: 26, question: "Vertical Order Traversal", topic: "Trees", difficulty: "Hard", companies: ["Meta", "Amazon", "Google"], learnTopic: "Binary Trees" },
  { id: 27, question: "Lowest Common Ancestor of Binary Tree", topic: "Trees", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Binary Trees" },
  { id: 28, question: "Random Pick with Weight", topic: "Math", difficulty: "Medium", companies: ["Meta", "Google"], learnTopic: "Arrays" },
  { id: 29, question: "Minimum Remove to Make Valid Parentheses", topic: "Stacks", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Stacks" },
  { id: 30, question: "Buildings With an Ocean View", topic: "Arrays", difficulty: "Medium", companies: ["Meta", "Amazon"], learnTopic: "Arrays" },

  // Microsoft favorites
  { id: 31, question: "Reverse Linked List", topic: "Linked Lists", difficulty: "Easy", companies: ["Microsoft", "Amazon", "Apple"], learnTopic: "Linked Lists" },
  { id: 32, question: "Valid Parentheses", topic: "Stacks", difficulty: "Easy", companies: ["Microsoft", "Amazon", "Google"], learnTopic: "Stacks" },
  { id: 33, question: "Spiral Matrix", topic: "Arrays", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Google"], learnTopic: "Arrays" },
  { id: 34, question: "Group Anagrams", topic: "Hash Maps", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Meta"], learnTopic: "Hash Tables" },
  { id: 35, question: "Longest Palindromic Substring", topic: "Strings", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Google"], learnTopic: "Dynamic Programming" },
  { id: 36, question: "String to Integer (atoi)", topic: "Strings", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Meta"], learnTopic: "Arrays" },
  { id: 37, question: "Maximal Rectangle", topic: "Stacks", difficulty: "Hard", companies: ["Microsoft", "Google", "Amazon"], learnTopic: "Stacks" },
  { id: 38, question: "Find All Anagrams in a String", topic: "Sliding Window", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Meta"], learnTopic: "Sliding Window" },
  { id: 39, question: "Set Matrix Zeroes", topic: "Arrays", difficulty: "Medium", companies: ["Microsoft", "Amazon", "Meta"], learnTopic: "Arrays" },
  { id: 40, question: "Excel Sheet Column Title", topic: "Math", difficulty: "Easy", companies: ["Microsoft", "Amazon"], learnTopic: "Arrays" },

  // Apple favorites
  { id: 41, question: "Contains Duplicate", topic: "Arrays", difficulty: "Easy", companies: ["Apple", "Amazon", "Google"], learnTopic: "Arrays" },
  { id: 42, question: "Roman to Integer", topic: "Strings", difficulty: "Easy", companies: ["Apple", "Amazon", "Microsoft"], learnTopic: "Arrays" },
  { id: 43, question: "3Sum", topic: "Arrays", difficulty: "Medium", companies: ["Apple", "Meta", "Google"], learnTopic: "Arrays" },
  { id: 44, question: "Letter Combinations of Phone Number", topic: "Backtracking", difficulty: "Medium", companies: ["Apple", "Amazon", "Google"], learnTopic: "Recursion and Backtracking" },
  { id: 45, question: "Decode Ways", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Apple", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },

  // Cross-company essentials (Blind 75 style)
  { id: 46, question: "Product of Array Except Self", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Meta", "Apple"], learnTopic: "Arrays" },
  { id: 47, question: "Maximum Subarray", topic: "Arrays", difficulty: "Medium", companies: ["Google", "Microsoft", "Amazon"], learnTopic: "Arrays" },
  { id: 48, question: "Container With Most Water", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Arrays" },
  { id: 49, question: "Coin Change", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Dynamic Programming" },
  { id: 50, question: "Climbing Stairs", topic: "Dynamic Programming", difficulty: "Easy", companies: ["Amazon", "Google", "Apple"], learnTopic: "Dynamic Programming" },
  { id: 51, question: "House Robber", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Apple"], learnTopic: "Dynamic Programming" },
  { id: 52, question: "Longest Common Subsequence", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 53, question: "Edit Distance", topic: "Dynamic Programming", difficulty: "Hard", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 54, question: "Unique Paths", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Dynamic Programming" },
  { id: 55, question: "Jump Game", topic: "Greedy", difficulty: "Medium", companies: ["Amazon", "Google", "Apple"], learnTopic: "Greedy Algorithms" },
  { id: 56, question: "Longest Increasing Subsequence", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
  { id: 57, question: "Validate Binary Search Tree", topic: "Trees", difficulty: "Medium", companies: ["Amazon", "Meta", "Microsoft"], learnTopic: "Binary Search Trees" },
  { id: 58, question: "Invert Binary Tree", topic: "Trees", difficulty: "Easy", companies: ["Google", "Amazon", "Apple"], learnTopic: "Binary Trees" },
  { id: 59, question: "Maximum Depth of Binary Tree", topic: "Trees", difficulty: "Easy", companies: ["Google", "Amazon", "Meta"], learnTopic: "Binary Trees" },
  { id: 60, question: "Level Order Traversal", topic: "Trees", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Binary Trees" },
  { id: 61, question: "Construct Binary Tree from Preorder and Inorder", topic: "Trees", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Binary Trees" },
  { id: 62, question: "Kth Smallest Element in BST", topic: "Trees", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Binary Search Trees" },
  { id: 63, question: "Linked List Cycle", topic: "Linked Lists", difficulty: "Easy", companies: ["Amazon", "Microsoft", "Google"], learnTopic: "Linked Lists" },
  { id: 64, question: "Merge Two Sorted Lists", topic: "Linked Lists", difficulty: "Easy", companies: ["Amazon", "Google", "Meta"], learnTopic: "Linked Lists" },
  { id: 65, question: "Remove Nth Node From End", topic: "Linked Lists", difficulty: "Medium", companies: ["Meta", "Amazon", "Apple"], learnTopic: "Linked Lists" },
  { id: 66, question: "Reorder List", topic: "Linked Lists", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Linked Lists" },
  { id: 67, question: "Clone Graph", topic: "Graphs", difficulty: "Medium", companies: ["Meta", "Google", "Microsoft"], learnTopic: "Graphs" },
  { id: 68, question: "Pacific Atlantic Water Flow", topic: "Graphs", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Graphs" },
  { id: 69, question: "Graph Valid Tree", topic: "Graphs", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Graphs" },
  { id: 70, question: "Alien Dictionary", topic: "Graphs", difficulty: "Hard", companies: ["Google", "Meta", "Amazon"], learnTopic: "Graphs" },
  { id: 71, question: "Top K Frequent Elements", topic: "Heaps", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Heaps" },
  { id: 72, question: "Find Median from Data Stream", topic: "Heaps", difficulty: "Hard", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Heaps" },
  { id: 73, question: "Search in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Searching Algorithms" },
  { id: 74, question: "Find Minimum in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Searching Algorithms" },
  { id: 75, question: "Implement Trie", topic: "Tries", difficulty: "Medium", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Tries" },
  { id: 76, question: "Design Add and Search Words", topic: "Tries", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Tries" },
  { id: 77, question: "Word Search", topic: "Backtracking", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Recursion and Backtracking" },
  { id: 78, question: "Combination Sum", topic: "Backtracking", difficulty: "Medium", companies: ["Amazon", "Meta", "Google"], learnTopic: "Recursion and Backtracking" },
  { id: 79, question: "Permutations", topic: "Backtracking", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Recursion and Backtracking" },
  { id: 80, question: "Subsets", topic: "Backtracking", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Recursion and Backtracking" },

  // Additional high-frequency
  { id: 81, question: "Min Stack", topic: "Stacks", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Stacks" },
  { id: 82, question: "Daily Temperatures", topic: "Stacks", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Stacks" },
  { id: 83, question: "Car Fleet", topic: "Stacks", difficulty: "Medium", companies: ["Google", "Amazon"], learnTopic: "Stacks" },
  { id: 84, question: "Largest Rectangle in Histogram", topic: "Stacks", difficulty: "Hard", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Stacks" },
  { id: 85, question: "Minimum Window Substring", topic: "Sliding Window", difficulty: "Hard", companies: ["Meta", "Google", "Amazon"], learnTopic: "Sliding Window" },
  { id: 86, question: "Sliding Window Maximum", topic: "Sliding Window", difficulty: "Hard", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Sliding Window" },
  { id: 87, question: "Longest Repeating Character Replacement", topic: "Sliding Window", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Sliding Window" },
  { id: 88, question: "Palindrome Partitioning", topic: "Backtracking", difficulty: "Medium", companies: ["Amazon", "Google", "Meta"], learnTopic: "Recursion and Backtracking" },
  { id: 89, question: "N-Queens", topic: "Backtracking", difficulty: "Hard", companies: ["Google", "Amazon", "Microsoft"], learnTopic: "Recursion and Backtracking" },
  { id: 90, question: "Rotate Image", topic: "Arrays", difficulty: "Medium", companies: ["Amazon", "Microsoft", "Google"], learnTopic: "Arrays" },
  { id: 91, question: "Surrounded Regions", topic: "Graphs", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Graphs" },
  { id: 92, question: "Word Search II", topic: "Tries", difficulty: "Hard", companies: ["Amazon", "Google", "Meta"], learnTopic: "Tries" },
  { id: 93, question: "Meeting Rooms II", topic: "Intervals", difficulty: "Medium", companies: ["Google", "Meta", "Amazon"], learnTopic: "Arrays" },
  { id: 94, question: "Insert Interval", topic: "Intervals", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Arrays" },
  { id: 95, question: "Non-overlapping Intervals", topic: "Intervals", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Arrays" },
  { id: 96, question: "Longest Consecutive Sequence", topic: "Hash Maps", difficulty: "Medium", companies: ["Google", "Amazon", "Meta"], learnTopic: "Hash Tables" },
  { id: 97, question: "Task Scheduler", topic: "Greedy", difficulty: "Medium", companies: ["Meta", "Amazon", "Google"], learnTopic: "Greedy Algorithms" },
  { id: 98, question: "Design Twitter", topic: "Design", difficulty: "Medium", companies: ["Twitter", "Amazon", "Google"], learnTopic: "Heaps" },
  { id: 99, question: "Maximum Product Subarray", topic: "Dynamic Programming", difficulty: "Medium", companies: ["Amazon", "Google", "Microsoft"], learnTopic: "Dynamic Programming" },
  { id: 100, question: "Burst Balloons", topic: "Dynamic Programming", difficulty: "Hard", companies: ["Google", "Amazon", "Meta"], learnTopic: "Dynamic Programming" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-teal bg-teal/10 border-teal/30",
  Medium: "text-gold bg-gold/10 border-gold/30",
  Hard: "text-destructive bg-destructive/10 border-destructive/30",
};

const COMPANY_COLORS: Record<string, string> = {
  Google: "border-teal/40 text-teal",
  Amazon: "border-gold/40 text-gold",
  Meta: "border-indigo-400/40 text-indigo-400",
  Microsoft: "border-sky-400/40 text-sky-400",
  Apple: "border-muted-foreground/40 text-muted-foreground",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TopCodingQuestionsPage() {
  const allTopics = loadAllContentFromDisk();
  const topicSlugs = new Map(
    allTopics.map((t) => [t.topic.toLowerCase(), slugify(t.topic)]),
  );

  function findSlug(learnTopic?: string): string | null {
    if (!learnTopic) return null;
    return topicSlugs.get(learnTopic.toLowerCase()) ?? null;
  }

  // Group by company
  const companies = ["Google", "Amazon", "Meta", "Microsoft", "Apple"];
  const byCompany = new Map<string, CodingQuestion[]>();
  for (const c of companies) {
    byCompany.set(
      c,
      CODING_QUESTIONS.filter((q) => q.companies[0] === c),
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNavbar />
      <main className="flex-1">
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">Top 100 Coding Questions</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Top 100 Coding Interview Questions by Company (2026)
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              This is the definitive list of the 100 most frequently asked coding interview questions at
              Google, Amazon, Meta, Microsoft, and Apple. Compiled from thousands of interview reports,
              this list covers every major topic and pattern you will encounter. Each question is tagged
              with difficulty, topic, and the companies that ask it most frequently. All 100 can be
              practiced for free on Guru Sishya with lessons, quizzes, and a built-in code playground.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice All 100 Questions Free &rarr;
              </Link>
              <Link
                href="/dsa-interview-questions"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Top 50 DSA Questions
              </Link>
            </div>
          </header>

          {/* Stats */}
          <section className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-10">
            {companies.map((c) => {
              const count = CODING_QUESTIONS.filter((q) =>
                q.companies.includes(c),
              ).length;
              return (
                <div
                  key={c}
                  className={`p-4 rounded-xl border bg-card/50 text-center ${COMPANY_COLORS[c] ?? "border-border/30 text-muted-foreground"}`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs mt-1">{c}</div>
                </div>
              );
            })}
          </section>

          {/* How this list was compiled */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              How This List Was Compiled
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                This list is compiled from multiple data sources: interview experience reports on platforms like
                Glassdoor and Blind, publicly available interview question databases, and direct feedback from
                engineers who have interviewed at these companies in 2025-2026. Questions are ranked by frequency
                &mdash; how often they appear in real interview loops.
              </p>
              <p>
                Unlike random LeetCode grinding, this list is structured to maximize your interview readiness.
                The questions are organized by company first, then by pattern. If you are preparing for a specific
                company, focus on their section first, then work through the cross-company essentials. If you
                are doing general preparation, start from question 1 and work through all 100 in order.
              </p>
              <p>
                Each question on Guru Sishya comes with a complete lesson explaining the underlying concept,
                multiple solution approaches (brute force through optimal), code in Java and Python, time/space
                complexity analysis, and related practice problems. The built-in code playground lets you test
                your solutions in JavaScript, TypeScript, Python, Java, C, and C++.
              </p>
            </div>
          </section>

          {/* Company jump links */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Jump to Company
            </h2>
            <div className="flex flex-wrap gap-3">
              {companies.map((c) => (
                <a
                  key={c}
                  href={`#${c.toLowerCase()}-questions`}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors hover:bg-card/80 ${COMPANY_COLORS[c] ?? "border-border/30 text-muted-foreground"}`}
                >
                  {c} ({byCompany.get(c)?.length ?? 0})
                </a>
              ))}
              <a
                href="#all-questions"
                className="text-sm px-3 py-1.5 rounded-full border border-saffron/30 text-saffron hover:bg-saffron/10 transition-colors"
              >
                All 100 Questions
              </a>
            </div>
          </section>

          {/* Company sections */}
          {companies.map((company) => {
            const questions = byCompany.get(company) ?? [];
            if (questions.length === 0) return null;
            return (
              <section
                key={company}
                id={`${company.toLowerCase()}-questions`}
                className="mb-10"
              >
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-2">
                  {company} Top Interview Questions
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Most frequently asked coding questions at {company} in 2025-2026.
                </p>
                <div className="space-y-2">
                  {questions.map((q) => {
                    const slug = findSlug(q.learnTopic);
                    return (
                      <div
                        key={q.id}
                        className="p-3 rounded-lg border border-border/30 bg-card/50 flex flex-col sm:flex-row sm:items-center gap-2"
                      >
                        <span className="text-xs font-mono text-muted-foreground w-8 shrink-0">
                          #{q.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground">
                            {q.question}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {q.topic}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[q.difficulty]}`}
                          >
                            {q.difficulty}
                          </span>
                          {slug && (
                            <Link
                              href={`/learn/${slug}`}
                              className="text-xs text-saffron hover:text-saffron/80 transition-colors"
                            >
                              Learn &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Full list */}
          <section id="all-questions" className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Complete List: All 100 Questions
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30 text-left">
                    <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">#</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">Question</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground font-medium hidden sm:table-cell">Topic</th>
                    <th className="py-2 pr-3 text-xs text-muted-foreground font-medium">Difficulty</th>
                    <th className="py-2 text-xs text-muted-foreground font-medium hidden md:table-cell">Companies</th>
                  </tr>
                </thead>
                <tbody>
                  {CODING_QUESTIONS.map((q) => {
                    const slug = findSlug(q.learnTopic);
                    return (
                      <tr
                        key={q.id}
                        className="border-b border-border/10 hover:bg-card/50"
                      >
                        <td className="py-2 pr-3 text-xs text-muted-foreground font-mono">
                          {q.id}
                        </td>
                        <td className="py-2 pr-3">
                          {slug ? (
                            <Link
                              href={`/learn/${slug}`}
                              className="text-foreground hover:text-saffron transition-colors"
                            >
                              {q.question}
                            </Link>
                          ) : (
                            <span className="text-foreground">{q.question}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground hidden sm:table-cell">
                          {q.topic}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[q.difficulty]}`}
                          >
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-muted-foreground hidden md:table-cell">
                          {q.companies.join(", ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Study plan */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              How to Use This List: 6-Week Study Plan
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">Week 1-2:</strong> Focus on Easy problems across all topics.
                Build pattern recognition. Aim for 3-4 problems per day. Do not look at solutions for at least
                20 minutes per problem.
              </p>
              <p>
                <strong className="text-foreground">Week 3-4:</strong> Move to Medium problems. This is where most
                interview questions fall. Learn to identify patterns quickly: Is this a sliding window problem?
                A BFS/DFS? Dynamic programming? Aim for 2-3 problems per day with full complexity analysis.
              </p>
              <p>
                <strong className="text-foreground">Week 5:</strong> Tackle Hard problems and revisit Medium problems
                you struggled with. Start timed practice: 25 minutes for Medium, 40 minutes for Hard.
              </p>
              <p>
                <strong className="text-foreground">Week 6:</strong> Mock interviews. Do 2-3 full mock interview
                sessions with Guru Sishya&apos;s interview mode. Review all your weak areas one final time.
              </p>
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 border-t border-border/30 text-center">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
              Practice All 100 Questions for Free
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Every question comes with lessons, code in Java and Python, quizzes, and a built-in code
              playground. No signup, no payment, no ads.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start Practicing Free &rarr;
              </Link>
              <Link
                href="/system-design-interview"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                System Design Guide
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
                name: "Top 100 Coding Interview Questions",
                description:
                  "The 100 most frequently asked coding interview questions at Google, Amazon, Meta, Microsoft, and Apple.",
                numberOfItems: CODING_QUESTIONS.length,
                itemListElement: CODING_QUESTIONS.map((q) => ({
                  "@type": "ListItem",
                  position: q.id,
                  name: q.question,
                  url: `${BASE}/top-coding-questions`,
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

// ── Shared Navbar & Footer ──────────────────────────────────────────────────

function SeoNavbar() {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30">
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="Guru Sishya" className="size-8 rounded-lg" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Topics</Link>
            <Link href="/dsa-interview-questions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DSA Questions</Link>
            <Link href="/system-design-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">System Design</Link>
            <Link href="/behavioral-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Behavioral</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
          <Link href="/app/topics" className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 bg-saffron hover:bg-saffron/90 text-white transition-colors">Start Free</Link>
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
              <li>138 Topics</li>
              <li>1933 Quiz Questions</li>
              <li>Code Playground</li>
              <li>No Signup Required</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/20">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="Guru Sishya" className="size-6 rounded" width={24} height={24} />
            <span className="text-sm text-muted-foreground">Guru Sishya &mdash; Free Interview Prep for Engineers</span>
          </div>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
