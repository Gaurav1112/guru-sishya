"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/markdown-renderer";

// ────────────────────────────────────────────────────────────────────────────
// Chat message component
// ────────────────────────────────────────────────────────────────────────────

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-saffron/20 text-foreground rounded-br-sm border border-saffron/30"
            : "bg-surface text-foreground rounded-bl-sm border border-border"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="prose-feynman">
            <MarkdownRenderer content={content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-saffron animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
