"use client";
import { Loader2, Play } from "lucide-react";
import { use, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { motion } from "framer-motion";
import { db } from "@/lib/db";
import { findTopicContent, loadAllContent, type TopicContent } from "@/lib/content/loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { YouTubeVideos } from "@/components/youtube-embed";
import { getVideosForTopic } from "@/lib/content/youtube-videos";

const featureCards = [
  { key: "plan", title: "Guru's Path", description: "Structured sessions targeting the 20% that drives 80%", href: "plan", icon: "📋", color: "border-saffron/30" },
  { key: "cheatsheet", title: "Quick Saar", description: "Visual 1-2 page summary for 5-min revision", href: "cheatsheet", icon: "📄", color: "border-teal/30" },
  { key: "quiz", title: "Pariksha", description: "Adaptive questions that find your ceiling", href: "quiz", icon: "🧠", color: "border-indigo/30" },
  { key: "ladder", title: "Vidya Levels", description: "5-level progression from Novice to Expert", href: "ladder", icon: "🪜", color: "border-gold/30" },
  { key: "resources", title: "Gyan Kosh", description: "Best books, videos & resources for this topic", href: "resources", icon: "🔍", color: "border-saffron/30" },
  { key: "feynman", title: "Guru Mode", description: "Become the teacher — explain to truly understand", href: "feynman", icon: "💬", color: "border-teal/30" },
];

// Keys that map to pre-generated content availability
const CONTENT_KEYS: Record<string, (c: TopicContent) => boolean> = {
  plan: (c) => (c.plan?.sessions?.length ?? 0) > 0,
  cheatsheet: (c) => Boolean(c.cheatSheet),
  quiz: (c) => (c.quizBank?.length ?? 0) > 0,
  ladder: (c) => (c.ladder?.levels?.length ?? 0) > 0,
  resources: (c) => (c.resources?.length ?? 0) > 0,
  feynman: () => false, // always requires AI
};

const CATEGORY_BADGE: Record<string, string> = {
  "System Design": "bg-saffron/20 text-saffron border-saffron/30",
  "System Design Cases": "bg-teal/20 text-teal border-teal/30",
  "Data Structures": "bg-indigo/20 text-indigo border-indigo/30",
  Algorithms: "bg-indigo/20 text-indigo border-indigo/30",
  "Programming Languages": "bg-gold/20 text-gold border-gold/30",
  Frontend: "bg-gold/20 text-gold border-gold/30",
  Backend: "bg-gold/20 text-gold border-gold/30",
  Databases: "bg-gold/20 text-gold border-gold/30",
  "Software Engineering": "bg-gold/20 text-gold border-gold/30",
  "Computer Science Fundamentals": "bg-gold/20 text-gold border-gold/30",
};

export default function TopicHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // useLiveQuery returns undefined while loading, null/undefined when not found
  const topicFromDb = useLiveQuery(async () => (await db.topics.get(Number(id))) ?? null, [id]);
  const [builtIn, setBuiltIn] = useState<TopicContent | null>(null);
  const [contentChecked, setContentChecked] = useState(false);

  // Check for a saved (in-progress) quiz session for this topic
  const savedQuizSession = useLiveQuery(
    async () => {
      const numId = Number(id);
      if (!numId) return null;
      const s = await db.quizSessionState.where({ topicId: numId }).first();
      return s && s.status !== "complete" ? s : null;
    },
    [id]
  );

  // Fallback topic synthesised from static content for direct URL cold loads
  const [fallbackTopic, setFallbackTopic] = useState<{ id: number; name: string; category?: string } | null>(null);
  const [dbChecked, setDbChecked] = useState(false);

  // topicFromDb is undefined while Dexie query is pending; null once it resolves with no result
  const topic = topicFromDb ?? fallbackTopic ?? null;

  // When Dexie resolves to null, attempt to build a topic stub from static content
  useEffect(() => {
    if (topicFromDb !== undefined) {
      setDbChecked(true);
    }
  }, [topicFromDb]);

  useEffect(() => {
    if (!dbChecked || topicFromDb !== null) return;
    // Dexie has no record for this id — try to find a matching topic in static content
    loadAllContent().then((allContent) => {
      // Use id as an index (1-based) into sorted static topics as a best-effort fallback
      const idx = Number(id) - 1;
      const staticTopic = allContent[idx] ?? null;
      if (staticTopic) {
        setFallbackTopic({
          id: Number(id),
          name: staticTopic.topic,
          category: staticTopic.category,
        });
      }
    }).catch(() => {/* ignore */});
  }, [dbChecked, topicFromDb, id]);

  useEffect(() => {
    if (!topic) return;
    findTopicContent(topic.name)
      .then((c) => {
        setBuiltIn(c);
        setContentChecked(true);
      })
      .catch(() => setContentChecked(true));
  }, [topic]);

  // Still loading from Dexie and no fallback yet
  if (topicFromDb === undefined && !fallbackTopic)
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto mb-3 size-6 animate-spin" />
        Loading topic...
      </div>
    );

  // Dexie resolved null AND static fallback found nothing
  if (!topic)
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p className="text-lg font-medium">Topic not found</p>
        <p className="text-sm mt-2">
          <Link href="/app/topics" className="text-saffron hover:underline">
            Browse all topics
          </Link>
        </p>
      </div>
    );

  const badgeClass =
    CATEGORY_BADGE[topic.category ?? ""] ?? "bg-saffron/20 text-saffron border-saffron/30";

  const quizCount = builtIn?.quizBank?.length ?? 0;
  const planSessions = builtIn?.plan?.sessions?.length ?? 0;

  return (
    <div>
      <BackButton href="/app/topics" label="Back to Topics" />
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-start gap-3 flex-wrap">
          <h1 className="font-heading text-3xl font-bold">{topic.name}</h1>
          {topic.category && (
            <span
              className={`inline-flex items-center self-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {topic.category}
            </span>
          )}
          {contentChecked && builtIn && (
            <span className="inline-flex items-center self-center rounded-full border border-teal/30 bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
              Built-in Content
            </span>
          )}
        </div>

        {/* Quick stats */}
        {contentChecked && builtIn && (
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {quizCount > 0 && (
              <span>
                <strong className="text-foreground">{quizCount}</strong> quiz questions available
              </span>
            )}
            {planSessions > 0 && (
              <span>
                <strong className="text-foreground">{planSessions}</strong> sessions in plan
              </span>
            )}
          </div>
        )}

        <p className="text-muted-foreground">
          Choose a learning tool or follow the guided path
        </p>
      </div>

      {/* YouTube Videos */}
      {topic.name && <YouTubeVideos videos={getVideosForTopic(topic.name)} />}

      {/* Feature cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {featureCards.map((f, i) => {
          const hasContent = builtIn ? CONTENT_KEYS[f.key]?.(builtIn) ?? false : false;
          return (
            <motion.div
              key={f.key}
              data-testid="feature-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3, ease: "easeOut" }}
            >
              <Link href={`/app/topic/${id}/${f.href}`}>
                <Card
                  className={`h-full border ${f.color} bg-surface hover:bg-surface-hover transition-colors cursor-pointer relative`}
                >
                  {f.key === "quiz" && savedQuizSession && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-saffron/20 border border-saffron/40 px-2 py-0.5 text-[10px] font-semibold text-saffron animate-pulse">
                      <Play className="size-2.5 fill-current" />
                      Resume
                    </span>
                  )}
                  {contentChecked && hasContent && !(f.key === "quiz" && savedQuizSession) && (
                    <span className="absolute top-3 right-3 rounded-full bg-teal/20 border border-teal/30 px-1.5 py-0.5 text-[10px] font-medium text-teal">
                      ready
                    </span>
                  )}
                  <CardHeader>
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <CardTitle className="font-heading text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
