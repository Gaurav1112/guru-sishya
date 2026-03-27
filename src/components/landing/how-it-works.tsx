"use client";
import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Pick a Topic",
    description:
      "Browse 65 interview topics across System Design, DS&A, and Core CS. Search, filter by category, or follow the visual roadmap.",
    color: "border-saffron/50 bg-saffron/5",
    numberColor: "text-saffron",
    icon: (
      <svg role="img" aria-label="Pick a Topic" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25H5.25A2.25 2.25 0 013 18V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75V18a2.25 2.25 0 01-2.25 2.25H15M9 11.25l3 3 3-3M12 14.25V4.5" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Follow the Plan",
    description:
      "Each topic has a structured 20-hour plan built on the Pareto Principle — targeting the 20% of concepts that appear in 80% of interviews.",
    color: "border-teal/50 bg-teal/5",
    numberColor: "text-teal",
    icon: (
      <svg role="img" aria-label="Follow the Plan" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Practice & Master",
    description:
      "Reinforce with quiz questions, test code in the playground, and use the Feynman Technique to confirm deep understanding — not just memorization.",
    color: "border-gold/50 bg-gold/5",
    numberColor: "text-gold",
    icon: (
      <svg role="img" aria-label="Practice and Master" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 bg-gradient-to-b from-transparent via-surface/30 to-transparent">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <h2 className="font-heading text-3xl font-bold mb-3">
          How It Works — Topics, Questions &amp; Feynman Technique
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Start learning in 3 simple steps
        </p>
      </motion.div>

      <div className="mx-auto max-w-4xl">
        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              className={`rounded-2xl border-2 ${step.color} p-6 relative`}
            >
              {/* Step number */}
              <span className={`font-heading text-5xl font-black ${step.numberColor} opacity-20 absolute top-4 right-5 select-none`}>
                {step.step}
              </span>

              {/* Icon */}
              <div className={`mb-4 ${step.numberColor}`}>
                {step.icon}
              </div>

              <h3 className="font-heading text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Connector arrows on desktop */}
        <div className="hidden md:flex justify-center items-center gap-0 mt-4 -translate-y-[calc(50%+2rem)] pointer-events-none">
          {/* These are cosmetic and handled by the grid layout above */}
        </div>
      </div>
    </section>
  );
}
