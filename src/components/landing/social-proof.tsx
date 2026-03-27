"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "SDE-2 at Amazon",
    text: "The spaced repetition and adaptive quizzes helped me focus on my weak areas. The STAR method prep was exactly what I needed for behavioral rounds.",
    avatar: "PS",
  },
  {
    name: "Rahul K.",
    role: "Software Engineer at Google",
    text: "I used Guru Sishya for 3 weeks before my interviews. The system design content and daily practice streak kept me consistent. Highly recommend.",
    avatar: "RK",
  },
  {
    name: "Sneha M.",
    role: "Final Year, IIT Bombay",
    text: "Perfect for campus placements. The topic-wise learning plans made it easy to cover DSA and Java in a structured way without feeling overwhelmed.",
    avatar: "SM",
  },
  {
    name: "Arjun D.",
    role: "Backend Developer at Flipkart",
    text: "The mock interview feature with boss rounds made practice actually fun. The gamification kept me coming back every day. Worth every rupee.",
    avatar: "AD",
  },
];

export function SocialProof() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-2xl md:text-3xl font-bold text-center mb-3">
          What Engineers Are Saying
        </h2>
        <p className="text-center text-muted-foreground mb-10">
          Real feedback from engineers who prepared with Guru Sishya
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border/50 bg-surface/50 p-6"
            >
              <p className="text-foreground/90 text-sm leading-relaxed mb-4 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-saffron/20 text-saffron font-bold text-sm flex items-center justify-center">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
