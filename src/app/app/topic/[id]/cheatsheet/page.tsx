"use client";
import { use } from "react";
import { Loader2 } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { CheatsheetContainer } from "@/components/features/cheatsheet/cheatsheet-container";
import { PremiumGate } from "@/components/premium-gate";

// First 10 topics (by Dexie ID) are free for all users
const FREE_CHEATSHEET_LIMIT = 10;

export default function CheatsheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const topicId = Number(id);
  const topic = useLiveQuery(async () => (await db.topics.get(topicId)) ?? null, [topicId]);
  const apiKey = useStore((s) => s.apiKey);
  const aiProvider = useStore((s) => s.aiProvider);
  const isPremium = useStore((s) => s.isPremium);
  const premiumUntil = useStore((s) => s.premiumUntil);
  const hydrated = useHydrated();

  const isActivePremium = isPremium && premiumUntil != null && new Date(premiumUntil) > new Date();

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

  // Gate cheat sheets for topics beyond the free limit for non-premium users
  const isGated = !isActivePremium && topicId > FREE_CHEATSHEET_LIMIT;

  if (isGated) {
    return (
      <div className="max-w-xl mx-auto py-4 space-y-4">
        <div>
          <h1 className="font-heading text-xl font-bold">{topic.name}</h1>
          <p className="text-xs text-muted-foreground mt-1">Cheat Sheet</p>
        </div>
        <PremiumGate feature="full-cheatsheets" overlay={false}>
          <CheatsheetContainer topicId={topic.id!} topicName={topic.name} />
        </PremiumGate>
      </div>
    );
  }

  return <CheatsheetContainer topicId={topic.id!} topicName={topic.name} />;
}

