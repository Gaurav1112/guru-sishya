"use client";

/**
 * CodeTabs — shows the same algorithm in multiple languages with a tab toggle.
 *
 * Props:
 *   codes: { language: string; code: string }[]
 *   height?: number   (Monaco editor height, default 300)
 *   title?: string
 *   className?: string
 *
 * Supported language labels (case-insensitive match):
 *   python | java | javascript | typescript
 *
 * Remembers the user's preferred language in localStorage under the key
 * "guru-preferred-lang". Falls back to the first available language.
 */

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LangCode {
  language: string; // e.g. "python", "java", "javascript", "typescript"
  code: string;
}

interface CodeTabsProps {
  codes: LangCode[];
  height?: number;
  title?: string;
  className?: string;
}

// ── Language metadata ──────────────────────────────────────────────────────────

const LANG_META: Record<
  string,
  { label: string; monacoId: string; badgeClass: string }
> = {
  python: {
    label: "Python",
    monacoId: "python",
    badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  java: {
    label: "Java",
    monacoId: "java",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  javascript: {
    label: "JavaScript",
    monacoId: "javascript",
    badgeClass: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  typescript: {
    label: "TypeScript",
    monacoId: "typescript",
    badgeClass: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  c: {
    label: "C",
    monacoId: "c",
    badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  cpp: {
    label: "C++",
    monacoId: "cpp",
    badgeClass: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  },
};

const LANG_ORDER = ["python", "java", "javascript", "typescript", "c", "cpp"];
const STORAGE_KEY = "guru-preferred-lang";

function normalizeLang(raw: string): string {
  const lower = raw.toLowerCase().trim();
  if (lower === "py") return "python";
  if (lower === "js") return "javascript";
  if (lower === "ts") return "typescript";
  if (lower === "c++") return "cpp";
  return lower;
}

function getMeta(lang: string) {
  return (
    LANG_META[normalizeLang(lang)] ?? {
      label: lang,
      monacoId: "plaintext",
      badgeClass: "bg-muted text-muted-foreground border-border",
    }
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export function CodeTabs({ codes, height = 300, title, className }: CodeTabsProps) {
  // Sort the available languages into a canonical order
  const sortedCodes = [...codes].sort((a, b) => {
    const ai = LANG_ORDER.indexOf(normalizeLang(a.language));
    const bi = LANG_ORDER.indexOf(normalizeLang(b.language));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const availableLangs = sortedCodes.map((c) => normalizeLang(c.language));

  // Always start with first available lang for SSR consistency, then sync from localStorage
  const [activeLang, setActiveLang] = useState<string>(availableLangs[0] ?? "python");

  // Sync from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && availableLangs.includes(stored) && stored !== activeLang) {
      setActiveLang(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback(
    (lang: string) => {
      setActiveLang(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        /* ignore storage errors in private browsing */
      }
    },
    []
  );

  const activeEntry = sortedCodes.find((c) => normalizeLang(c.language) === activeLang);
  const activeCode = activeEntry?.code ?? sortedCodes[0]?.code ?? "";
  const activeMeta = getMeta(activeLang);

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden bg-[#1e1e1e]", className)}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-saffron" />
          {title && (
            <span className="text-xs font-semibold text-foreground">{title}</span>
          )}
        </div>

        {/* Language tabs */}
        <div className="flex items-center gap-1 rounded-md bg-[#3c3c3c] p-0.5">
          {sortedCodes.map((entry) => {
            const lang = normalizeLang(entry.language);
            const meta = getMeta(lang);
            const isActive = lang === activeLang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleSelect(lang)}
                className={cn(
                  "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-saffron text-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Monaco viewer (read-only) ─────────────────────────────────────── */}
      <div style={{ height }}>
        <MonacoEditor
          key={activeLang} // force remount on language switch so syntax highlighting refreshes
          height="100%"
          language={activeMeta.monacoId}
          value={activeCode}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            folding: false,
            lineNumbers: "on",
            glyphMargin: false,
            wordWrap: "on",
            automaticLayout: true,
            renderLineHighlight: "none",
            overviewRulerLanes: 0,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
            contextmenu: false,
            links: false,
          }}
        />
      </div>

      {/* ── Language badge ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-t border-[#3c3c3c]">
        <span
          className={cn(
            "text-[10px] font-mono rounded px-1.5 py-0.5 border",
            activeMeta.badgeClass
          )}
        >
          {activeMeta.label}
        </span>
        <span className="text-[10px] text-muted-foreground">Read-only</span>
      </div>
    </div>
  );
}
