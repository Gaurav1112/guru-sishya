"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FeynmanStatus } from "@/lib/stores/chat-slice";

const PHASE_HINTS: Partial<Record<FeynmanStatus, string>> = {
  priming: "Share what you already know about this concept…",
  recalling: "Explain this concept in your own words, as if teaching a friend…",
  probing: "Think carefully and answer the question above…",
  struggling: "Work through the edge case — what do you think?",
  verifying: "Give your best complete explanation of the concept…",
};

interface ChatInputProps {
  status: FeynmanStatus;
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ status, onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hint = PHASE_HINTS[status] ?? "Type your response…";
  const isDisabled = disabled || status === "loading" || status === "teaching" || status === "reteaching" || status === "complete";

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (status === "complete") return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      {status === "loading" || status === "teaching" || status === "reteaching" ? (
        <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-saffron" />
          <span>Thinking…</span>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground italic">{hint}</p>
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              placeholder="Your response…"
              rows={1}
              className={cn(
                "flex-1 resize-none rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-saffron/50 focus:border-saffron",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors min-h-[40px]"
              )}
            />
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() || isDisabled}
              size="sm"
              className="shrink-0 bg-saffron hover:bg-saffron/90 text-white h-10 w-10 p-0"
            >
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </p>
        </>
      )}
    </div>
  );
}
