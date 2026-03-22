"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "Is it really free? What's the catch?",
    a: "Yes — 54 topics, 1,301 quiz questions, the code playground, and all progress tracking are free forever. No credit card, no email required. We plan a Pro tier (₹129/month) for AI-powered features like the Feynman Technique and custom topic generation, but the core prep content will always be free.",
  },
  {
    q: "Do I need an API key or AI subscription?",
    a: "No. All lesson content, quiz questions, cheat sheets, and the learning ladder are pre-generated and bundled into the app. They work entirely offline in your browser. Only the optional AI features (Feynman Technique, custom topics) require an AI provider key — and those are Pro features.",
  },
  {
    q: "What topics does Guru Sishya cover?",
    a: "System Design Fundamentals (load balancing, caching, databases, message queues, CDNs), System Design Case Studies (Twitter, YouTube, Uber, etc.), Data Structures & Algorithms (arrays, trees, dynamic programming, graphs), and Core CS (operating systems, networking, databases, compilers). 54 topics total with more being added regularly.",
  },
  {
    q: "How is this different from other prep sites?",
    a: "Guru Sishya combines multiple evidence-based learning techniques in one place: Pareto-focused 20-hour study plans, Feynman Technique for true understanding, spaced-repetition quizzes, a skill ladder, and a live code playground — all without needing to juggle multiple platforms or subscriptions.",
  },
  {
    q: "Will my progress be saved?",
    a: "Yes. All progress is saved locally in your browser using IndexedDB (no account required). This means your data is private and works offline. If you clear your browser data, your progress will reset — so be careful with browser storage settings.",
  },
  {
    q: "When is the Pro plan launching?",
    a: "We're actively working on the Pro features. Sign up for early access updates on our launch page. Early adopters will get a discounted rate.",
  },
];

function FAQItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      viewport={{ once: true }}
      className="border border-border/60 rounded-xl overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-surface hover:bg-surface-hover transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">{item.q}</span>
        <span
          className={`flex-shrink-0 rounded-full border border-border/50 h-6 w-6 flex items-center justify-center transition-transform duration-200 ${
            open ? "rotate-45" : ""
          }`}
        >
          <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-5 py-4 text-sm text-muted-foreground leading-relaxed border-t border-border/40 bg-surface/50">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="px-6 py-20 bg-gradient-to-b from-transparent via-surface/20 to-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-10"
      >
        <h2 className="font-heading text-3xl font-bold mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Have more questions? Everything you need to know about the platform
        </p>
      </motion.div>

      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map((item, i) => (
          <FAQItem key={item.q} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
