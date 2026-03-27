"use client";

import { useState } from "react";
import { RefreshCw, Copy, Printer, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeatureLimit } from "@/hooks/use-feature-limit";
import { toast } from "sonner";

interface CheatsheetActionsProps {
  markdown: string;
  onRegenerate: () => void;
  isRegenerating?: boolean;
}

export function CheatsheetActions({
  markdown,
  onRegenerate,
  isRegenerating = false,
}: CheatsheetActionsProps) {
  const [copied, setCopied] = useState(false);
  const exportLimit = useFeatureLimit("cheatsheet_export");

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available — silently ignore
    }
  };

  const handlePrint = () => {
    if (!exportLimit.allowed) {
      toast("Cheatsheet export is a Pro feature. Upgrade to export.", {
        action: { label: "Upgrade", onClick: () => window.location.assign("/app/pricing") },
      });
      return;
    }
    window.print();
  };

  const handleReviewLater = () => {
    // Placeholder: full reminder system coming in a future release
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={onRegenerate}
        variant="outline"
        size="sm"
        disabled={isRegenerating}
        className="text-muted-foreground hover:text-foreground"
      >
        <RefreshCw
          className={`size-3.5 mr-1.5 ${isRegenerating ? "animate-spin" : ""}`}
        />
        Regenerate
      </Button>

      <Button
        onClick={handleCopyMarkdown}
        variant="outline"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 mr-1.5 text-teal" />
        ) : (
          <Copy className="size-3.5 mr-1.5" />
        )}
        {copied ? "Copied!" : "Copy Markdown"}
      </Button>

      <Button
        onClick={handlePrint}
        variant="outline"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <Printer className="size-3.5 mr-1.5" />
        Print / Export
      </Button>

      <Button
        onClick={handleReviewLater}
        variant="outline"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        <Clock className="size-3.5 mr-1.5" />
        Review Later
      </Button>
    </div>
  );
}
