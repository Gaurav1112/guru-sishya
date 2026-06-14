"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTopicWithFallback } from "@/hooks/use-topic-with-fallback";
import { ResourceContainer } from "@/components/features/resources/resource-container";
import { BackButton } from "@/components/back-button";
import { YouTubeVideos } from "@/components/youtube-embed";
import { getVideosForTopic } from "@/lib/content/youtube-videos";

export default function ResourcesPage({
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
      <div className="max-w-4xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-muted/40 rounded mb-4" />
        <div className="h-8 w-48 bg-muted/40 rounded mb-2" />
        <div className="h-4 w-72 bg-muted/30 rounded mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-surface p-5 h-32" />
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
      <YouTubeVideos videos={getVideosForTopic(topic.name)} />
      <div className="mt-6">
        <ResourceContainer topicId={topic.id!} topicName={topic.name} />
      </div>
    </div>
  );
}
