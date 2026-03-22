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
  { title: "20-Hour Pareto Plan", description: "A focused plan targeting the 20% that drives 80% of results. Ready instantly for 66 built-in topics.", icon: "📋" },
  { title: "Cheat Sheet Generator", description: "Visual 1-2 page summary with diagrams and code examples. Review in 5 minutes.", icon: "📄" },
  { title: "Quiz Me Till I Break", description: "Adaptive quizzes from a pre-built question bank that find your ceiling with instant grading.", icon: "🧠" },
  { title: "Learning Ladder", description: "5-level progression from Novice to Expert with clear milestones.", icon: "🪜" },
  { title: "Resource Finder", description: "Curated list of the best books, courses, and videos for each topic.", icon: "🔍" },
  { title: "Feynman Technique", description: "Interactive Socratic chat. Explain back until you truly understand.", icon: "💬" },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-20">
      <h2 className="mb-12 text-center font-heading text-3xl font-bold">6 Proven Learning Methods, One App</h2>
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
            <Card className={`h-full border-border/50 border-t-2 ${BORDER_COLORS[i]} bg-surface hover:bg-surface-hover hover:-translate-y-1 hover:shadow-lg transition-all duration-200`}>
              <CardHeader><div className="mb-2 text-3xl">{f.icon}</div><CardTitle className="font-heading text-lg">{f.title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{f.description}</p></CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
