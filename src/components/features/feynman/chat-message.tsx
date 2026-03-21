"use client";

import { useEffect, useRef, memo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Mermaid diagram renderer
// ────────────────────────────────────────────────────────────────────────────

interface MermaidDiagramProps {
  code: string;
}

function MermaidDiagram({ code }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!ref.current) return;
      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#d97706",
            primaryTextColor: "#faf7f0",
            primaryBorderColor: "#78716c",
            lineColor: "#57534e",
            secondaryColor: "#1e1b4b",
            tertiaryColor: "#1c1917",
            background: "#0f0e1a",
            mainBkg: "#1c1b2e",
            nodeBorder: "#57534e",
            clusterBkg: "#1c1b2e",
            titleColor: "#faf7f0",
            edgeLabelBackground: "#1c1b2e",
          },
        });
        if (cancelled) return;
        const { svg } = await mermaid.render(idRef.current, code);
        if (cancelled) return;
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch {
        if (ref.current && !cancelled) {
          ref.current.innerHTML = `<pre class="text-xs text-muted-foreground whitespace-pre-wrap p-2">${code}</pre>`;
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div
      ref={ref}
      className="my-3 rounded-lg border border-border bg-surface p-3 overflow-x-auto"
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Markdown renderer with inline Mermaid support
// ────────────────────────────────────────────────────────────────────────────

interface MarkdownWithMermaidProps {
  content: string;
}

function MarkdownWithMermaid({ content }: MarkdownWithMermaidProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        code(props: any) {
          const { className, children, ...rest } = props;
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1];

          if (lang === "mermaid") {
            const code = String(children).replace(/\n$/, "");
            return <MermaidDiagram code={code} />;
          }

          // Inline code
          if (!className) {
            return (
              <code
                className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-saffron"
                {...rest}
              >
                {children}
              </code>
            );
          }

          // Fenced code block (non-mermaid)
          return (
            <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3">
              <code className={cn("font-mono text-xs", className)} {...rest}>
                {children}
              </code>
            </pre>
          );
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
        },
        ul({ children }) {
          return <ul className="my-2 list-disc pl-4 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="my-2 list-decimal pl-4 space-y-1">{children}</ol>;
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-foreground">{children}</strong>;
        },
        h1({ children }) {
          return <h1 className="text-lg font-heading font-bold mb-2 mt-3">{children}</h1>;
        },
        h2({ children }) {
          return <h2 className="text-base font-heading font-semibold mb-2 mt-3">{children}</h2>;
        },
        h3({ children }) {
          return <h3 className="text-sm font-heading font-semibold mb-1 mt-2">{children}</h3>;
        },
        blockquote({ children }) {
          return (
            <blockquote className="my-2 border-l-2 border-saffron/50 pl-3 text-muted-foreground italic">
              {children}
            </blockquote>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

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
            <MarkdownWithMermaid content={content} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-saffron animate-pulse rounded-sm ml-0.5" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
