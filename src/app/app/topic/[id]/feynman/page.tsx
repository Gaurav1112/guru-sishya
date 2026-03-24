"use client";
import { use } from "react";
import { Loader2, Brain, Lightbulb, RefreshCw, MessageSquare } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/hooks/use-hydrated";
import { FeynmanContainer } from "@/components/features/feynman/feynman-container";
import { PremiumGate } from "@/components/premium-gate";

function FeynmanPreview() {
  return (
    <div className="max-w-xl mx-auto space-y-6 py-4">
      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="size-5 text-saffron" />
          <h2 className="font-heading text-lg font-bold">The Feynman Technique</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Feynman Technique helps you truly understand concepts by teaching them in your own words.
          If you can&apos;t explain it simply, you don&apos;t understand it yet.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border/50 bg-surface p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How it works</p>
        <div className="space-y-2.5">
          {[
            { icon: <Brain className="size-3.5 text-saffron" />, step: "1. Prime", desc: "Share what you already know about the concept." },
            { icon: <Lightbulb className="size-3.5 text-gold" />, step: "2. Teach", desc: "Explain the concept as if teaching a 10-year-old." },
            { icon: <RefreshCw className="size-3.5 text-teal" />, step: "3. Recall & Refine", desc: "Identify gaps, re-teach with better analogies." },
            { icon: <MessageSquare className="size-3.5 text-indigo-400" />, step: "4. Verify Mastery", desc: "Prove true understanding through probing questions." },
          ].map(({ icon, step, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted/50">
                {icon}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground">{step}</span>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gate */}
      <PremiumGate feature="feynman" overlay={false} />
    </div>
  );
}

export default function FeynmanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const topic = useLiveQuery(async () => (await db.topics.get(Number(id))) ?? null, [id]);
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

  // Gate entire feature for free users — show preview + gate
  if (!isActivePremium) {
    return <FeynmanPreview />;
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

  return <FeynmanContainer topicId={topic.id!} topicName={topic.name} />;
}
