"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { useStore } from "@/lib/store";
import { getAvailableTopics } from "@/lib/content/loader";

export function TopicInput() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();
  const aiProvider = useStore((s) => s.aiProvider);

  // Load available pre-generated topics when using static provider
  useEffect(() => {
    if (aiProvider === "static") {
      getAvailableTopics().then(setSuggestions).catch(() => {});
    } else {
      setSuggestions([]);
    }
  }, [aiProvider]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    await createTopic(topic.trim());
  }

  async function createTopic(name: string) {
    setLoading(true);
    const id = await db.topics.add({
      name,
      category: "General",
      createdAt: new Date(),
    });
    router.push(`/app/topic/${id}`);
  }

  // Filter suggestions based on current input
  const filteredSuggestions = topic.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(topic.toLowerCase()) &&
          s.toLowerCase() !== topic.toLowerCase()
      )
    : suggestions;

  return (
    <div className="w-full max-w-md space-y-3">
      <form onSubmit={handleSubmit} className="flex w-full gap-2">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., System Design, Guitar, Machine Learning..."
          className="bg-surface"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={!topic.trim() || loading}
          className="bg-saffron hover:bg-saffron/90"
        >
          {loading ? "Creating..." : "Learn"}
        </Button>
      </form>

      {/* Show available pre-generated topics as clickable pills */}
      {suggestions.length > 0 && filteredSuggestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {topic.trim()
              ? "Matching built-in topics:"
              : "Built-in topics (click to start):"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filteredSuggestions.slice(0, 12).map((name) => (
              <button
                key={name}
                type="button"
                disabled={loading}
                onClick={() => createTopic(name)}
                className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs text-foreground hover:bg-muted/50 hover:border-saffron/50 transition-colors disabled:opacity-50"
              >
                {name}
              </button>
            ))}
            {filteredSuggestions.length > 12 && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground">
                +{filteredSuggestions.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
