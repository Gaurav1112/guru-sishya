"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTopicWithFallback } from "@/hooks/use-topic-with-fallback";
import { QuizContainer } from "@/components/features/quiz/quiz-container";
import { CodeLanguageToggle } from "@/components/code-language-toggle";
import { BackButton } from "@/components/back-button";

export default function QuizPage({
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
      <div className="flex flex-col gap-4 max-w-xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-muted/40 rounded" />
        <div className="h-8 w-48 bg-muted/40 rounded" />
        <div className="h-64 rounded-xl border border-border/30 bg-surface" />
        <div className="flex gap-3 justify-center">
          <div className="h-10 w-32 bg-muted/30 rounded-lg" />
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
    <main role="main" aria-label={`Quiz for ${topic.name}`}>
      <BackButton href={`/app/topic/${id}`} label="Back to Topic" />
      <CodeLanguageToggle value={preferredLanguage} onChange={setPreferredLanguage} className="mb-4" />
      <QuizContainer topicId={topic.id!} topicName={topic.name} />
    </main>
  );
}
