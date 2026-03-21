"use client";

import { MarkdownRenderer } from "@/components/markdown-renderer";
import { CheatsheetActions } from "./cheatsheet-actions";

interface CheatsheetViewerProps {
  topicName: string;
  content: string;
  version: number;
  createdAt: Date;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function CheatsheetViewer({
  topicName,
  content,
  version,
  createdAt,
  onRegenerate,
  isRegenerating = false,
}: CheatsheetViewerProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Cheat Sheet
          </p>
          <h1 className="font-heading text-2xl font-bold">{topicName}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Version {version} &middot; Generated{" "}
            {createdAt.toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        <CheatsheetActions
          markdown={content}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
        />
      </div>

      {/* Cheat sheet content */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8 print:border-0 print:p-0 print:bg-transparent">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}
