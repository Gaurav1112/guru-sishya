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
    "System Design Interview Prep Guide (2026) - Complete Roadmap | Guru Sishya",
  description:
    "Complete system design interview preparation guide. Learn how to design scalable systems like URL shorteners, chat apps, and Netflix. 8 case studies, proven frameworks, and free practice materials.",
  keywords: [
    "system design interview prep",
    "system design interview questions",
    "system design guide",
    "scalability interview",
    "distributed systems interview",
    "design url shortener",
    "design chat application",
    "FAANG system design",
    "high-level design interview",
    "low-level design interview",
  ],
  alternates: { canonical: `${BASE}/system-design-interview` },
  openGraph: {
    title: "System Design Interview Prep Guide (2026) | Guru Sishya",
    description:
      "Complete system design interview guide with 8 real case studies, frameworks, and free practice. Prepare for Google, Amazon, Meta system design rounds.",
    url: `${BASE}/system-design-interview`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "System Design Interview Prep Guide (2026) | Guru Sishya",
    description:
      "Complete system design guide with 8 case studies and frameworks. Free practice for Google, Amazon, Meta interviews.",
    images: [`${BASE}/api/og`],
  },
};

// ── Case studies ────────────────────────────────────────────────────────────

interface CaseStudy {
  title: string;
  description: string;
  concepts: string[];
  companies: string[];
  difficulty: "Medium" | "Hard";
  learnTopic: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    title: "Design a URL Shortener (like Bitly)",
    description:
      "A classic starter question that tests hashing, database design, caching, and read-heavy system optimization. You will design a service handling billions of redirects per day with 99.99% uptime.",
    concepts: ["Hashing", "Base62 Encoding", "Database Sharding", "Caching", "Rate Limiting"],
    companies: ["Amazon", "Google", "Microsoft"],
    difficulty: "Medium",
    learnTopic: "Design a URL Shortener",
  },
  {
    title: "Design a Chat Application (like WhatsApp)",
    description:
      "Tests real-time communication, message delivery guarantees, presence tracking, and end-to-end encryption. Requires understanding of WebSockets, message queues, and fan-out strategies.",
    concepts: ["WebSockets", "Message Queues", "Presence Protocol", "End-to-End Encryption", "Fan-out"],
    companies: ["Meta", "Google", "Microsoft"],
    difficulty: "Hard",
    learnTopic: "Design a Chat Application",
  },
  {
    title: "Design a News Feed (like Facebook)",
    description:
      "One of the most frequently asked system design questions. Covers fan-out on write vs. fan-out on read, ranking algorithms, content delivery, and personalization at scale.",
    concepts: ["Fan-out", "Ranking", "Caching", "CDN", "ML-based Personalization"],
    companies: ["Meta", "Twitter", "LinkedIn"],
    difficulty: "Hard",
    learnTopic: "Design a Social Media Feed",
  },
  {
    title: "Design a Video Streaming Service (like Netflix)",
    description:
      "Explores video transcoding pipelines, adaptive bitrate streaming, CDN architecture, recommendation systems, and handling millions of concurrent streams globally.",
    concepts: ["Video Transcoding", "Adaptive Bitrate", "CDN", "Microservices", "Recommendation Engine"],
    companies: ["Netflix", "Amazon", "Google"],
    difficulty: "Hard",
    learnTopic: "Design a Video Streaming Service",
  },
  {
    title: "Design a Rate Limiter",
    description:
      "Tests your understanding of distributed rate limiting algorithms (token bucket, sliding window, leaky bucket), Redis-based implementations, and API gateway patterns.",
    concepts: ["Token Bucket", "Sliding Window", "Redis", "API Gateway", "Distributed Counting"],
    companies: ["Google", "Amazon", "Stripe"],
    difficulty: "Medium",
    learnTopic: "Design a Rate Limiter",
  },
  {
    title: "Design a Search Engine (like Google)",
    description:
      "Covers web crawling, indexing, ranking (PageRank), query processing, and serving results at sub-second latency across billions of documents.",
    concepts: ["Web Crawler", "Inverted Index", "PageRank", "Query Processing", "Distributed Storage"],
    companies: ["Google", "Amazon", "Microsoft"],
    difficulty: "Hard",
    learnTopic: "Design a Web Crawler",
  },
  {
    title: "Design an E-Commerce Platform (like Amazon)",
    description:
      "A broad question testing inventory management, order processing, payment systems, search, recommendations, and handling traffic spikes during sales events.",
    concepts: ["Inventory Management", "Payment Processing", "Search", "Recommendations", "Event-Driven Architecture"],
    companies: ["Amazon", "Flipkart", "Walmart"],
    difficulty: "Hard",
    learnTopic: "Design an E-Commerce Platform",
  },
  {
    title: "Design a Notification System",
    description:
      "Tests multi-channel notification delivery (push, email, SMS), priority queuing, user preference management, and ensuring exactly-once delivery at scale.",
    concepts: ["Message Queue", "Priority Queue", "Template Engine", "Delivery Tracking", "User Preferences"],
    companies: ["Amazon", "Google", "Uber"],
    difficulty: "Medium",
    learnTopic: "Design a Notification System",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SystemDesignInterviewPage() {
  const allTopics = loadAllContentFromDisk();
  const topicSlugs = new Map(
    allTopics.map((t) => [t.topic.toLowerCase(), slugify(t.topic)]),
  );

  const sdTopics = allTopics.filter(
    (t) =>
      t.category === "System Design" ||
      t.category === "System Design Cases" ||
      t.category === "Distributed Systems",
  );

  function findSlug(name: string): string | null {
    return topicSlugs.get(name.toLowerCase()) ?? null;
  }

  // JSON-LD Course schema for system design
  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "System Design Interview Preparation (2026)",
    description:
      "Complete system design interview preparation guide with case studies on URL shorteners, chat apps, Netflix, and more.",
    provider: {
      "@type": "Organization",
      name: "Guru Sishya",
      url: "https://www.guru-sishya.in",
    },
    isAccessibleForFree: true,
    numberOfCredits: sdTopics.length,
    educationalLevel: "Advanced",
    inLanguage: "en",
    url: `${BASE}/system-design-interview`,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoNavbar />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
        />
        <article className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-medium">System Design Interview</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              The Complete System Design Interview Guide for 2026
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              System design interviews are the highest-leverage round in senior engineering interviews. A strong
              system design performance can compensate for a mediocre coding round, but the reverse is rarely true.
              This guide covers everything you need: what to expect, how to structure your answers, 8 real case
              studies, and a step-by-step preparation roadmap.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start System Design Prep Free &rarr;
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Browse All Topics
              </Link>
            </div>
          </header>

          {/* What to expect */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              What to Expect in a System Design Interview
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                A system design interview typically lasts 45-60 minutes. The interviewer gives you an open-ended
                problem (&quot;Design Twitter&quot; or &quot;Design a URL shortener&quot;) and evaluates how you approach
                the design from requirements gathering to deployment. Unlike coding interviews where there is one
                correct answer, system design interviews test your ability to make reasonable trade-offs and communicate
                your thinking clearly.
              </p>
              <p>
                Most interviewers evaluate five key dimensions: <strong>requirements clarification</strong> (do you ask
                the right questions?), <strong>high-level design</strong> (can you break the system into components?),
                <strong>detailed design</strong> (can you dive deep into critical components?), <strong>scalability</strong>
                (can you handle 10x, 100x, 1000x growth?), and <strong>trade-offs</strong> (do you understand the
                implications of your choices?).
              </p>
              <p>
                System design rounds are most common for senior (L5+) positions at companies like Google, Amazon, Meta,
                Microsoft, and Netflix. However, many companies now include system design for mid-level engineers (L4)
                as well, especially for backend and infrastructure roles.
              </p>
            </div>
          </section>

          {/* Framework */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              The 4-Step System Design Framework
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: "Requirements & Scope",
                  time: "5-10 min",
                  description:
                    "Ask clarifying questions. Define functional requirements (what the system does) and non-functional requirements (latency, throughput, availability). Establish scale: How many users? How many requests per second? How much data?",
                },
                {
                  step: "2",
                  title: "High-Level Design",
                  time: "10-15 min",
                  description:
                    "Draw the main components: clients, load balancers, API servers, databases, caches, message queues. Show data flow between them. This is your architecture blueprint that guides the rest of the discussion.",
                },
                {
                  step: "3",
                  title: "Detailed Design",
                  time: "15-20 min",
                  description:
                    "Dive deep into 2-3 critical components. Design the database schema, API contracts, caching strategy, or specific algorithms. The interviewer often guides which areas to explore based on the role.",
                },
                {
                  step: "4",
                  title: "Scale & Trade-offs",
                  time: "5-10 min",
                  description:
                    "Address bottlenecks, single points of failure, and scalability. Discuss trade-offs you made (consistency vs. availability, latency vs. throughput). Mention monitoring, alerting, and failure handling.",
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className="p-5 rounded-xl border border-border/30 bg-card/50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="size-8 rounded-full bg-saffron/20 text-saffron font-bold flex items-center justify-center text-sm">
                      {step.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {step.time}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Key concepts */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Essential System Design Concepts
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Before tackling case studies, you need to understand these building blocks. Each is a common discussion
                point in system design interviews and understanding them deeply will help you make informed trade-offs.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {[
                { concept: "Load Balancing", desc: "Distributing traffic across servers (Round Robin, Least Connections, Consistent Hashing)" },
                { concept: "Caching", desc: "Redis, Memcached, CDN caching, write-through vs. write-back, cache invalidation strategies" },
                { concept: "Database Sharding", desc: "Horizontal partitioning, shard keys, consistent hashing, cross-shard queries" },
                { concept: "CAP Theorem", desc: "Consistency, Availability, Partition Tolerance trade-offs in distributed systems" },
                { concept: "Message Queues", desc: "Kafka, RabbitMQ, SQS for asynchronous processing, event-driven architectures" },
                { concept: "Microservices", desc: "Service decomposition, API gateways, service mesh, inter-service communication" },
                { concept: "Database Replication", desc: "Primary-replica, multi-leader, conflict resolution, read replicas" },
                { concept: "Content Delivery Networks", desc: "Edge caching, geographic distribution, cache invalidation, pull vs. push" },
                { concept: "Consistent Hashing", desc: "Minimizing data redistribution when nodes are added/removed" },
                { concept: "SQL vs. NoSQL", desc: "When to use relational databases vs. document stores, key-value stores, or wide-column stores" },
                { concept: "API Design", desc: "REST vs. GraphQL vs. gRPC, pagination, rate limiting, versioning" },
                { concept: "Monitoring & Observability", desc: "Metrics, logging, tracing, alerting, SLIs/SLOs/SLAs" },
              ].map((item) => (
                <div
                  key={item.concept}
                  className="p-4 rounded-lg border border-border/30 bg-card/50"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {item.concept}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Case studies */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              8 Real System Design Case Studies
            </h2>
            <p className="text-muted-foreground mb-6">
              These are the most frequently asked system design questions at top tech companies. Each case study
              on Guru Sishya includes a complete solution walkthrough with architecture diagrams, database schemas,
              API designs, and scalability analysis.
            </p>
            <div className="space-y-4">
              {CASE_STUDIES.map((cs, idx) => {
                const slug = findSlug(cs.learnTopic);
                return (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-border/30 bg-card/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{idx + 1}
                          </span>
                          <h3 className="text-base font-semibold text-foreground">
                            {cs.title}
                          </h3>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                              cs.difficulty === "Hard"
                                ? "text-destructive bg-destructive/10 border-destructive/30"
                                : "text-gold bg-gold/10 border-gold/30"
                            }`}
                          >
                            {cs.difficulty}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                          {cs.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {cs.concepts.map((c) => (
                            <span
                              key={c}
                              className="text-xs px-2 py-0.5 rounded-full bg-saffron/10 text-saffron border border-saffron/20"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Asked at:</span>
                          {cs.companies.map((c) => (
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
                          className="shrink-0 inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-4 border border-saffron/30 text-saffron hover:bg-saffron/10 transition-colors"
                        >
                          Study This &rarr;
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Preparation timeline */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              System Design Interview Preparation Timeline
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                Week 1-2: Learn the Fundamentals
              </h3>
              <p>
                Study the core building blocks: load balancing, caching, database sharding, replication, message queues,
                and the CAP theorem. Do not try to memorize architectures &mdash; focus on understanding
                <em>why</em> each component exists and <em>when</em> to use it. Guru Sishya&apos;s system design
                fundamentals module covers all of these with interactive lessons and diagrams.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Week 3-4: Practice Case Studies
              </h3>
              <p>
                Work through 1-2 case studies per day. For each one, start by writing down requirements before looking
                at any solution. Then design the high-level architecture on paper (or a whiteboard). Compare your design
                with the reference solution and note what you missed. Focus on understanding the trade-offs in each
                design decision.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Week 5-6: Mock Interviews
              </h3>
              <p>
                Practice with a partner or use Guru Sishya&apos;s Feynman mode to explain your designs out loud. Time
                yourself: you should be able to cover requirements, high-level design, and detailed design for any
                case study in 35-40 minutes. Record yourself and review: Are you communicating trade-offs clearly?
                Are you asking the right clarifying questions? Are you drawing clean, readable diagrams?
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                Common Mistakes to Avoid
              </h3>
              <p>
                <strong>Jumping to solutions</strong> &mdash; Always start with requirements.
                <strong> Over-engineering</strong> &mdash; Design for current scale with a plan to scale, not for
                1 billion users from day one. <strong>Ignoring non-functional requirements</strong> &mdash; Latency,
                availability, consistency, and cost are just as important as functionality.
                <strong> Not discussing trade-offs</strong> &mdash; Every design decision has pros and cons; interviewers
                want to see that you understand them.
              </p>
            </div>
          </section>

          {/* Related topics from content */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              System Design Topics on Guru Sishya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sdTopics.slice(0, 15).map((t) => (
                <Link
                  key={t.topic}
                  href={`/learn/${slugify(t.topic)}`}
                  className="group p-4 rounded-lg border border-border/30 hover:border-teal/40 bg-card/50 hover:bg-card/80 transition-all"
                >
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-teal transition-colors">
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
              Master System Design for Your Next Interview
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Get full case study walkthroughs, interactive diagrams, quizzes, and a Feynman practice mode
              to explain your designs out loud &mdash; all free, no signup required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Start System Design Prep &rarr;
              </Link>
              <Link
                href="/dsa-interview-questions"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                DSA Interview Questions
              </Link>
            </div>
          </section>

          {/* JSON-LD: Course schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Course",
                name: "System Design Interview Preparation",
                description:
                  "Complete system design interview preparation guide with 8 case studies, frameworks, and free practice materials.",
                provider: {
                  "@type": "Organization",
                  name: "Guru Sishya",
                  url: BASE,
                },
                isAccessibleForFree: true,
                numberOfCredits: sdTopics.length,
                educationalLevel: "Advanced",
                about: {
                  "@type": "Thing",
                  name: "System Design",
                },
                hasCourseInstance: {
                  "@type": "CourseInstance",
                  courseMode: "Online",
                  courseWorkload: `${sdTopics.length} topics with ${CASE_STUDIES.length} case studies`,
                },
                inLanguage: "en",
                url: `${BASE}/system-design-interview`,
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
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 bg-background/60 backdrop-blur-md border-b border-border/30"
    >
      <div className="flex h-14 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo-mark.png" alt="Guru Sishya" className="size-8 rounded-lg" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Topics</Link>
            <Link href="/dsa-interview-questions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DSA Questions</Link>
            <Link href="/system-design-interview" className="text-sm text-foreground font-medium">System Design</Link>
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
            <span className="text-sm text-muted-foreground">Guru Sishya &mdash; Free Interview Prep for Engineers</span>
          </div>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
