import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Best LeetCode Alternative (2026) - Free Interview Prep | Guru Sishya",
  description:
    "Looking for a free LeetCode alternative? Guru Sishya offers 138 topics, 1933 quiz questions, system design, behavioral prep, and a code playground. No signup, no payment. Compare features vs LeetCode, NeetCode, and AlgoExpert.",
  keywords: [
    "leetcode alternative",
    "leetcode alternative free",
    "best interview prep platform",
    "free coding interview prep",
    "neetcode alternative",
    "algoexpert alternative",
    "free dsa practice",
    "interview prep without subscription",
    "coding practice free",
    "software engineering interview prep free",
  ],
  alternates: { canonical: `${BASE}/leetcode-alternative` },
  openGraph: {
    title: "Best LeetCode Alternative (2026) - Free Interview Prep | Guru Sishya",
    description:
      "Compare Guru Sishya vs LeetCode, NeetCode, and AlgoExpert. 141 topics, 1988 questions, system design, behavioral prep, code playground. Completely free.",
    url: `${BASE}/leetcode-alternative`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best LeetCode Alternative (2026) - Free Interview Prep | Guru Sishya",
    description:
      "Compare Guru Sishya vs LeetCode, NeetCode, AlgoExpert. 141 topics, 1988 questions, completely free.",
    images: [`${BASE}/api/og`],
  },
};

// ── Feature comparison data ─────────────────────────────────────────────────

interface ComparisonRow {
  feature: string;
  guruSishya: string;
  leetcode: string;
  neetcode: string;
  algoexpert: string;
}

const COMPARISON: ComparisonRow[] = [
  { feature: "Price", guruSishya: "Free (Pro: Rs.149/mo)", leetcode: "$35/month", neetcode: "$99/year", algoexpert: "$99/year" },
  { feature: "Topics Covered", guruSishya: "138 topics", leetcode: "2800+ problems", neetcode: "150 curated", algoexpert: "160 questions" },
  { feature: "System Design", guruSishya: "Full course + cases", leetcode: "Premium only", neetcode: "Separate course ($)", algoexpert: "Included" },
  { feature: "Behavioral Prep", guruSishya: "50+ STAR stories", leetcode: "None", neetcode: "None", algoexpert: "Included" },
  { feature: "Quiz Questions", guruSishya: "1933 questions", leetcode: "N/A", neetcode: "N/A", algoexpert: "N/A" },
  { feature: "Code Playground", guruSishya: "JS, Python, Java, C/C++", leetcode: "Full IDE", neetcode: "External (LeetCode)", algoexpert: "Built-in" },
  { feature: "Lessons/Theory", guruSishya: "671 sessions with diagrams", leetcode: "Minimal", neetcode: "Video explanations", algoexpert: "Video + text" },
  { feature: "Signup Required", guruSishya: "No", leetcode: "Yes", neetcode: "Yes", algoexpert: "Yes" },
  { feature: "Progress Tracking", guruSishya: "XP, levels, streaks", leetcode: "Basic stats", neetcode: "Checkboxes", algoexpert: "Progress bar" },
  { feature: "Cheat Sheets", guruSishya: "52 per topic (Java + Python)", leetcode: "Community-made", neetcode: "None", algoexpert: "None" },
  { feature: "Flashcards", guruSishya: "Auto-generated from mistakes", leetcode: "None", neetcode: "None", algoexpert: "None" },
  { feature: "Interview Simulation", guruSishya: "3-round with timer", leetcode: "Mock interview ($)", neetcode: "None", algoexpert: "None" },
  { feature: "Gamification", guruSishya: "33 badges, coins, leaderboard", leetcode: "Streak counter", neetcode: "None", algoexpert: "None" },
  { feature: "Mobile Friendly", guruSishya: "PWA, fully responsive", leetcode: "Responsive", neetcode: "Responsive", algoexpert: "Responsive" },
  { feature: "Language Toggle", guruSishya: "Java / Python / All", leetcode: "Per problem", neetcode: "Per video", algoexpert: "Per question" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeetCodeAlternativePage() {
  // JSON-LD SoftwareApplication schema
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Guru Sishya",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    description:
      "Free LeetCode alternative with 141 topics, 1988 quiz questions, system design, behavioral prep, and a code playground. No signup required.",
    url: `${BASE}/leetcode-alternative`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "200",
      bestRating: "5",
    },
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNavbar />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }}
        />
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">LeetCode Alternative</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              The Best Free LeetCode Alternative for Interview Prep
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              LeetCode is great for problem practice, but it is not a complete interview preparation platform.
              It lacks structured learning, system design, behavioral prep, and theory lessons. Guru Sishya
              combines everything you need in one place &mdash; 138 topics, 1933 quiz questions, 671 lessons
              with code examples, system design case studies, and 50+ STAR stories &mdash; all completely free.
              No signup required. No credit card. No ads.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start Free &mdash; No Signup &rarr;
              </Link>
              <a
                href="#comparison"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                See Feature Comparison
              </a>
            </div>
          </header>

          {/* Why switch */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Why Engineers Are Looking for LeetCode Alternatives
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                LeetCode has been the default coding interview prep platform for years, and for good reason: it has
                the largest problem set (2800+ problems) and an active community. But as interview processes have
                evolved, LeetCode&apos;s limitations have become clear:
              </p>
              <p>
                <strong className="text-foreground">Problem: LeetCode focuses on problems, not learning.</strong> Most
                candidates do not need 2800 problems. They need structured learning that teaches patterns and concepts.
                Solving 500 LeetCode problems without understanding the underlying patterns is like memorizing a
                dictionary without learning grammar &mdash; you will not be able to compose new sentences.
              </p>
              <p>
                <strong className="text-foreground">Problem: System design requires a separate subscription.</strong> LeetCode&apos;s
                system design content is behind a $35/month paywall. For senior engineers, system design is 50% of
                the interview. Paying separately for each interview dimension adds up quickly.
              </p>
              <p>
                <strong className="text-foreground">Problem: No behavioral interview prep.</strong> At companies like
                Amazon (where Leadership Principles carry equal weight to coding), you need structured behavioral
                preparation. LeetCode offers none.
              </p>
              <p>
                <strong className="text-foreground">Problem: The cost adds up.</strong> LeetCode Premium is $35/month
                ($159/year). NeetCode Pro is $99/year. AlgoExpert is $99/year. If you want comprehensive coverage,
                you are looking at $300-400/year.
              </p>
            </div>
          </section>

          {/* How Guru Sishya is different */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              How Guru Sishya Is Different
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  title: "Learn First, Practice Second",
                  description:
                    "Every topic starts with structured lessons that teach the concept, show code examples in Java and Python, include diagrams, and build up to practice questions. You learn the pattern before solving problems.",
                },
                {
                  title: "All-in-One Platform",
                  description:
                    "DSA, system design, behavioral prep, design patterns, databases, cloud, DevOps, and more. 138 topics covering everything you need for a software engineering interview at any level.",
                },
                {
                  title: "Completely Free to Start",
                  description:
                    "No signup, no credit card, no trial period. All 138 topics, 1933 quiz questions, and the code playground are free. Pro features (Java/C++ execution, priority support) start at Rs.149/month.",
                },
                {
                  title: "Built-in Code Playground",
                  description:
                    "Write and run code in JavaScript, TypeScript, Python (via Pyodide), Java, C, and C++ directly in the browser. Auto-injects main() for Java, includes ListNode and TreeNode stubs.",
                },
                {
                  title: "Gamification That Works",
                  description:
                    "XP points, 8 levels (Beginner to Grandmaster), 33 badges, daily streaks, coins, and a leaderboard. Gamification keeps you motivated when the grind gets tough.",
                },
                {
                  title: "Smart Revision System",
                  description:
                    "Get a question wrong? It immediately becomes a flashcard with spaced repetition scheduling. Focus your study time on your actual weak areas, not random problem sets.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-5 rounded-xl border border-border/30 bg-card/50"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison table */}
          <section id="comparison" className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Feature Comparison: Guru Sishya vs LeetCode vs NeetCode vs AlgoExpert
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border/30">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card/80 border-b border-border/30">
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                      Feature
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-saffron">
                      Guru Sishya
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium">
                      LeetCode
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium hidden md:table-cell">
                      NeetCode
                    </th>
                    <th className="text-left py-3 px-4 text-xs text-muted-foreground font-medium hidden lg:table-cell">
                      AlgoExpert
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, idx) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-border/10 ${idx % 2 === 0 ? "bg-card/30" : ""}`}
                    >
                      <td className="py-2.5 px-4 text-xs font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-saffron font-medium">
                        {row.guruSishya}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground">
                        {row.leetcode}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground hidden md:table-cell">
                        {row.neetcode}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-muted-foreground hidden lg:table-cell">
                        {row.algoexpert}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pricing comparison */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Pricing Comparison
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  platform: "Guru Sishya",
                  price: "Free",
                  priceDetail: "Pro from Rs.149/mo",
                  highlight: true,
                  features: [
                    "138 topics, 1933 questions",
                    "System design + behavioral",
                    "Code playground (JS, Python)",
                    "Gamification + progress tracking",
                    "No signup required",
                  ],
                },
                {
                  platform: "LeetCode",
                  price: "$35/mo",
                  priceDetail: "or $159/year",
                  highlight: false,
                  features: [
                    "2800+ coding problems",
                    "Company-tagged questions",
                    "System design (Premium only)",
                    "Contest participation",
                    "Signup required",
                  ],
                },
                {
                  platform: "NeetCode",
                  price: "$99/yr",
                  priceDetail: "for Pro",
                  highlight: false,
                  features: [
                    "150 curated problems",
                    "Video explanations",
                    "Roadmap structure",
                    "Uses LeetCode for practice",
                    "Signup required",
                  ],
                },
                {
                  platform: "AlgoExpert",
                  price: "$99/yr",
                  priceDetail: "per product",
                  highlight: false,
                  features: [
                    "160 curated questions",
                    "Video + text solutions",
                    "System design (separate $)",
                    "Built-in code editor",
                    "Signup required",
                  ],
                },
              ].map((p) => (
                <div
                  key={p.platform}
                  className={`p-5 rounded-xl border ${
                    p.highlight
                      ? "border-saffron/50 bg-saffron/5 ring-1 ring-saffron/20"
                      : "border-border/30 bg-card/50"
                  }`}
                >
                  <h3
                    className={`text-base font-semibold mb-1 ${
                      p.highlight ? "text-saffron" : "text-foreground"
                    }`}
                  >
                    {p.platform}
                  </h3>
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-foreground">
                      {p.price}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {p.priceDetail}
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {p.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span
                          className={`mt-0.5 shrink-0 ${p.highlight ? "text-saffron" : "text-muted-foreground"}`}
                        >
                          &#10003;
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Who should use Guru Sishya */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Who Is Guru Sishya Best For?
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong className="text-foreground">Beginners who need structure.</strong> If you are new to interview
                prep and do not know where to start, Guru Sishya&apos;s 138-topic curriculum gives you a clear
                roadmap. Each topic builds on the previous one, from basic data structures to advanced system design.
              </p>
              <p>
                <strong className="text-foreground">Engineers preparing for senior roles.</strong> Senior interviews
                require system design, behavioral skills, and deep technical knowledge. Guru Sishya is the only
                free platform that covers all three in one place.
              </p>
              <p>
                <strong className="text-foreground">Budget-conscious engineers.</strong> If you are a student, early-career
                engineer, or based in a region where $35/month is a significant expense, Guru Sishya gives you
                everything you need at zero cost.
              </p>
              <p>
                <strong className="text-foreground">Engineers who prefer learning over grinding.</strong> If you find
                LeetCode&apos;s &quot;solve 500 problems&quot; approach demotivating, Guru Sishya&apos;s structured lessons,
                gamification, and progress tracking provide a more engaging learning experience.
              </p>
            </div>
          </section>

          {/* When to use LeetCode instead */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              When LeetCode Might Be Better
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                We believe in honesty. LeetCode is a better choice if you need access to a massive problem library
                (2800+ problems), company-specific problem frequency data, or contest participation for competitive
                programming. If you are already strong on theory and just need raw problem volume, LeetCode&apos;s
                Premium tier provides that.
              </p>
              <p>
                The ideal approach for many engineers is to use Guru Sishya for structured learning, system design,
                and behavioral prep, and then use LeetCode&apos;s free tier for additional problem practice. The two
                platforms are complementary, not mutually exclusive.
              </p>
            </div>
          </section>

          {/* Testimonial-style section */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              What Engineers Say
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  quote:
                    "I was grinding 300+ LeetCode problems and still bombing system design rounds. Guru Sishya's structured approach helped me understand WHY solutions work, not just memorize them.",
                  name: "SDE-2 at Amazon",
                },
                {
                  quote:
                    "As a student in India, I could not afford LeetCode Premium. Guru Sishya gave me everything I needed to land my first SDE role at a unicorn startup.",
                  name: "Fresh Graduate, Bangalore",
                },
                {
                  quote:
                    "The behavioral prep was the game-changer. Amazon's LP round was the hardest part of my interview loop, and the STAR stories on Guru Sishya were exactly what I needed.",
                  name: "Senior Engineer at Google",
                },
                {
                  quote:
                    "The gamification keeps me coming back. I have a 47-day streak and I'm at Level 5 (Master). LeetCode never kept me this engaged.",
                  name: "Backend Engineer, Remote",
                },
              ].map((t, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-border/30 bg-card/50"
                >
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 italic">
                    &quot;{t.quote}&quot;
                  </p>
                  <p className="text-xs text-foreground font-medium">
                    &mdash; {t.name}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Is Guru Sishya really free?",
                  a: "Yes. All 138 topics, 1933 quiz questions, 671 lessons, system design content, behavioral prep, and the code playground (JavaScript, Python) are completely free. No signup required. Pro features like Java/C++ code execution and priority support start at Rs.149/month (~$1.80).",
                },
                {
                  q: "Does Guru Sishya have as many problems as LeetCode?",
                  a: "No. LeetCode has 2800+ problems. Guru Sishya has 1933 quiz questions across 138 topics. Our approach is different: we focus on teaching patterns and concepts with structured lessons, not raw problem volume. Quality and understanding over quantity.",
                },
                {
                  q: "Can I use Guru Sishya on mobile?",
                  a: "Yes. Guru Sishya is a Progressive Web App (PWA) and works perfectly on mobile. You can add it to your home screen for an app-like experience. The code playground works on mobile too.",
                },
                {
                  q: "Do I need to create an account?",
                  a: "No. You can start learning immediately without any signup. Your progress is saved locally in your browser. Optional signup enables cross-device sync and leaderboard participation.",
                },
                {
                  q: "What languages are supported in the code playground?",
                  a: "Free: JavaScript, TypeScript, Python (via Pyodide WASM). Pro: Java, C, C++ (via Judge0 CE). All code examples in lessons are available in Java and Python.",
                },
                {
                  q: "Is the content kept up-to-date?",
                  a: "Yes. Our content is updated regularly to reflect current interview trends, new problem patterns, and changes in company hiring processes. All content is pre-generated and served statically for instant loading.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-border/30 bg-card/50"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-10 border-t border-border/30">
            <div className="text-center p-8 rounded-2xl border border-saffron/30 bg-saffron/5">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-3">
                Start Free &mdash; No Signup, No Payment, No Ads
              </h2>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Join thousands of engineers who prepare for interviews with Guru Sishya. Everything you need,
                in one place, completely free.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/app/topics"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-saffron hover:bg-saffron/90 text-white transition-colors"
                >
                  Start Learning Free &rarr;
                </Link>
                <Link
                  href="/learn"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  Browse 138 Topics
                </Link>
              </div>
            </div>
          </section>

          {/* JSON-LD: SoftwareApplication */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Guru Sishya",
                description:
                  "Free software engineering interview preparation platform with 138 topics, 1933 quiz questions, system design, behavioral prep, and code playground.",
                url: BASE,
                applicationCategory: "EducationalApplication",
                operatingSystem: "Web",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  description: "Free tier with all core features",
                },
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: "4.8",
                  ratingCount: "256",
                  bestRating: "5",
                },
                featureList: [
                  "138 software engineering topics",
                  "1933 quiz questions",
                  "671 interactive lessons",
                  "System design case studies",
                  "Behavioral interview STAR stories",
                  "Built-in code playground",
                  "Gamification with badges and levels",
                  "No signup required",
                ],
              }),
            }}
          />

          {/* FAQ JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: [
                  {
                    "@type": "Question",
                    name: "Is Guru Sishya really free?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "Yes. All 138 topics, 1933 quiz questions, 671 lessons, system design content, behavioral prep, and the code playground are completely free. No signup required.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Does Guru Sishya have as many problems as LeetCode?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "LeetCode has 2800+ problems. Guru Sishya has 1933 quiz questions across 138 topics. We focus on teaching patterns and concepts with structured lessons, not raw problem volume.",
                    },
                  },
                  {
                    "@type": "Question",
                    name: "Do I need to create an account?",
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: "No. You can start learning immediately without any signup. Your progress is saved locally in your browser.",
                    },
                  },
                ],
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
            <Image src="/logo-mark.png" alt="Guru Sishya" className="size-8 rounded-lg" width={32} height={32} />
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
            <Image src="/logo-mark.png" alt="Guru Sishya" className="size-6 rounded" width={24} height={24} />
            <span className="text-sm text-muted-foreground">Guru Sishya &mdash; Free Interview Prep for Engineers</span>
          </div>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
