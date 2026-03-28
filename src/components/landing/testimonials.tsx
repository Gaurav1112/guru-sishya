"use client";
import { motion } from "framer-motion";

const WHAT_YOU_GET = [
  {
    number: "138",
    title: "Expert-Curated Topics",
    description: "System Design, DS&A, Core CS — every domain you'll face in a top-tier interview.",
    badges: ["System Design", "DS&A", "Core CS"],
    color: "text-saffron",
    borderColor: "border-saffron/30",
    bgColor: "bg-saffron/5",
    badgeColor: "bg-saffron/10 text-saffron border-saffron/20",
    span: "md:col-span-2",
  },
  {
    number: "1933",
    title: "Interview Questions",
    description: "Detailed answers, not just hints. Every question comes with a full explanation so you actually learn.",
    badges: ["Detailed Answers"],
    color: "text-teal",
    borderColor: "border-teal/30",
    bgColor: "bg-teal/5",
    badgeColor: "bg-teal/10 text-teal border-teal/20",
    span: "",
  },
  {
    number: "58",
    title: "STAR Behavioral Answers",
    description: "Pre-written behavioral answers for the most common questions at top companies.",
    badges: ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"],
    color: "text-gold",
    borderColor: "border-gold/30",
    bgColor: "bg-gold/5",
    badgeColor: "bg-gold/10 text-gold border-gold/20",
    span: "",
  },
  {
    number: "2000+",
    title: "Flashcards",
    description: "SM-2 spaced repetition algorithm surfaces the cards you need to review, exactly when you need to.",
    badges: ["SM-2 Algorithm", "Spaced Repetition"],
    color: "text-indigo",
    borderColor: "border-indigo/30",
    bgColor: "bg-indigo/5",
    badgeColor: "bg-indigo/10 text-indigo border-indigo/20",
    span: "",
  },
  {
    number: "5",
    title: "Adaptive Quiz Levels",
    description: "Bloom's taxonomy difficulty progression — from recall to application to synthesis, per topic.",
    badges: ["Bloom's Taxonomy", "Adaptive Difficulty"],
    color: "text-saffron",
    borderColor: "border-saffron/30",
    bgColor: "bg-saffron/5",
    badgeColor: "bg-saffron/10 text-saffron border-saffron/20",
    span: "",
  },
  {
    number: "671",
    title: "Full Lessons",
    description: "Complete teaching content — not just activity lists. Each lesson covers theory, examples, and code.",
    badges: ["Python", "TypeScript"],
    color: "text-teal",
    borderColor: "border-teal/30",
    bgColor: "bg-teal/5",
    badgeColor: "bg-teal/10 text-teal border-teal/20",
    span: "md:col-span-2",
  },
];

export function Testimonials() {
  return (
    <section id="what-you-get" className="px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl font-bold mb-3">
          What You Get
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Everything is pre-built, verified, and ready — no AI key, no setup, no subscription required
        </p>
      </motion.div>

      <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4">
        {WHAT_YOU_GET.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            viewport={{ once: true }}
            className={`rounded-2xl border ${item.borderColor} ${item.bgColor} p-6 flex flex-col gap-3 ${item.span}`}
          >
            <div className={`font-heading text-5xl font-black ${item.color} leading-none`}>
              {item.number}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
              {item.badges.map((badge) => (
                <span
                  key={badge}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${item.badgeColor}`}
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
