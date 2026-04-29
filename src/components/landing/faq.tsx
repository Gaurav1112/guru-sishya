"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: "What does Guru Sishya offer for interview preparation?",
    a: "Guru Sishya provides 141 comprehensive topics, 1,988 curated interview questions with detailed answers, AI mock interviews, STAR behavioral prep for 6 FAANG companies, adaptive quizzes, spaced repetition flashcards, and a code playground — all in one platform. Pro members get unlimited access to all features.",
  },
  {
    q: "Do I need an API key or AI subscription?",
    a: "No. All lesson content, quiz questions, cheat sheets, STAR behavioral answers, and the learning ladder are pre-generated and bundled into the app. They work entirely offline in your browser. Pro features like the AI Mock Interviewer and Study Buddy chatbot also work without any external API.",
  },
  {
    q: "What topics does Guru Sishya cover?",
    a: "141 topics across multiple domains: System Design (30+ topics), Data Structures & Algorithms, Java Core, Spring Boot, JavaScript/TypeScript, React/Next.js, Node.js, HTML/CSS, RDBMS/SQL, NoSQL, Kafka, AWS, Kubernetes/Docker, Design Patterns, and more. New topics are added regularly.",
  },
  {
    q: "How is this different from LeetCode, AlgoExpert, or NeetCode?",
    a: "Guru Sishya combines comprehensive teaching content with 1,988 questions (with full answers, not just hints), 58 STAR behavioral answers, AI mock interviews, company-specific prep for FAANG, spaced repetition flashcards, offline access, and adaptive quizzes — all at ₹149/month. Competitors charge ₹991-₹2,917/month and still lack behavioral prep and offline support.",
  },
  {
    q: "Does it cover behavioral interviews?",
    a: "Yes. Guru Sishya includes 58 pre-written STAR behavioral answers for the most common interview questions at Google, Amazon, Microsoft, Meta, Apple, and Netflix. These cover leadership principles, conflict resolution, ownership, impact, and more.",
  },
  {
    q: "Will my progress be saved across devices?",
    a: "Yes. When you sign in with Google, your progress (XP, level, streak, coins) is synced to our cloud database via Supabase. Your data persists across devices and browser sessions. You can also export/import your progress from the profile page.",
  },
  {
    q: "What does the Pro plan include?",
    a: "Pro (₹149/month, ₹699/semester, ₹1,199/year, or ₹2,999 lifetime) unlocks: all lesson sessions, unlimited Q&A answers, AI Mock Interviewer with voice input, Study Buddy AI chatbot, hard quiz difficulty with timer, full Skill Progression Levels, Teach-Back Mode, unlimited flashcards, all Quick Summary sheets, and the Revision section.",
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
          <svg aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
    <section
      id="faq"
      className="px-6 py-20 bg-gradient-to-b from-transparent via-surface/20 to-transparent"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
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
          <div key={item.q} itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <meta itemProp="name" content={item.q} />
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <meta itemProp="text" content={item.a} />
            </div>
            <FAQRow item={item} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
