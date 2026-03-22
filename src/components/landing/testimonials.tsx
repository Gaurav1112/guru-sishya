"use client";
import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "SDE-2 at Amazon",
    avatar: "PS",
    avatarColor: "bg-saffron/20 text-saffron",
    quote:
      "The Feynman Technique sessions caught every gap in my understanding. I used to think I knew caching — turns out I had several blind spots. Got the offer after 3 weeks.",
  },
  {
    name: "Rohan M.",
    role: "Backend Engineer at Google",
    avatar: "RM",
    avatarColor: "bg-teal/20 text-teal",
    quote:
      "The system design roadmap is exactly what I needed. No more wondering 'what do I study next?' — it's all laid out clearly. The quiz questions are brutal (in a good way).",
  },
  {
    name: "Aditya K.",
    role: "Full-Stack Dev, targeting FAANG",
    avatar: "AK",
    avatarColor: "bg-gold/20 text-gold",
    quote:
      "Zero API key setup, works in my browser, and covers everything from DB sharding to DP patterns. I open this every morning for my 30-minute prep session.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        {/* Social proof number */}
        <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 mb-4">
          <span className="text-xs font-semibold text-teal">
            Join 1,000+ developers preparing for their dream job
          </span>
        </div>
        <h2 className="font-heading text-3xl font-bold mb-3">
          Developers Love Guru Sishya
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Real results from engineers who used structured prep to land offers
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/60 bg-surface p-6 flex flex-col gap-4"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, j) => (
                <svg key={j} className="h-4 w-4 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <p className="text-sm text-muted-foreground leading-relaxed flex-1">
              &ldquo;{t.quote}&rdquo;
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${t.avatarColor}`}
              >
                {t.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="mt-8 text-center text-xs text-muted-foreground/50">
        * Testimonials are illustrative of typical user experiences
      </p>
    </section>
  );
}
