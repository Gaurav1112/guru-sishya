"use client";
import { Loader2 } from "lucide-react";
import { use } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const featureCards = [
  { key: "plan", title: "20-Hour Pareto Plan", description: "Focused plan targeting the 20% that drives 80%", href: "plan", icon: "📋", color: "border-saffron/30" },
  { key: "cheatsheet", title: "Cheat Sheet", description: "Visual 1-2 page summary for 5-min review", href: "cheatsheet", icon: "📄", color: "border-teal/30" },
  { key: "quiz", title: "Quiz Me Till I Break", description: "Adaptive questions that find your ceiling", href: "quiz", icon: "🧠", color: "border-indigo/30" },
  { key: "ladder", title: "Learning Ladder", description: "5-level progression from Novice to Expert", href: "ladder", icon: "🪜", color: "border-gold/30" },
  { key: "resources", title: "Resource Finder", description: "AI-curated best resources for this topic", href: "resources", icon: "🔍", color: "border-saffron/30" },
  { key: "feynman", title: "Feynman Technique", description: "Interactive Socratic chat to truly understand", href: "feynman", icon: "💬", color: "border-teal/30" },
];

export default function TopicHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const topic = useLiveQuery(async () => (await db.topics.get(Number(id))) ?? null, [id]);
  if (!topic) return <div className="py-20 text-center text-muted-foreground">Topic not found</div>;
  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">{topic.name}</h1>
      <p className="text-muted-foreground mb-8">Choose a learning tool or follow the guided path</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {featureCards.map((f) => (
          <Link key={f.key} href={`/app/topic/${id}/${f.href}`}>
            <Card className={`h-full border ${f.color} bg-surface hover:bg-surface-hover transition-colors cursor-pointer`}>
              <CardHeader><div className="text-2xl mb-1">{f.icon}</div><CardTitle className="font-heading text-base">{f.title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{f.description}</p></CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
