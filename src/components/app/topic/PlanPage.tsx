"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTopicWithFallback } from "@/hooks/use-topic-with-fallback";
import { PlanContainer } from "@/components/features/plan/plan-container";
import { CodeLanguageToggle } from "@/components/code-language-toggle";
import { BackButton } from "@/components/back-button";

export default function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { topic, isLoading } = useTopicWithFallback(id);
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const preferredLanguage = useStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useStore((s) => s.setPreferredLanguage);
  const hydrated = useHydrated();

  if (!hydrated || isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-muted/40 rounded" />
        <div className="h-8 w-64 bg-muted/40 rounded" />
        <div className="h-2 w-full rounded-full bg-muted/30" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-border/30 bg-surface p-4 h-16" />
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
      <CodeLanguageToggle value={preferredLanguage} onChange={setPreferredLanguage} className="mb-4" />
      <PlanContainer topicId={topic.id!} topicName={topic.name} />
    </div>
  );
}
