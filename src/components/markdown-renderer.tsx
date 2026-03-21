"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Shared markdown renderer used by cheat sheets, quiz feedback, plan content,
 * and Feynman chat. Supports GFM (tables, strikethrough, task lists) and
 * renders ```mermaid code blocks as interactive diagrams.
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Custom code block renderer — detects mermaid blocks
        code({ className: codeClassName, children, ...props }) {
          const match = /language-(\w+)/.exec(codeClassName ?? "");
          const language = match?.[1];
          const codeString = String(children).replace(/\n$/, "");

          // Mermaid diagrams get their own renderer
          if (language === "mermaid") {
            return <MermaidDiagram chart={codeString} />;
          }

          // Block code (has a language class or multi-line)
          const isBlock =
            codeClassName != null ||
            codeString.includes("\n");

          if (isBlock) {
            return (
              <pre className="overflow-x-auto rounded-lg border border-border bg-muted p-4 my-4">
                <code
                  className={`text-sm font-mono text-foreground ${codeClassName ?? ""}`}
                  {...props}
                >
                  {codeString}
                </code>
              </pre>
            );
          }

          // Inline code
          return (
            <code
              className="rounded px-1.5 py-0.5 bg-muted text-sm font-mono text-saffron"
              {...props}
            >
              {children}
            </code>
          );
        },

        // Section headers with visual hierarchy
        h1({ children }) {
          return (
            <h1 className="font-heading text-2xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border">
              {children}
            </h1>
          );
        },
        h2({ children }) {
          return (
            <h2 className="font-heading text-xl font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-saffron inline-block shrink-0" />
              {children}
            </h2>
          );
        },
        h3({ children }) {
          return (
            <h3 className="font-heading text-base font-semibold text-foreground mt-4 mb-2">
              {children}
            </h3>
          );
        },

        // Paragraphs
        p({ children }) {
          return (
            <p className="text-foreground/90 leading-relaxed mb-3">{children}</p>
          );
        },

        // Lists
        ul({ children }) {
          return (
            <ul className="list-disc list-outside ml-5 space-y-1 mb-3 text-foreground/90">
              {children}
            </ul>
          );
        },
        ol({ children }) {
          return (
            <ol className="list-decimal list-outside ml-5 space-y-1 mb-3 text-foreground/90">
              {children}
            </ol>
          );
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>;
        },

        // Tables
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4 rounded-lg border border-border">
              <table className="w-full text-sm">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return <thead className="bg-muted/70">{children}</thead>;
        },
        th({ children }) {
          return (
            <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-4 py-2 text-foreground/85 border-b border-border/50">
              {children}
            </td>
          );
        },
        tr({ children }) {
          return (
            <tr className="hover:bg-surface-hover transition-colors">{children}</tr>
          );
        },

        // Blockquotes
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-saffron/50 pl-4 my-4 text-muted-foreground italic">
              {children}
            </blockquote>
          );
        },

        // Strong / emphasis
        strong({ children }) {
          return (
            <strong className="font-semibold text-gold">{children}</strong>
          );
        },
        em({ children }) {
          return <em className="italic text-foreground/80">{children}</em>;
        },

        // Horizontal rule
        hr() {
          return <hr className="border-border my-6" />;
        },

        // Links
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal underline underline-offset-2 hover:text-teal/80 transition-colors"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
