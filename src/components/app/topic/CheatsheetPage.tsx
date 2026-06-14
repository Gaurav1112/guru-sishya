"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { useTopicWithFallback } from "@/hooks/use-topic-with-fallback";
import { CheatsheetContainer } from "@/components/features/cheatsheet/cheatsheet-container";
import { CodeLanguageToggle } from "@/components/code-language-toggle";
import { BackButton } from "@/components/back-button";

export default function CheatsheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { topic, isLoading } = useTopicWithFallback(id);
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const preferredLanguage = useStore((s) => s.preferredLanguage);
  const setPreferredLanguage = useStore((s) => s.setPreferredLanguage);
  const hydrated = useHydrated();

  const isActivePremium = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

  if (!hydrated || isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto animate-pulse">
        <div className="h-4 w-24 bg-muted/40 rounded" />
        <div className="h-8 w-48 bg-muted/40 rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-4 w-full bg-muted/30 rounded" />
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

  // Cheatsheet content is always visible — only export/download is gated for non-premium users
  return (
    <div>
      <BackButton href={`/app/topic/${id}`} label="Back to Topic" />
      <CodeLanguageToggle value={preferredLanguage} onChange={setPreferredLanguage} className="mb-4" />
      {!isActivePremium && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-saffron/30 bg-saffron/5 px-4 py-2.5 mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Export & download</span> is a Pro feature. Content is free to read.
          </p>
          <a href="/app/pricing" className="shrink-0 text-xs font-semibold text-saffron underline whitespace-nowrap">
            Upgrade
          </a>
        </div>
      )}
      <CheatsheetContainer topicId={topic.id!} topicName={topic.name} languageFilter={preferredLanguage} />
    </div>
  );
}

