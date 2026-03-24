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
    a: "Yes — 56 topics, 710+ quiz questions with answers, 591 full lessons, flashcards, and all progress tracking are free forever. No credit card, no email required. We offer a Pro tier (₹129/month or ₹999/year) for AI-powered features like the Feynman Technique and custom topic generation, but the core prep content will always be free.",
  },
  {
    q: "Do I need an API key or AI subscription?",
    a: "No. All lesson content, quiz questions, cheat sheets, STAR behavioral answers, and the learning ladder are pre-generated and bundled into the app. They work entirely offline in your browser. Only the optional AI features (Feynman Technique, custom topics) require a Pro plan.",
  },
  {
    q: "What topics does Guru Sishya cover?",
    a: "56 topics across four domains: System Design Fundamentals (load balancing, caching, databases, message queues, CDNs), System Design Case Studies (Twitter, YouTube, Uber, etc.), Data Structures & Algorithms (arrays, trees, dynamic programming, graphs), and Core CS (operating systems, networking, databases, compilers). More topics are added regularly.",
  },
  {
    q: "How is this different from LeetCode, AlgoExpert, or NeetCode?",
    a: "Guru Sishya is the only platform that combines all of this in one place for free: 710+ questions with full answers (not just hints), 58 STAR behavioral answers, 32 system design topics, spaced repetition flashcards, offline access, and Bloom's taxonomy adaptive quizzes. Competitors charge ₹991–₹2,917/month and still lack behavioral prep and offline support.",
  },
  {
    q: "Does it cover behavioral interviews?",
    a: "Yes. Guru Sishya includes 58 pre-written STAR behavioral answers for the most common interview questions at Google, Amazon, Microsoft, Meta, Apple, and Netflix. These cover leadership, conflict resolution, ownership, impact, and more.",
  },
  {
    q: "Will my progress be saved?",
    a: "Yes. All progress is saved locally in your browser using IndexedDB — no account required. Your data is private and works offline. If you clear your browser data, your progress will reset, so be mindful of browser storage settings.",
  },
  {
    q: "What is the Pro plan and what does it include?",
    a: "Pro (₹129/month or ₹999/year) unlocks AI-powered features: the Feynman Technique interactive chat for deep understanding, custom topic generation, priority support, and a certificate of completion. All core prep content remains free forever.",
  },
];

function FAQRow({ item, index }: { item: FAQItem; index: number }) {
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
          Everything you need to know about the platform
        </p>
      </motion.div>

      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map((item, i) => (
          <FAQRow key={item.q} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
