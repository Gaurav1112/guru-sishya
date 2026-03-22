"use client";

import { useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConceptInputProps {
  topicName: string;
  onStart: (concept: string) => void;
  isLoading?: boolean;
}

export function ConceptInput({
  topicName,
  onStart,
  isLoading = false,
}: ConceptInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onStart(trimmed);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto py-8">
      <div className="text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-saffron/10 ring-2 ring-saffron/20 mx-auto mb-4">
          <Lightbulb className="size-7 text-saffron" />
        </div>
        <h2 className="text-xl font-heading font-bold mb-2">
          Feynman Technique
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          The best way to learn is to teach. Tell me what concept from{" "}
          <span className="text-foreground font-medium">{topicName}</span>{" "}you
          want to truly understand — I&apos;ll guide you through explaining it
          until it clicks.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="concept-input"
            className="text-sm font-medium text-foreground"
          >
            What concept do you want to learn?
          </label>
          <input
            id="concept-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`e.g. "recursion", "gradient descent", "supply and demand"…`}
            disabled={isLoading}
            autoFocus
            className={cn(
              "w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-colors"
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={!value.trim() || isLoading}
          className="w-full bg-saffron hover:bg-saffron/90 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Starting session…
            </>
          ) : (
            "Start Learning"
          )}
        </Button>
      </form>

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          How it works
        </p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Tell me what you already know</li>
          <li>I&apos;ll teach you with a diagram and analogy</li>
          <li>You explain it back to me in your own words</li>
          <li>I probe your gaps with Socratic questions</li>
          <li>We repeat until you truly master it (up to 4 rounds)</li>
        </ol>
      </div>
    </div>
  );
}
