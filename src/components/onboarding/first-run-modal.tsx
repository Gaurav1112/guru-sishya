"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Target, Clock, ArrowRight, Sparkles } from "lucide-react";

const GOALS = [
  { id: "faang", label: "FAANG / Big Tech", icon: "🏢", topics: ["System Design", "Data Structures & Algorithms", "Java Core", "Behavioral (STAR)"] },
  { id: "startup", label: "Startups", icon: "🚀", topics: ["System Design", "JavaScript", "React & Next.js", "Node.js"] },
  { id: "campus", label: "Campus Placement", icon: "🎓", topics: ["Data Structures & Algorithms", "Java Core", "Core CS", "Design Patterns"] },
  { id: "switch", label: "Career Switch", icon: "🔄", topics: ["Core CS", "Data Structures & Algorithms", "System Design", "Behavioral (STAR)"] },
  { id: "general", label: "General Practice", icon: "📚", topics: ["Java Core", "Data Structures & Algorithms", "System Design", "Design Patterns"] },
];

const TIMELINES = [
  { id: "1w", label: "1 week", desc: "Intensive — focus on top 3 topics" },
  { id: "2w", label: "2 weeks", desc: "Balanced — cover 5 key topics" },
  { id: "1m", label: "1 month", desc: "Thorough — deep dive into 8+ topics" },
  { id: "3m", label: "3+ months", desc: "Comprehensive — master everything" },
];

interface FirstRunModalProps {
  onComplete: () => void;
}

export function FirstRunModal({ onComplete }: FirstRunModalProps) {
  const [step, setStep] = useState(0); // 0 = goal, 1 = timeline, 2 = results
  const [goal, setGoal] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();

  const selectedGoal = GOALS.find((g) => g.id === goal);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg mx-4 rounded-2xl border border-saffron/20 bg-surface p-8 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Target className="size-5 text-saffron" />
                <h2 className="text-lg font-bold">What are you preparing for?</h2>
              </div>
              <div className="space-y-2">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGoal(g.id);
                      setStep(1);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-saffron/50 hover:bg-saffron/5 transition-colors text-left"
                  >
                    <span className="text-xl">{g.icon}</span>
                    <span className="font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { localStorage.setItem("gs-first-run-done", "1"); onComplete(); }}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground"
              >
                Skip — I know what I want
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Clock className="size-5 text-saffron" />
                <h2 className="text-lg font-bold">How much time do you have?</h2>
              </div>
              <div className="space-y-2">
                {TIMELINES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTimeline(t.id);
                      setStep(2);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 hover:border-saffron/50 hover:bg-saffron/5 transition-colors text-left"
                  >
                    <span className="font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && selectedGoal && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-5 text-saffron" />
                <h2 className="text-lg font-bold">Your Personalized Plan</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Based on your {selectedGoal.label} prep with{" "}
                {TIMELINES.find((t) => t.id === timeline)?.label}, start with these topics:
              </p>
              <div className="space-y-2 mb-6">
                {selectedGoal.topics.map((topic, i) => (
                  <div
                    key={topic}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/30"
                  >
                    <span className="size-6 rounded-full bg-saffron/20 text-saffron text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{topic}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("gs-prep-goal", goal ?? "");
                  localStorage.setItem("gs-prep-timeline", timeline ?? "");
                  localStorage.setItem("gs-first-run-done", "1");
                  onComplete();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-saffron text-background font-semibold hover:bg-saffron/90 transition-colors"
              >
                Start Learning <ArrowRight className="size-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
