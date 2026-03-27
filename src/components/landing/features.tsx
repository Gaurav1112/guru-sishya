"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BORDER_COLORS = [
  "border-t-saffron",
  "border-t-teal",
  "border-t-indigo",
  "border-t-gold",
  "border-t-saffron",
  "border-t-teal",
];

const features = [
  {
    title: "20-Hour Pareto Plan",
    description:
      "A focused plan targeting the 20% that drives 80% of results. Ready instantly for all 53 built-in topics.",
    icon: "📋",
  },
  {
    title: "Cheat Sheet",
    description:
      "Visual 1-2 page summary with diagrams and code examples. Review an entire topic in 5 minutes.",
    icon: "📄",
  },
  {
    title: "Quiz Me Till I Break",
    description:
      "1400+ pre-built questions with adaptive difficulty. Instant grading, no AI key required.",
    icon: "🧠",
  },
  {
    title: "Learning Ladder",
    description:
      "5-level progression from Novice to Expert with clear milestones for every topic.",
    icon: "🪜",
  },
  {
    title: "Resource Finder",
    description:
      "Curated list of the best books, courses, and videos for each topic.",
    icon: "🔍",
  },
  {
    title: "Feynman Technique",
    description:
      "Interactive Socratic chat. Explain back until you truly understand.",
    icon: "💬",
  },
];

const COMPARISON = [
  {
    feature: "Price",
    gs: "₹149/mo",
    lc: "₹2,917/mo",
    ae: "₹1,660/mo",
    nc: "₹991/mo",
    gsHighlight: true,
  },
  {
    feature: "Interview Questions",
    gs: "1400+ with answers",
    lc: "2800+ (no answers)",
    ae: "160",
    nc: "150",
    gsHighlight: true,
  },
  {
    feature: "System Design",
    gs: "32 topics",
    lc: "Premium only",
    ae: "Included",
    nc: "Partial",
    gsHighlight: false,
  },
  {
    feature: "Behavioral (STAR)",
    gs: "58 questions",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
  {
    feature: "Works Offline",
    gs: "Yes",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
  {
    feature: "Spaced Repetition",
    gs: "Built-in",
    lc: "No",
    ae: "No",
    nc: "No",
    gsHighlight: true,
  },
];

function CheckCell({ value, highlight }: { value: string; highlight: boolean }) {
  const isYes = value === "Yes" || value === "Built-in" || value === "Included";
  const isNo = value === "No" || value === "Premium only" || value === "Partial";
  return (
    <td className="px-4 py-3 text-sm text-center">
      {isYes ? (
        <span className="inline-flex items-center gap-1 text-teal font-medium">
          <svg aria-hidden="true" role="img" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {value}
        </span>
      ) : isNo ? (
        <span className="text-muted-foreground/50">{value}</span>
      ) : (
        <span className="text-muted-foreground">{value}</span>
      )}
    </td>
  );
}

export function Features() {
  return (
    <>
      <section id="features" className="px-6 py-20">
        <h2 className="mb-4 text-center font-heading text-3xl font-bold">
          65 Interview Topics &amp; 1400+ Curated Questions
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Everything you need to go from beginner to interview-ready. All content
          is pre-generated and works offline — no API key required, no credit card needed.
        </p>
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card
                className={`h-full border-border/50 border-t-2 ${BORDER_COLORS[i]} bg-surface hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}
              >
                <CardHeader>
                  <div className="mb-2 text-3xl">{f.icon}</div>
                  <CardTitle className="font-heading text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="px-6 py-20 bg-gradient-to-b from-transparent via-surface/20 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-3xl font-bold mb-3">
            Why Guru Sishya? See How We Compare
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            More content, better answers, unique features — at a fraction of the cost
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl overflow-x-auto rounded-2xl border border-border/60"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-surface">
                <th scope="col" className="px-4 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Feature
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-bold text-saffron bg-saffron/5">
                  Guru Sishya
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">
                  LeetCode Premium
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">
                  AlgoExpert
                </th>
                <th scope="col" className="px-4 py-4 text-center text-sm font-semibold text-muted-foreground">
                  NeetCode Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr
                  key={row.feature}
                  className={`border-b border-border/40 last:border-0 ${i % 2 === 0 ? "bg-background" : "bg-surface/30"}`}
                >
                  <td className="px-4 py-3 text-sm font-medium">{row.feature}</td>
                  <td className={`px-4 py-3 text-sm text-center font-semibold bg-saffron/5 ${row.gsHighlight ? "text-saffron" : "text-foreground"}`}>
                    {row.gs}
                  </td>
                  <CheckCell value={row.lc} highlight={false} />
                  <CheckCell value={row.ae} highlight={false} />
                  <CheckCell value={row.nc} highlight={false} />
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-4 text-center text-xs text-muted-foreground/50"
        >
          Prices approximate as of March 2026. LeetCode, AlgoExpert, and NeetCode are independent products.
        </motion.p>
      </section>
    </>
  );
}
