import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Database Interview Questions (2026) — SQL, NoSQL, System Design Guide",
  description:
    "20 most-asked database interview questions with answers. Covers SQL (JOINs, indexes, transactions, ACID), NoSQL (document, key-value, graph), database design, normalization, sharding, and query optimization.",
  keywords: [
    "database interview questions",
    "SQL interview questions",
    "NoSQL interview questions",
    "database design interview",
    "SQL vs NoSQL",
    "database sharding",
    "query optimization",
    "ACID properties",
    "database normalization",
    "indexing strategies",
  ],
  alternates: { canonical: `${BASE}/database-interview` },
  openGraph: {
    title: "Database Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential database interview questions covering SQL, NoSQL, database design, sharding, and query optimization. Free lessons and practice.",
    url: `${BASE}/database-interview`,
    type: "website",
    siteName: "Guru Sishya",
    images: [{ url: `${BASE}/api/og`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Database Interview Questions (2026) | Guru Sishya",
    description:
      "Master 20 essential database questions covering SQL, NoSQL, design, sharding, and optimization.",
    images: [`${BASE}/api/og`],
  },
};

// ── Interview questions ──────────────────────────────────────────────────────

interface DatabaseQuestion {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const DB_QUESTIONS: DatabaseQuestion[] = [
  // SQL Fundamentals
  {
    id: 1,
    question: "Explain the different types of SQL JOINs.",
    answer:
      "INNER JOIN returns rows with matching values in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right (NULLs where no match). RIGHT JOIN is the reverse. FULL OUTER JOIN returns all rows from both tables with NULLs where no match exists. CROSS JOIN returns the Cartesian product of both tables. Self-joins join a table with itself.",
    category: "SQL Fundamentals",
  },
  {
    id: 2,
    question: "What are indexes and how do they improve query performance?",
    answer:
      "Indexes are data structures (typically B-trees or hash tables) that allow the database to find rows without scanning the entire table. They speed up SELECT queries and WHERE clauses but slow down INSERT, UPDATE, and DELETE operations because the index must also be updated. Common types include single-column, composite, unique, partial, and covering indexes.",
    category: "SQL Fundamentals",
  },
  {
    id: 3,
    question: "Explain ACID properties in database transactions.",
    answer:
      "Atomicity: all operations in a transaction succeed or all fail. Consistency: a transaction moves the database from one valid state to another. Isolation: concurrent transactions do not interfere with each other. Durability: committed transactions persist even after system failures. ACID guarantees are implemented through write-ahead logging, locking mechanisms, and multi-version concurrency control (MVCC).",
    category: "SQL Fundamentals",
  },
  {
    id: 4,
    question: "What are the different transaction isolation levels?",
    answer:
      "Read Uncommitted: allows dirty reads. Read Committed: prevents dirty reads but allows non-repeatable reads. Repeatable Read: prevents dirty and non-repeatable reads but allows phantom reads. Serializable: prevents all anomalies but has the lowest concurrency. Higher isolation levels provide stronger guarantees but reduce throughput. Most databases default to Read Committed or Repeatable Read.",
    category: "SQL Fundamentals",
  },
  {
    id: 5,
    question: "What is the difference between a clustered and a non-clustered index?",
    answer:
      "A clustered index determines the physical order of data in the table. There can be only one per table (usually the primary key). A non-clustered index is a separate structure with pointers to the actual data rows. A table can have multiple non-clustered indexes. Clustered indexes are faster for range queries; non-clustered indexes are better for point lookups on non-primary columns.",
    category: "SQL Fundamentals",
  },
  // NoSQL Types
  {
    id: 6,
    question: "What are the main types of NoSQL databases?",
    answer:
      "Document stores (MongoDB, CouchDB) store semi-structured JSON/BSON documents. Key-value stores (Redis, DynamoDB) store data as key-value pairs with fast lookups. Wide-column stores (Cassandra, HBase) store data in column families, ideal for time-series data. Graph databases (Neo4j, Amazon Neptune) store nodes and relationships, optimized for traversal queries.",
    category: "NoSQL Types",
  },
  {
    id: 7,
    question: "When would you choose a document database over a relational database?",
    answer:
      "Choose document databases when: your data has a variable or evolving schema, you need to store nested/hierarchical data naturally, you want to avoid complex joins, you need horizontal scalability, or your read patterns align with document boundaries. Avoid document databases when you need complex transactions across documents, strong referential integrity, or heavy ad-hoc querying with joins.",
    category: "NoSQL Types",
  },
  {
    id: 8,
    question: "How does a key-value store like Redis achieve high performance?",
    answer:
      "Redis stores all data in memory (RAM), providing sub-millisecond latency. It uses a single-threaded event loop (avoiding lock overhead), efficient data structures (hash tables, skip lists, compressed lists), and optional persistence via RDB snapshots or AOF logging. Redis Cluster provides horizontal scaling through hash-slot-based sharding across multiple nodes.",
    category: "NoSQL Types",
  },
  {
    id: 9,
    question: "What is a graph database and when should you use one?",
    answer:
      "Graph databases store data as nodes (entities) and edges (relationships) with properties on both. They excel at traversing relationships: social networks, recommendation engines, fraud detection, and knowledge graphs. Unlike relational databases where joins become expensive at depth, graph databases maintain constant-time traversal regardless of dataset size.",
    category: "NoSQL Types",
  },
  // Database Design
  {
    id: 10,
    question: "Explain database normalization and its normal forms.",
    answer:
      "Normalization reduces data redundancy and improves integrity. 1NF: atomic values, no repeating groups. 2NF: 1NF plus no partial dependencies on composite keys. 3NF: 2NF plus no transitive dependencies. BCNF: every determinant is a candidate key. Higher forms (4NF, 5NF) address multi-valued and join dependencies. In practice, most systems normalize to 3NF or BCNF.",
    category: "Database Design",
  },
  {
    id: 11,
    question: "When and why would you denormalize a database?",
    answer:
      "Denormalization introduces controlled redundancy to improve read performance. Use it when: read-heavy workloads need faster queries, complex joins are too expensive, you are building data warehouses or analytics systems, or caching layers are insufficient. Common techniques include adding computed columns, materialized views, and duplicating data across tables. The trade-off is increased storage and more complex write logic.",
    category: "Database Design",
  },
  {
    id: 12,
    question: "What is database sharding and what are the common strategies?",
    answer:
      "Sharding horizontally partitions data across multiple database servers. Strategies include: range-based (partition by date or ID range), hash-based (hash the shard key to distribute evenly), directory-based (lookup table maps keys to shards), and geographic (partition by region). Challenges include cross-shard queries, rebalancing, and maintaining referential integrity. Choose shard keys carefully to avoid hotspots.",
    category: "Database Design",
  },
  {
    id: 13,
    question: "How do you design a schema for a many-to-many relationship?",
    answer:
      "In relational databases, use a junction (bridge) table with foreign keys to both related tables. The junction table can also hold relationship attributes (e.g., enrollment date in a student-course relationship). Add composite or individual indexes based on query patterns. In document databases, you can embed references or use denormalized arrays, depending on cardinality and access patterns.",
    category: "Database Design",
  },
  // Performance
  {
    id: 14,
    question: "How do you optimize a slow SQL query?",
    answer:
      "Start with EXPLAIN/EXPLAIN ANALYZE to understand the query plan. Common optimizations: add missing indexes, avoid SELECT *, rewrite subqueries as JOINs, use covering indexes, partition large tables, avoid functions on indexed columns in WHERE clauses, use query hints when needed, and consider materialized views for complex aggregations. Always measure before and after.",
    category: "Performance",
  },
  {
    id: 15,
    question: "What is a query execution plan and how do you read it?",
    answer:
      "A query execution plan shows how the database engine processes a query: which indexes it uses, join algorithms (nested loop, hash join, merge join), table scan vs. index scan, estimated vs. actual row counts, and cost estimates. Look for sequential scans on large tables (missing indexes), high row estimates vs. actual (stale statistics), and nested loops with large tables.",
    category: "Performance",
  },
  {
    id: 16,
    question: "What are the different indexing strategies and when do you use each?",
    answer:
      "B-tree indexes: general-purpose, good for range and equality queries (default in most RDBMS). Hash indexes: fast equality lookups but no range support. GIN indexes: full-text search and array/JSON columns. GiST indexes: geometric and spatial data. Partial indexes: index a subset of rows. Composite indexes: multiple columns (column order matters for query matching). Covering indexes: include all query columns to avoid table lookups.",
    category: "Performance",
  },
  {
    id: 17,
    question: "How does connection pooling work and why is it important?",
    answer:
      "Connection pooling maintains a cache of database connections that are reused across requests instead of creating new connections for each query. Creating a connection is expensive (TCP handshake, authentication, memory allocation). Pools like PgBouncer (PostgreSQL) or HikariCP (Java) manage connection lifecycle, limiting max connections and queuing excess requests. This reduces latency and prevents overwhelming the database.",
    category: "Performance",
  },
  // SQL vs NoSQL
  {
    id: 18,
    question: "When should you use SQL vs. NoSQL?",
    answer:
      "Use SQL when: you need ACID transactions, complex queries with joins, strong data consistency, or a well-defined schema. Use NoSQL when: you need horizontal scalability, flexible schemas, high write throughput, or your data model fits naturally (documents, key-value, graph). Many modern systems use both: SQL for transactional data and NoSQL for caching, session storage, or analytics.",
    category: "SQL vs NoSQL",
  },
  {
    id: 19,
    question: "What is the CAP theorem and how does it apply to databases?",
    answer:
      "The CAP theorem states that a distributed system can guarantee at most two of three properties: Consistency (every read returns the latest write), Availability (every request gets a response), and Partition tolerance (the system works despite network failures). Since network partitions are inevitable, the real choice is between CP (strong consistency, e.g., PostgreSQL, MongoDB) and AP (high availability, e.g., Cassandra, DynamoDB).",
    category: "SQL vs NoSQL",
  },
  {
    id: 20,
    question: "What is eventual consistency and when is it acceptable?",
    answer:
      "Eventual consistency means all replicas will converge to the same value given enough time without new writes. It is acceptable for: social media feeds, product view counts, recommendation systems, DNS, and caching layers &mdash; anywhere stale reads are tolerable for seconds. It is not acceptable for: financial transactions, inventory counts during checkout, or any scenario where stale data causes incorrect decisions.",
    category: "SQL vs NoSQL",
  },
];

const CATEGORIES = [
  "SQL Fundamentals",
  "NoSQL Types",
  "Database Design",
  "Performance",
  "SQL vs NoSQL",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DatabaseInterviewPage() {
  // JSON-LD ItemList schema
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Database Interview Questions (2026)",
    description:
      "20 most-asked database interview questions covering SQL, NoSQL, database design, performance optimization, and SQL vs NoSQL comparisons.",
    numberOfItems: DB_QUESTIONS.length,
    itemListElement: DB_QUESTIONS.map((q) => ({
      "@type": "ListItem",
      position: q.id,
      name: q.question,
      url: `${BASE}/database-interview#${q.category.toLowerCase().replace(/[\s/&]+/g, "-")}`,
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
              <li className="text-foreground font-medium">Database Interview</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Database Interview Questions for 2026
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Databases are the backbone of every software system. Whether you are interviewing for a backend
              engineer, data engineer, or full-stack developer position, you will face questions about SQL queries,
              NoSQL data models, database design, indexing strategies, and performance optimization. This guide
              covers 20 essential questions that interviewers ask at companies like Google, Amazon, Meta, Stripe,
              and fast-growing startups.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice Database Questions Free &rarr;
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
              <div className="text-2xl font-bold text-teal">5</div>
              <div className="text-xs text-muted-foreground mt-1">Topic Areas</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-gold">SQL+NoSQL</div>
              <div className="text-xs text-muted-foreground mt-1">Both Covered</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-indigo-400">Free</div>
              <div className="text-xs text-muted-foreground mt-1">Full Practice Access</div>
            </div>
          </section>

          {/* Why databases matter */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Why Database Knowledge Matters in Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                Every application reads and writes data. Poor database design leads to slow queries, data
                inconsistencies, and systems that cannot scale. Interviewers test database knowledge to assess
                whether you can design data models that support your application&apos;s access patterns, write
                efficient queries, and make informed decisions about trade-offs between consistency and availability.
              </p>
              <p>
                Database questions appear in multiple interview rounds. In coding interviews, you may write SQL
                queries or design data models. In system design rounds, you decide between SQL and NoSQL, choose
                sharding strategies, and design for high availability. Even behavioral rounds may include questions
                about database incidents you have handled. A strong foundation in databases demonstrates engineering
                maturity that interviewers value highly.
              </p>
            </div>
          </section>

          {/* Table of contents */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Jump to Topic
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const count = DB_QUESTIONS.filter((q) => q.category === cat).length;
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
            const questions = DB_QUESTIONS.filter((q) => q.category === category);
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
              How to Prepare for Database Interviews
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <h3 className="text-lg font-heading font-semibold text-foreground">
                1. Master SQL Query Writing
              </h3>
              <p>
                Practice writing complex queries with JOINs, subqueries, window functions, CTEs, and GROUP BY
                clauses. Use a real database (PostgreSQL or MySQL) and work with sample datasets. Many interviews
                include a live SQL coding round where you write queries on a whiteboard or shared editor. Speed
                and accuracy matter.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                2. Understand Database Internals
              </h3>
              <p>
                Know how B-tree indexes work, how the query optimizer chooses execution plans, and how MVCC
                enables concurrent transactions. Understanding internals helps you explain <em>why</em> a query
                is slow and propose the right fix, rather than guessing. Read the documentation for your
                database of choice (PostgreSQL docs are particularly excellent).
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                3. Practice Data Modeling
              </h3>
              <p>
                Take real applications (e-commerce, social media, ride-sharing) and design their database schemas.
                Start with an entity-relationship diagram, then translate it to tables with appropriate data types,
                constraints, and indexes. Consider access patterns: what queries will run most frequently? Design
                your schema to make those queries efficient.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                4. Learn When to Use NoSQL
              </h3>
              <p>
                Do not default to &quot;always use PostgreSQL&quot; or &quot;always use MongoDB.&quot; Understand
                the strengths and weaknesses of each database type. Practice designing systems that use multiple
                databases: PostgreSQL for transactional data, Redis for caching and sessions, Elasticsearch for
                search, and Cassandra for time-series data. This polyglot persistence approach is what real
                systems use.
              </p>

              <h3 className="text-lg font-heading font-semibold text-foreground">
                5. Study Real-World Scaling Stories
              </h3>
              <p>
                Read engineering blog posts from companies like Uber, Instagram, Slack, and Pinterest about how
                they scaled their databases. Common themes include migrating from single-node to sharded clusters,
                switching between database technologies, and optimizing critical queries. These stories provide
                concrete examples you can reference in interviews.
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
                { title: "RDBMS & SQL", href: "/app/topic/rdbms-sql", desc: "Relational databases, SQL queries, and joins" },
                { title: "NoSQL Databases", href: "/app/topic/nosql-databases", desc: "Document, key-value, graph, and column stores" },
                { title: "System Design Interview", href: "/system-design-interview", desc: "Scalable architecture and design patterns" },
                { title: "DSA Interview Questions", href: "/dsa-interview-questions", desc: "50 essential coding interview questions" },
                { title: "Backend Engineering", href: "/backend-interview", desc: "APIs, microservices, and architecture" },
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
              Ready to Ace Your Database Interview?
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
                href="/dsa-interview-questions"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                DSA Interview Questions
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
            <Link href="/database-interview" className="text-sm text-foreground font-medium">Databases</Link>
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
