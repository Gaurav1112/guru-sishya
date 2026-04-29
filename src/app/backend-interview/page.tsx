import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Backend Engineering Interview Questions (2026) — APIs, Microservices, Architecture | Guru Sishya",
  description:
    "20 most-asked backend engineering interview questions with answers. Covers REST vs GraphQL, microservices, authentication (OAuth, JWT), caching (Redis, CDN), message queues (Kafka, RabbitMQ), and API design.",
  keywords: [
    "backend interview questions",
    "backend engineering interview",
    "REST API interview questions",
    "microservices interview questions",
    "API design interview",
    "OAuth JWT interview",
    "caching interview questions",
    "message queue interview",
    "Kafka interview questions",
    "backend developer interview",
  ],
  alternates: { canonical: `${BASE}/backend-interview` },
  openGraph: {
    title: "Backend Engineering Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential backend engineering interview questions covering APIs, microservices, authentication, caching, and message queues. Free lessons and practice.",
    url: `${BASE}/backend-interview`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Backend Engineering Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential backend questions covering APIs, microservices, auth, caching, and queues.",
    images: [`${BASE}/api/og`],
  },
};

// ── Interview questions ──────────────────────────────────────────────────────

interface BackendQuestion {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const BACKEND_QUESTIONS: BackendQuestion[] = [
  // REST vs GraphQL
  {
    id: 1,
    question: "What are the key differences between REST and GraphQL?",
    answer:
      "REST uses multiple endpoints with fixed data shapes (GET /users, GET /users/1/posts). GraphQL uses a single endpoint where clients specify exactly what data they need in a query. REST can over-fetch or under-fetch data; GraphQL solves this but adds complexity with query parsing, schema management, and N+1 query problems. REST is simpler for CRUD; GraphQL excels with complex, nested data and multiple client types.",
    category: "REST vs GraphQL",
  },
  {
    id: 2,
    question: "How do you handle versioning in a REST API?",
    answer:
      "Common strategies: URL path versioning (/v1/users, /v2/users) is explicit and easy to understand. Header versioning (Accept: application/vnd.api.v2+json) keeps URLs clean. Query parameter versioning (?version=2) is simple but less RESTful. The best approach depends on your consumers: public APIs benefit from URL versioning for clarity; internal APIs may use header versioning for flexibility.",
    category: "REST vs GraphQL",
  },
  {
    id: 3,
    question: "What is the N+1 query problem in GraphQL and how do you solve it?",
    answer:
      "The N+1 problem occurs when a query fetches a list of items (1 query) and then makes individual queries for each item's related data (N queries). In GraphQL, this happens because resolvers execute independently. Solutions include DataLoader (batches and caches database calls within a single request), query lookahead to optimize SQL joins, and using persistent query patterns.",
    category: "REST vs GraphQL",
  },
  // Microservices vs Monoliths
  {
    id: 4,
    question: "When should you choose microservices over a monolith?",
    answer:
      "Start with a monolith and extract microservices when you have clear domain boundaries, teams that need to deploy independently, services with different scaling requirements, or components needing different technology stacks. Microservices add significant operational complexity (networking, monitoring, distributed tracing, data consistency). Most startups should start monolithic and decompose after reaching product-market fit.",
    category: "Microservices vs Monoliths",
  },
  {
    id: 5,
    question: "How do microservices communicate with each other?",
    answer:
      "Synchronous: REST or gRPC for request-response patterns. gRPC is faster (Protocol Buffers, HTTP/2, streaming) and better for internal communication. Asynchronous: message queues (Kafka, RabbitMQ) for event-driven communication, decoupling services and handling traffic spikes. Choose synchronous when you need an immediate response; asynchronous when the caller does not need to wait or when building event-driven architectures.",
    category: "Microservices vs Monoliths",
  },
  {
    id: 6,
    question: "What is the saga pattern and when do you need it?",
    answer:
      "The saga pattern manages distributed transactions across microservices where traditional ACID transactions are impossible. Each service executes its local transaction and publishes an event. If any step fails, compensating transactions undo previous steps. Two types: choreography (services react to events, simpler but harder to track) and orchestration (a central coordinator manages the flow, easier to understand and debug).",
    category: "Microservices vs Monoliths",
  },
  {
    id: 7,
    question: "What is an API gateway and what problems does it solve?",
    answer:
      "An API gateway is a single entry point for client requests that routes to appropriate microservices. It handles cross-cutting concerns: authentication, rate limiting, request/response transformation, SSL termination, load balancing, circuit breaking, and API composition. Examples include Kong, AWS API Gateway, and NGINX. Without a gateway, clients must know about every service and handle these concerns individually.",
    category: "Microservices vs Monoliths",
  },
  // Authentication
  {
    id: 8,
    question: "Explain the difference between authentication and authorization.",
    answer:
      "Authentication verifies who you are (identity). Authorization determines what you can do (permissions). Authentication happens first: login with credentials, receive a token. Authorization happens on each request: check if the authenticated user has permission for the requested action. Common models: RBAC (role-based), ABAC (attribute-based), and ACL (access control lists).",
    category: "Authentication",
  },
  {
    id: 9,
    question: "How does OAuth 2.0 work and what are the common grant types?",
    answer:
      "OAuth 2.0 delegates authorization without sharing credentials. The Authorization Code grant (with PKCE) is the standard for web and mobile apps: the client redirects to the auth server, the user authenticates, receives an authorization code, and exchanges it for tokens. Client Credentials grant is for machine-to-machine. Implicit grant is deprecated. Always use PKCE with public clients to prevent code interception attacks.",
    category: "Authentication",
  },
  {
    id: 10,
    question: "What is a JWT, how is it structured, and what are the security considerations?",
    answer:
      "A JWT (JSON Web Token) has three Base64-encoded parts: header (algorithm, token type), payload (claims like user ID, expiration, roles), and signature (verifies integrity). JWTs are stateless (no server-side storage) but cannot be revoked until they expire. Security considerations: use short expiration times, store in httpOnly cookies (not localStorage), validate all claims, use RS256 over HS256 for distributed systems, and implement refresh token rotation.",
    category: "Authentication",
  },
  {
    id: 11,
    question: "Compare session-based authentication with token-based authentication.",
    answer:
      "Session-based: server stores session data, sends a session ID cookie. Easy to revoke (delete from store) but requires sticky sessions or shared storage (Redis) across servers. Token-based (JWT): stateless, no server storage, works across domains and services. Cannot be easily revoked and increases payload size. Use sessions for traditional web apps; tokens for SPAs, mobile apps, and microservices. Many systems use both: JWT for service-to-service and sessions for user-facing apps.",
    category: "Authentication",
  },
  // Caching
  {
    id: 12,
    question: "What are the common caching strategies and when do you use each?",
    answer:
      "Cache-aside (lazy loading): application checks cache first, loads from DB on miss, writes to cache. Write-through: writes to cache and DB simultaneously (strong consistency, slower writes). Write-behind (write-back): writes to cache immediately, asynchronously syncs to DB (fast writes, risk of data loss). Read-through: cache loads from DB on miss (simpler application code). Choose based on your consistency requirements and read/write ratio.",
    category: "Caching",
  },
  {
    id: 13,
    question: "What is cache invalidation and why is it considered hard?",
    answer:
      "Cache invalidation removes or updates stale cached data when the source data changes. It is hard because: you must track all cached copies across multiple layers (application, CDN, browser), race conditions can cause stale data, and invalidation at scale introduces latency. Strategies include TTL-based expiration, event-driven invalidation (publish an event when data changes), and versioned keys. The two hardest problems in CS: cache invalidation, naming things, and off-by-one errors.",
    category: "Caching",
  },
  {
    id: 14,
    question: "How does a CDN work and when should you use one?",
    answer:
      "A CDN (Content Delivery Network) caches content at edge servers geographically close to users, reducing latency and origin server load. CDNs handle static assets (images, CSS, JS), but modern CDNs also cache API responses and run edge compute (Cloudflare Workers, Lambda@Edge). Use a CDN when: you serve users globally, have high traffic, or need DDoS protection. Configure cache headers (Cache-Control, ETag) carefully to balance freshness and performance.",
    category: "Caching",
  },
  // Message Queues
  {
    id: 15,
    question: "What is a message queue and when should you use one?",
    answer:
      "A message queue decouples producers (senders) from consumers (receivers), enabling asynchronous processing. Use message queues for: background job processing (email sending, image resizing), smoothing traffic spikes (buffer requests during peak load), event-driven architectures, and cross-service communication in microservices. Message queues improve resilience (if a consumer is down, messages wait) and scalability (add more consumers to increase throughput).",
    category: "Message Queues",
  },
  {
    id: 16,
    question: "Compare Kafka and RabbitMQ. When would you choose each?",
    answer:
      "Kafka is a distributed log: messages are persisted, ordered within partitions, and can be replayed. It excels at high throughput, event streaming, and event sourcing. RabbitMQ is a traditional message broker: supports complex routing (exchanges, bindings), message acknowledgment, and priority queues. Choose Kafka for event streaming, log aggregation, and high-throughput scenarios. Choose RabbitMQ for task queues, complex routing, and when message ordering across queues is not critical.",
    category: "Message Queues",
  },
  {
    id: 17,
    question: "How do you ensure exactly-once message processing?",
    answer:
      "True exactly-once is extremely difficult in distributed systems. Practical approaches: at-least-once delivery with idempotent consumers (use idempotency keys to detect and skip duplicate processing), Kafka transactions for exactly-once within Kafka, and the outbox pattern (write events to an outbox table in the same DB transaction, then publish asynchronously). Design consumers to be idempotent: processing the same message twice should produce the same result.",
    category: "Message Queues",
  },
  // API Design
  {
    id: 18,
    question: "What are the best practices for designing a REST API?",
    answer:
      "Use nouns for resources (/users, /orders), HTTP methods for actions (GET, POST, PUT, PATCH, DELETE). Return appropriate status codes (201 Created, 404 Not Found, 422 Unprocessable Entity). Support pagination (cursor-based for large datasets), filtering, and sorting. Use consistent error response format. Version your API. Implement rate limiting and return rate limit headers. Document with OpenAPI/Swagger. Design for idempotency (PUT is idempotent, POST is not).",
    category: "API Design",
  },
  {
    id: 19,
    question: "How do you handle pagination in APIs with large datasets?",
    answer:
      "Offset-based (?page=3&limit=20): simple but slow for deep pages (database must skip rows) and inconsistent with concurrent inserts/deletes. Cursor-based (?cursor=abc123&limit=20): uses an opaque cursor (encoded ID or timestamp) for the next page. Consistent and performant regardless of page depth. Keyset pagination is similar but uses a visible column value. Use cursor-based for feeds and large datasets; offset-based only for small, static datasets.",
    category: "API Design",
  },
  {
    id: 20,
    question: "What is rate limiting and how do you implement it?",
    answer:
      "Rate limiting restricts the number of requests a client can make in a time window, protecting against abuse and ensuring fair resource usage. Algorithms: fixed window (simple, burst-prone), sliding window (smooth, more accurate), token bucket (allows controlled bursts), leaky bucket (constant rate). Implement with Redis (INCR with TTL for fixed window, sorted sets for sliding window). Return 429 Too Many Requests with Retry-After and rate limit headers (X-RateLimit-Remaining).",
    category: "API Design",
  },
];

const CATEGORIES = [
  "REST vs GraphQL",
  "Microservices vs Monoliths",
  "Authentication",
  "Caching",
  "Message Queues",
  "API Design",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BackendInterviewPage() {
  // JSON-LD ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Backend Engineering Interview Questions (2026)",
    description:
      "20 most-asked backend engineering interview questions covering APIs, microservices, authentication, caching, message queues, and API design.",
    numberOfItems: BACKEND_QUESTIONS.length,
    itemListElement: BACKEND_QUESTIONS.map((q) => ({
      "@type": "ListItem",
      position: q.id,
      name: q.question,
      url: `${BASE}/backend-interview#${q.category.toLowerCase().replace(/[\s/&]+/g, "-")}`,
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
              <li className="text-foreground font-medium">Backend Interview</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Backend Engineering Interview Questions for 2026
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Backend engineering interviews test your ability to design, build, and scale server-side systems.
              Beyond writing code, interviewers want to know that you can make architectural decisions about APIs,
              choose between microservices and monoliths, implement secure authentication, design effective caching
              strategies, and leverage message queues for reliability. This guide covers 20 essential questions
              with detailed answers that are frequently asked at top tech companies.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice Backend Questions Free &rarr;
              </Link>
              <Link
                href="/learn"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Browse All Topics
              </Link>
            </div>
          </header>

          {/* Quick stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-saffron">20</div>
              <div className="text-xs text-muted-foreground mt-1">Essential Questions</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-teal">6</div>
              <div className="text-xs text-muted-foreground mt-1">Topic Areas</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-gold">APIs</div>
              <div className="text-xs text-muted-foreground mt-1">REST, GraphQL, gRPC</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-indigo-400">Free</div>
              <div className="text-xs text-muted-foreground mt-1">Full Practice Access</div>
            </div>
          </section>

          {/* Why backend matters */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Why Backend Engineering Skills Matter in Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Backend engineering is the foundation of every software product. The APIs you design determine
                how clients interact with your system. The architecture you choose &mdash; monolith, microservices,
                or serverless &mdash; affects how your team ships features and how your system handles growth.
                The authentication and caching strategies you implement directly impact security and performance.
              </p>
              <p>
                Backend interview questions test your ability to make trade-offs under real-world constraints.
                There is rarely a single &quot;correct&quot; answer. Interviewers want to see that you understand
                the implications of your choices: why you would pick REST over GraphQL for a given use case,
                when to introduce a message queue, and how to handle authentication across a distributed system.
                The questions in this guide cover the topics most frequently tested at companies like Google,
                Amazon, Stripe, Uber, and fast-growing startups.
              </p>
            </div>
          </section>

          {/* Table of contents */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Jump to Topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => {
                const count = BACKEND_QUESTIONS.filter((q) => q.category === cat).length;
                return (
                  <a
                    key={cat}
                    href={`#${cat.toLowerCase().replace(/[\s/&]+/g, "-")}`}
                    className="text-sm text-muted-foreground hover:text-saffron transition-colors"
                  >
                    {cat} ({count})
                  </a>
                );
              })}
            </div>
          </section>

          {/* Questions by category */}
          {CATEGORIES.map((category) => {
            const questions = BACKEND_QUESTIONS.filter((q) => q.category === category);
            const catSlug = category.toLowerCase().replace(/[\s/&]+/g, "-");
            return (
              <section key={category} id={catSlug} className="mb-10">
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4">
                  {category} Questions
                </h2>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-border/30 bg-card/50"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{q.id}
                        </span>
                        <h3 className="text-base font-semibold text-foreground">
                          {q.question}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {q.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Tips section */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              How to Prepare for Backend Engineering Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                1. Build Real Systems
              </h3>
              <p>
                The best preparation is building real backend systems. Create a REST API with authentication,
                implement caching with Redis, set up a message queue for background processing, and deploy with
                Docker. When you have built these systems yourself, interview questions become descriptions of
                things you have already solved rather than abstract concepts you memorized.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                2. Understand Trade-offs Deeply
              </h3>
              <p>
                Backend interviews are fundamentally about trade-offs. REST vs. GraphQL, SQL vs. NoSQL,
                synchronous vs. asynchronous, consistency vs. availability &mdash; for every decision, be prepared
                to explain the pros, cons, and specific use cases. Avoid absolute statements like &quot;always
                use microservices&quot; or &quot;NoSQL is better than SQL.&quot; Interviewers want nuanced thinking.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                3. Know Your Framework Inside Out
              </h3>
              <p>
                Whether you use Spring Boot, Node.js/Express, Django, or Go, know your framework deeply.
                Understand its request lifecycle, middleware/filter chain, dependency injection, error handling,
                and testing patterns. Interviewers often ask framework-specific questions to gauge how much
                production experience you have versus surface-level knowledge.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                4. Study Distributed Systems Fundamentals
              </h3>
              <p>
                Backend engineering at scale is distributed systems engineering. Understand the CAP theorem,
                consensus protocols (Raft, Paxos), distributed transactions, eventual consistency, vector clocks,
                and leader election. You do not need to implement these from scratch, but you should understand
                how the tools you use (Kafka, Redis, PostgreSQL) implement these concepts under the hood.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                5. Practice Explaining Your Architecture
              </h3>
              <p>
                Many backend interviews include a design component where you draw and explain an architecture.
                Practice explaining your designs out loud: why you chose specific components, how data flows
                through the system, what happens when a component fails, and how you would handle 10x growth.
                Use Guru Sishya&apos;s Feynman mode to practice articulating your thought process clearly.
              </p>
            </div>
          </section>

          {/* Platform topics */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Related Topics on Guru Sishya
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { title: "Spring Boot", href: "/app/topic/spring-boot", desc: "Java backend framework and microservices" },
                { title: "Node.js", href: "/app/topic/nodejs", desc: "JavaScript runtime for server-side development" },
                { title: "Apache Kafka", href: "/app/topic/apache-kafka", desc: "Distributed event streaming platform" },
                { title: "System Design Interview", href: "/system-design-interview", desc: "Scalable architecture and design patterns" },
                { title: "Database Interview", href: "/database-interview", desc: "SQL, NoSQL, and database design" },
                { title: "Cloud & DevOps", href: "/cloud-devops-interview", desc: "AWS, Docker, Kubernetes, and CI/CD" },
              ].map((topic) => (
                <Link
                  key={topic.title}
                  href={topic.href}
                  className="group p-4 rounded-lg border border-border/30 hover:border-saffron/40 bg-card/50 hover:bg-card/80 transition-all"
                >
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-saffron transition-colors">
                    {topic.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{topic.desc}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 border-t border-border/30 text-center">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
              Ready to Ace Your Backend Engineering Interview?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Practice with interactive lessons, quizzes, and a Feynman practice mode to explain
              concepts out loud &mdash; completely free, no signup required.
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
                System Design Interview Guide
              </Link>
            </div>
          </section>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="Guru Sishya" className="size-8 rounded-lg" width={32} height={32} />
            <span className="font-heading text-lg font-bold text-saffron tracking-wider">GURU SISHYA</span>
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Topics</Link>
            <Link href="/dsa-interview-questions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">DSA Questions</Link>
            <Link href="/system-design-interview" className="text-sm text-muted-foreground hover:text-foreground transition-colors">System Design</Link>
            <Link href="/backend-interview" className="text-sm text-foreground font-medium">Backend</Link>
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
            <span className="text-sm text-muted-foreground">Guru Sishya &mdash; Free Interview Prep for Engineers</span>
          </div>
          <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Guru Sishya. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
