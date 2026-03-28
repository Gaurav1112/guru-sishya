import type { Metadata } from "next";
import Link from "next/link";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE = "https://www.guru-sishya.in";

export const metadata: Metadata = {
  title:
    "Behavioral Interview Questions & STAR Method Guide (2026) | Guru Sishya",
  description:
    "Master behavioral interviews with the STAR method. 50 real STAR stories, company-specific questions for Amazon, Google, Meta, and proven frameworks to ace your behavioral round.",
  keywords: [
    "behavioral interview questions",
    "STAR method interview",
    "behavioral interview prep",
    "Amazon leadership principles",
    "Google behavioral interview",
    "Meta behavioral interview",
    "tell me about a time",
    "STAR stories examples",
    "conflict resolution interview",
    "leadership interview questions",
  ],
  alternates: { canonical: `${BASE}/behavioral-interview` },
  openGraph: {
    title: "Behavioral Interview Questions & STAR Method Guide (2026) | Guru Sishya",
    description:
      "50 real STAR stories with company tags, leadership principles, and follow-up questions. Free behavioral interview prep for Google, Amazon, Meta.",
    url: `${BASE}/behavioral-interview`,
    type: "article",
    siteName: "Guru Sishya",
  },
};

// ── Types for star stories ──────────────────────────────────────────────────

interface StarStory {
  id: number;
  question: string;
  category: string;
  companies: string[];
  leadershipPrinciple: string;
  seniority: string;
  star: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  tips: string[];
  followUps: string[];
}

// ── Load star stories from disk at build time ───────────────────────────────

function loadStarStories(): StarStory[] {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "content",
      "star-stories.json",
    );
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as StarStory[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BehavioralInterviewPage() {
  const allStories = loadStarStories();
  const previewStories = allStories.slice(0, 50);

  // Group by category
  const categories = new Map<string, StarStory[]>();
  for (const s of previewStories) {
    if (!categories.has(s.category)) categories.set(s.category, []);
    categories.get(s.category)!.push(s);
  }

  const categoryOrder = Array.from(categories.keys());

  // Company stats
  const companySet = new Set<string>();
  for (const s of previewStories) {
    for (const c of s.companies) companySet.add(c);
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
              <li className="text-foreground font-medium">Behavioral Interview</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Behavioral Interview Questions &amp; the STAR Method
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed mb-6">
              Behavioral interviews determine whether you get the offer at companies like Amazon, Google, and Meta.
              Technical skills get you to the final round, but behavioral skills close the deal. This guide gives
              you 50 real STAR stories across 10 categories, a proven framework for structuring your answers, and
              company-specific tips for Amazon Leadership Principles, Google Googliness, and Meta core values.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/app/topics"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-6 bg-saffron hover:bg-saffron/90 text-white transition-colors"
              >
                Practice Behavioral Questions Free &rarr;
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
              <div className="text-2xl font-bold text-saffron">{previewStories.length}</div>
              <div className="text-xs text-muted-foreground mt-1">STAR Stories</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-teal">{categoryOrder.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Categories</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-gold">{companySet.size}+</div>
              <div className="text-xs text-muted-foreground mt-1">Companies Covered</div>
            </div>
            <div className="p-4 rounded-xl border border-border/30 bg-card/50 text-center">
              <div className="text-2xl font-bold text-indigo-400">Free</div>
              <div className="text-xs text-muted-foreground mt-1">Full Access</div>
            </div>
          </section>

          {/* What is behavioral interview */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              What Is a Behavioral Interview?
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
              <p>
                A behavioral interview evaluates how you have handled real workplace situations in the past. The
                premise is simple: <strong>past behavior predicts future behavior</strong>. Instead of hypothetical
                questions (&quot;What would you do if...?&quot;), you will hear questions like &quot;Tell me about a
                time when...&quot; that require specific, concrete examples from your experience.
              </p>
              <p>
                At Amazon, the behavioral round is structured around 16 Leadership Principles and carries equal
                weight to the technical rounds. At Google, &quot;Googliness and Leadership&quot; is one of four
                evaluation criteria. At Meta, &quot;culture fit&quot; interviews assess collaboration, communication,
                and impact. Failing the behavioral round will result in a rejection even if your technical performance
                is flawless.
              </p>
              <p>
                The good news: behavioral interviews are highly predictable. The same 50-60 questions appear
                repeatedly across companies. If you prepare structured STAR stories for each category (conflict,
                leadership, failure, ambiguity, etc.), you can reuse and adapt them for any company.
              </p>
            </div>
          </section>

          {/* STAR method explained */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              The STAR Method Explained
            </h2>
            <p className="text-muted-foreground mb-4">
              STAR stands for <strong className="text-foreground">Situation</strong>, <strong className="text-foreground">Task</strong>,
              <strong className="text-foreground"> Action</strong>, and <strong className="text-foreground">Result</strong>.
              Every behavioral answer should follow this structure.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  letter: "S",
                  title: "Situation",
                  color: "bg-saffron/20 text-saffron border-saffron/30",
                  description:
                    "Set the scene. Provide specific context: company, team, project, timeline, and the challenge you faced. Be concise but vivid. Include quantifiable details (team size, revenue impact, deadline pressure).",
                },
                {
                  letter: "T",
                  title: "Task",
                  color: "bg-teal/20 text-teal border-teal/30",
                  description:
                    "Define YOUR specific responsibility. What was your role? What were you accountable for? Clarify the stakes: What would happen if the problem was not solved? Interviewers want to see ownership.",
                },
                {
                  letter: "A",
                  title: "Action",
                  color: "bg-gold/20 text-gold border-gold/30",
                  description:
                    "Describe the specific steps YOU took. Use 'I' not 'we'. This is the longest section (50-60% of your answer). Detail your thought process, the alternatives you considered, and why you chose your approach.",
                },
                {
                  letter: "R",
                  title: "Result",
                  color: "bg-indigo-400/20 text-indigo-400 border-indigo-400/30",
                  description:
                    "Quantify the outcome. Use numbers: revenue impact, time saved, user growth, latency improvement. Also mention what you learned and what you would do differently. End on a positive note.",
                },
              ].map((item) => (
                <div
                  key={item.letter}
                  className={`p-5 rounded-xl border ${item.color}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="size-10 rounded-full border-2 border-current font-bold flex items-center justify-center text-lg">
                      {item.letter}
                    </span>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed opacity-80">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Common mistakes */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              5 Common Behavioral Interview Mistakes
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3">
              <p>
                <strong className="text-foreground">1. Being too vague.</strong> Saying &quot;I improved the system&quot;
                is worthless. Say &quot;I reduced API latency from 890ms to 120ms by implementing Redis caching, which
                increased user retention by 12%.&quot; Specificity is credibility.
              </p>
              <p>
                <strong className="text-foreground">2. Using &quot;we&quot; instead of &quot;I&quot;.</strong> Interviewers
                want to know what YOU did. It is fine to acknowledge the team, but the focus should be on your individual
                contributions and decisions.
              </p>
              <p>
                <strong className="text-foreground">3. Not preparing enough stories.</strong> You need at least 8-10
                stories that cover different categories. Each story can often be adapted for multiple questions, but you
                should never use the same story twice in one interview loop.
              </p>
              <p>
                <strong className="text-foreground">4. Skipping the result.</strong> Many candidates tell a great story
                but forget to share the outcome. Always end with quantifiable results and what you learned.
              </p>
              <p>
                <strong className="text-foreground">5. Not practicing out loud.</strong> Writing your stories is step one.
                Saying them out loud is step two. Your delivery should be natural, confident, and under 3 minutes per
                answer. Practice with Guru Sishya&apos;s Feynman mode or record yourself.
              </p>
            </div>
          </section>

          {/* Table of contents for categories */}
          <section className="mb-10 p-6 rounded-xl border border-border/30 bg-card/50">
            <h2 className="text-lg font-heading font-semibold text-foreground mb-3">
              Question Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categoryOrder.map((cat) => (
                <a
                  key={cat}
                  href={`#${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-muted-foreground hover:text-saffron transition-colors"
                >
                  {cat} ({categories.get(cat)!.length})
                </a>
              ))}
            </div>
          </section>

          {/* Stories by category */}
          {categoryOrder.map((cat) => {
            const stories = categories.get(cat)!;
            const catSlug = cat.toLowerCase().replace(/\s+/g, "-");
            return (
              <section key={cat} id={catSlug} className="mb-10">
                <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground mb-4">
                  {cat} Questions
                </h2>
                <div className="space-y-4">
                  {stories.map((s) => (
                    <div
                      key={s.id}
                      className="p-5 rounded-xl border border-border/30 bg-card/50"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-mono text-muted-foreground mt-0.5">
                          #{s.id}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground mb-2">
                            {s.question}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-saffron/10 text-saffron border border-saffron/20">
                              {s.leadershipPrinciple}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20">
                              {s.seniority}
                            </span>
                            {s.companies.map((c) => (
                              <span
                                key={c}
                                className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50"
                              >
                                {c}
                              </span>
                            ))}
                          </div>

                          {/* STAR preview */}
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                              <strong className="text-saffron">S:</strong>{" "}
                              {s.star.situation.length > 200
                                ? s.star.situation.slice(0, 200) + "..."
                                : s.star.situation}
                            </p>
                            <p>
                              <strong className="text-teal">T:</strong>{" "}
                              {s.star.task.length > 150
                                ? s.star.task.slice(0, 150) + "..."
                                : s.star.task}
                            </p>
                          </div>

                          {/* Tips */}
                          {s.tips.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/20">
                              <p className="text-xs font-medium text-foreground mb-1">
                                Pro Tips:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {s.tips.slice(0, 2).map((tip, i) => (
                                  <li key={i} className="flex items-start gap-1.5">
                                    <span className="text-gold mt-0.5 shrink-0">&#8226;</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}

          {/* Company-specific advice */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Company-Specific Behavioral Interview Tips
            </h2>
            <div className="space-y-4">
              {[
                {
                  company: "Amazon",
                  color: "border-gold/30",
                  advice:
                    "Amazon's behavioral interviews are structured around 16 Leadership Principles (LPs). Each interviewer is assigned 2-3 LPs and will probe deep into specific stories. Prepare at least 2 stories per LP. The most important ones for engineers: Ownership, Dive Deep, Bias for Action, Deliver Results, and Earn Trust. Amazon interviewers use the STAR method explicitly and will redirect you if your answer is not structured.",
                },
                {
                  company: "Google",
                  color: "border-teal/30",
                  advice:
                    "Google evaluates 'Googliness and Leadership' which includes collaboration, handling ambiguity, and driving impact beyond your immediate scope. Focus on stories that show you navigating ambiguity, working across teams, and having a positive impact on team culture. Google values intellectual humility: show that you can admit mistakes and learn from them.",
                },
                {
                  company: "Meta",
                  color: "border-saffron/30",
                  advice:
                    "Meta's behavioral interviews focus on 'Move Fast,' 'Be Bold,' 'Focus on Long-Term Impact,' and 'Build Social Value.' They value engineers who take initiative, ship quickly, and iterate based on data. Prepare stories about making decisions with incomplete information, shipping features under tight deadlines, and measuring impact with metrics.",
                },
                {
                  company: "Microsoft",
                  color: "border-indigo-400/30",
                  advice:
                    "Microsoft's 'As Appropriate' (AA) interview with a senior leader focuses heavily on behavioral questions. They assess growth mindset, collaboration, and customer empathy. Prepare stories about learning from failure, helping colleagues grow, and making decisions that prioritized customer outcomes over engineering elegance.",
                },
              ].map((item) => (
                <div
                  key={item.company}
                  className={`p-5 rounded-xl border ${item.color} bg-card/50`}
                >
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {item.company}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.advice}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Preparation checklist */}
          <section className="mb-10">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">
              Your Behavioral Interview Preparation Checklist
            </h2>
            <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Prepare 8-10 STAR stories covering: conflict, leadership, failure, ambiguity, innovation, teamwork, deadline pressure, and impact</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Include quantifiable results in every story (revenue, latency, user metrics, time saved)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Map your stories to your target company&apos;s values/leadership principles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Practice each story out loud until you can deliver it naturally in 2-3 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Prepare for follow-up questions: &quot;What would you do differently?&quot; &quot;What did you learn?&quot;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Have stories from different contexts: large company, startup, personal project, open source</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-saffron mt-0.5 shrink-0">&#9744;</span>
                  <span>Record yourself and review: eliminate filler words, ensure clarity, check timing</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CTA */}
          <section className="py-10 border-t border-border/30 text-center">
            <h2 className="text-2xl font-heading font-semibold text-foreground mb-3">
              Ace Your Behavioral Interview
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Practice {allStories.length}+ STAR stories with company tags, follow-up questions, and
              Feynman practice mode &mdash; all free, no signup required.
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

          {/* JSON-LD: Article schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline:
                  "Behavioral Interview Questions & STAR Method Guide (2026)",
                description:
                  "Master behavioral interviews with the STAR method. 50 real STAR stories, company-specific questions, and proven frameworks.",
                author: {
                  "@type": "Organization",
                  name: "Guru Sishya",
                  url: BASE,
                },
                publisher: {
                  "@type": "Organization",
                  name: "Guru Sishya",
                  url: BASE,
                  logo: {
                    "@type": "ImageObject",
                    url: `${BASE}/logo-mark.png`,
                  },
                },
                datePublished: "2026-03-01",
                dateModified: "2026-03-28",
                mainEntityOfPage: `${BASE}/behavioral-interview`,
                inLanguage: "en",
                isAccessibleForFree: true,
                about: [
                  { "@type": "Thing", name: "Behavioral Interview" },
                  { "@type": "Thing", name: "STAR Method" },
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
            <Link href="/behavioral-interview" className="text-sm text-foreground font-medium">Behavioral</Link>
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
