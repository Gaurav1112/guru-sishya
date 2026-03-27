"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { QuizContainer } from "@/components/features/quiz/quiz-container";
import { CodeLanguageToggle } from "@/components/code-language-toggle";
import { BackButton } from "@/components/back-button";

export default function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const topic = useLiveQuery(async () => (await db.topics.get(Number(id))) ?? null, [id]);
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const preferredLanguage = useStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useStore((s) => s.setPreferredLanguage);
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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

  if (topic === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
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
      <QuizContainer topicId={topic.id!} topicName={topic.name} />
    </div>
  );
}
