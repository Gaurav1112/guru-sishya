"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { loadAllContent, type TopicContent } from "@/lib/content/loader";
import {
  getCompanyPath,
  getAccentColor,
  getAccentBg,
  getAccentBorder,
} from "@/lib/content/company-paths";
import { BackButton } from "@/components/back-button";
import { PageTransition } from "@/components/page-transition";

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysUntil(target: Date): number {
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Topic Row ────────────────────────────────────────────────────────────────

function TopicRow({
  topicName,
  index,
  completed,
  isNext,
  onNavigate,
  accentBorder,
  accentBg,
}: {
  topicName: string;
  index: number;
  completed: boolean;
  isNext: boolean;
  onNavigate: (topicName: string) => void;
  accentBorder: string;
  accentBg: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onNavigate(topicName)}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={[
        "group flex items-center gap-3 w-full rounded-xl border px-4 py-3 text-left transition-all duration-200",
        "hover:shadow-md hover:scale-[1.01]",
        completed
          ? "border-green-500/40 bg-green-500/10"
          : isNext
            ? `${accentBorder} ${accentBg} ring-1 ring-saffron/30`
            : "border-border/50 bg-surface/50 hover:bg-surface-hover",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          completed
            ? "bg-green-500 text-white"
            : isNext
              ? "bg-saffron text-white"
              : "bg-muted/60 text-muted-foreground",
        ].join(" ")}
      >
        {completed ? "\u2713" : index + 1}
      </span>
      <span
        className={[
          "flex-1 text-sm font-medium",
          completed
            ? "text-green-400 line-through"
            : isNext
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground",
        ].join(" ")}
      >
        {topicName}
      </span>
      {isNext && (
        <span className="shrink-0 rounded-full bg-saffron px-2 py-0.5 text-[10px] font-bold text-white">
          NEXT
        </span>
      )}
      <ArrowRight
        className={[
          "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
          completed ? "text-green-400" : "text-muted-foreground",
        ].join(" ")}
      />
    </motion.button>
  );
}

// ── Main Company Path Page ───────────────────────────────────────────────────

export default function CompanyPathPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const path = getCompanyPath(slug);

  const [allContent, setAllContent] = useState<TopicContent[]>([]);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [targetDate, setTargetDate] = useState<string>("");
  const [showTips, setShowTips] = useState(false);

  const accentColor = path ? getAccentColor(path) : "text-saffron";
  const accentBg = path ? getAccentBg(path) : "bg-saffron/10";
  const accentBorder = path ? getAccentBorder(path) : "border-saffron/30";

  useEffect(() => {
    loadAllContent().then(setAllContent).catch(() => {});
    db.topics.toArray().then((topics) => {
      const names = new Set(topics.map((t) => t.name.toLowerCase().trim()));
      setCompletedTopics(names);
    });
    const saved = localStorage.getItem(`gs-target-${slug}`);
    if (saved) setTargetDate(saved);
  }, [slug]);

  const handleTargetDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTargetDate(val);
      if (val) localStorage.setItem(`gs-target-${slug}`, val);
      else localStorage.removeItem(`gs-target-${slug}`);
    },
    [slug],
  );

  const isCompleted = useCallback(
    (topicName: string) => {
      const needle = topicName.toLowerCase().trim();
      return Array.from(completedTopics).some(
        (name: string) => name.includes(needle) || needle.includes(name),
      );
    },
    [completedTopics],
  );

  const handleNavigate = useCallback(
    async (topicName: string) => {
      const match = allContent.find((tc: TopicContent) => {
        const stored = tc.topic.toLowerCase().trim();
        const needle = topicName.toLowerCase().trim();
        return stored.includes(needle) || needle.includes(stored);
      });
      if (match) {
        const existing = await db.topics.where("name").equalsIgnoreCase(match.topic).first();
        if (existing?.id) {
          router.push(`/app/topic/${existing.id}`);
        } else {
          const id = await db.topics.add({ name: match.topic, category: match.category, createdAt: new Date() });
          router.push(`/app/topic/${id}`);
        }
      } else {
        router.push(`/app/topics?search=${encodeURIComponent(topicName)}`);
      }
    },
    [allContent, router],
  );

  const completedCount = useMemo(
    () => (path ? path.topics.filter((t: string) => isCompleted(t)).length : 0),
    [path, isCompleted],
  );
  const totalTopics = path?.topics.length ?? 0;
  const progressPct = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  const nextTopicIndex = useMemo(
    () => (path ? path.topics.findIndex((t: string) => !isCompleted(t)) : -1),
    [path, isCompleted],
  );

  const totalHours = path ? path.hoursPerWeek * path.weeks : 0;
  const hoursCompleted = totalTopics > 0 ? Math.round((completedCount / totalTopics) * totalHours) : 0;
  const hoursRemaining = totalHours - hoursCompleted;
  const daysLeft = targetDate ? daysUntil(new Date(targetDate)) : null;

  if (!path) {
    return (
      <PageTransition>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Company path not found.</p>
          <button type="button" onClick={() => router.push("/app/roadmap")} className="mt-4 text-saffron underline underline-offset-2 text-sm">
            Back to Roadmap
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-10">
        <BackButton href="/app/roadmap" label="Back to Roadmap" />

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`rounded-2xl border ${accentBorder} ${accentBg} p-6`}
        >
          <div className="flex items-start gap-4">
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 ${accentBorder} bg-surface text-xl font-bold ${accentColor}`}>
              {path.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium tracking-widest uppercase mb-1 ${accentColor}`}>
                Company Interview Path
              </p>
              <h1 className="font-heading text-2xl font-bold">
                Prepare for {path.company}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{path.duration}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{path.focus}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalTopics} topics &middot; ~{totalHours} hours total
            </span>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2.5 rounded-full bg-black/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-saffron to-teal"
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {completedCount}/{totalTopics}
            </span>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-border/50 bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4 text-saffron" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Interview Date</span>
            </div>
            <input
              type="date"
              value={targetDate}
              onChange={handleTargetDateChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-border/50 bg-surface-hover px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-saffron/50"
            />
            {daysLeft !== null && daysLeft > 0 && (
              <p className="mt-2 text-lg font-bold text-saffron tabular-nums">{daysLeft} days left</p>
            )}
            {daysLeft === 0 && <p className="mt-2 text-lg font-bold text-green-400">Interview today!</p>}
          </div>
          <div className="rounded-xl border border-border/50 bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-teal" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hours Remaining</span>
            </div>
            <p className="text-2xl font-bold text-teal tabular-nums">~{hoursRemaining}h</p>
            <p className="text-xs text-muted-foreground mt-1">of {totalHours}h total ({path.hoursPerWeek}h/week)</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="size-4 text-gold" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Topics Left</span>
            </div>
            <p className="text-2xl font-bold text-gold tabular-nums">{totalTopics - completedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{completedCount} completed</p>
          </div>
        </motion.div>

        {/* Next Topic CTA */}
        {nextTopicIndex >= 0 && (
          <motion.button
            type="button"
            onClick={() => handleNavigate(path.topics[nextTopicIndex])}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full rounded-xl border border-saffron/40 bg-gradient-to-r from-saffron/10 to-gold/10 p-5 flex items-center gap-4 group hover:shadow-lg hover:shadow-saffron/10 transition-shadow"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-saffron text-white font-bold">
              {nextTopicIndex + 1}
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-medium text-saffron uppercase tracking-wider">Continue Your Path</p>
              <p className="text-base font-semibold">{path.topics[nextTopicIndex]}</p>
            </div>
            <ArrowRight className="size-5 text-saffron group-hover:translate-x-1 transition-transform" />
          </motion.button>
        )}

        {completedCount === totalTopics && totalTopics > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-green-500/40 bg-green-500/10 p-6 text-center">
            <p className="text-2xl font-bold text-green-400 mb-1">Path Complete!</p>
            <p className="text-sm text-muted-foreground">
              You have completed all {totalTopics} topics for {path.company}. You are ready for your interview!
            </p>
          </motion.div>
        )}

        {/* Interview Tips */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl border border-border/50 bg-surface"
        >
          <button type="button" onClick={() => setShowTips((v) => !v)} className="w-full flex items-center justify-between px-5 py-4 text-left">
            <span className="font-heading text-base font-semibold">{path.company} Interview Tips</span>
            {showTips ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
          {showTips && (
            <div className="px-5 pb-5">
              <ul className="space-y-2">
                {path.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className={`shrink-0 mt-0.5 ${accentColor}`}>&bull;</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Topic Checklist */}
        <div className="space-y-2">
          <h2 className="font-heading text-lg font-semibold px-1">
            Topics ({completedCount}/{totalTopics})
          </h2>
          {path.topics.map((topicName: string, i: number) => (
            <TopicRow
              key={topicName}
              topicName={topicName}
              index={i}
              completed={isCompleted(topicName)}
              isNext={i === nextTopicIndex}
              onNavigate={handleNavigate}
              accentBorder={accentBorder}
              accentBg={accentBg}
            />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
