"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTopicWithFallback } from "@/hooks/use-topic-with-fallback";
import { LadderContainer } from "@/components/features/ladder/ladder-container";
import { BackButton } from "@/components/back-button";

export default function LadderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { topic, isLoading } = useTopicWithFallback(id);
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const hydrated = useHydrated();

  if (!hydrated || isLoading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-muted/40 rounded mb-4" />
        <div className="h-8 w-48 bg-muted/40 rounded mb-2" />
        <div className="h-4 w-64 bg-muted/30 rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-surface p-5 h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!apiKey && aiProvider !== "ollama" && aiProvider !== "static") {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Set your API key in{" "}
        <a href="/app/settings" className="text-saffron underline">
          Settings
        </a>{" "}
        first.
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Topic not found
      </div>
    );
  }

  return (
    <div>
      <BackButton href={`/app/topic/${id}`} label="Back to Topic" />
      <LadderContainer topicId={topic.id!} topicName={topic.name} />
    </div>
  );
}
