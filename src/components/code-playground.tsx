"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Play, RotateCcw, Terminal, Code2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { runJava, runPython } from "@/lib/code-runner";

// Monaco must be dynamically imported with ssr: false
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface TestCase {
  input?: string;
  expectedOutput: string;
  description?: string;
}

export type PlaygroundLanguage = "javascript" | "typescript" | "python" | "java";

interface CodePlaygroundProps {
  defaultCode?: string;
  language?: PlaygroundLanguage;
  testCases?: TestCase[];
  readOnly?: boolean;
  height?: number;
  title?: string;
  className?: string;
}

// ── JS / TS execution engine ──────────────────────────────────────────────────

function executeJavaScript(code: string): { output: string; error: string | null } {
  const logs: string[] = [];
  const errors: string[] = [];

  // Capture console.log / console.error / console.warn
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const stringify = (v: unknown): string => {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (typeof v === "string") return v;
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  };

  console.log = (...args: unknown[]) => logs.push(args.map(stringify).join(" "));
  console.error = (...args: unknown[]) => errors.push("Error: " + args.map(stringify).join(" "));
  console.warn = (...args: unknown[]) => logs.push("Warn: " + args.map(stringify).join(" "));

  let timedOut = false;

  try {
    // Wrap in a timeout-guarded async IIFE using a sync proxy
    // We use Date.now() checks inside the function to detect runaway loops
    const startTime = Date.now();
    const MAX_MS = 5000;

    // Inject a __checkTimeout helper the user code can't easily remove
    const wrappedCode = `
"use strict";
const __start = ${startTime};
const __checkTimeout = () => {
  if (Date.now() - __start > ${MAX_MS}) throw new Error("Execution timed out after ${MAX_MS / 1000}s");
};
${code}
`;
    // eslint-disable-next-line no-new-func
    const fn = new Function(wrappedCode);
    fn();

    if (Date.now() - startTime > MAX_MS) {
      timedOut = true;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("timed out")) timedOut = true;
    else errors.push(msg);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  }

  if (timedOut) {
    return { output: "", error: "Execution timed out after 5 seconds. Check for infinite loops." };
  }

  const combined = [...logs, ...errors].join("\n");
  return {
    output: combined || "(no output)",
    error: errors.length > 0 ? errors.join("\n") : null,
  };
}

const DEFAULT_CODE: Record<PlaygroundLanguage, string> = {
  javascript: `// JavaScript Playground
// console.log() output appears below

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
console.log("2 + 2 =", 2 + 2);

// Try modifying this code and click Run!
`,
  typescript: `// TypeScript Playground (runs as JavaScript)
// Type annotations are stripped before execution

function add(a: number, b: number): number {
  return a + b;
}

const result: number = add(3, 4);
console.log("3 + 4 =", result);

interface Person {
  name: string;
  age: number;
}

const person: Person = { name: "Ada", age: 36 };
console.log(\`\${person.name} is \${person.age} years old\`);
`,
  python: `# Python Playground
# Runs via Wandbox API (free, no key needed)

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("2 + 2 =", 2 + 2)
`,
  java: `// Java Playground
// Run locally: javac Main.java && java Main

public class Main {
    public static void main(String[] args) {
        System.out.println(greet("World"));
        System.out.println("2 + 2 = " + (2 + 2));
    }

    static String greet(String name) {
        return "Hello, " + name + "!";
    }
}
`,
};

// ── Language selector ─────────────────────────────────────────────────────────

const LANGUAGES: { value: PlaygroundLanguage; label: string; monacoLang: string; remote?: boolean }[] = [
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "typescript", label: "TypeScript", monacoLang: "typescript" },
  { value: "python", label: "Python", monacoLang: "python", remote: true },
  { value: "java", label: "Java", monacoLang: "java", remote: true },
];

// ── Main component ────────────────────────────────────────────────────────────

export function CodePlayground({
  defaultCode,
  language: initialLanguage = "javascript",
  testCases,
  readOnly = false,
  height = 300,
  title,
  className,
}: CodePlaygroundProps) {
  const [language, setLanguage] = useState<PlaygroundLanguage>(initialLanguage);
  const [code, setCode] = useState<string>(defaultCode ?? DEFAULT_CODE[initialLanguage]);
  const [output, setOutput] = useState<string>("");
  const [outputError, setOutputError] = useState<boolean>(false);
  const [running, setRunning] = useState(false);
  const [outputVisible, setOutputVisible] = useState(false);
  const editorRef = useRef<unknown>(null);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutputVisible(true);

    try {
      if (language === "java") {
        // Java: no free remote compiler available — show helpful fallback
        const result = await runJava(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
      } else if (language === "python") {
        // Remote execution via Wandbox API
        const result = await runPython(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
      } else {
        // Local JS/TS execution
        // Small timeout to let the UI update (show spinner) before potentially blocking
        await new Promise((r) => setTimeout(r, 50));

        // TypeScript: strip type annotations via a naive regex before running
        let runnable = code;
        if (language === "typescript") {
          // Strip TS-specific syntax (basic: type annotations, interfaces, as casts)
          runnable = code
            // Remove interface blocks
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
            // Remove type aliases
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
            // Remove return type annotations  :Type
            .replace(/\)\s*:\s*[\w<>\[\]|&]+/g, ")")
            // Remove parameter type annotations  param: Type
            .replace(/(\w+)\s*:\s*[\w<>\[\]|&]+(\s*[,)])/g, "$1$2")
            // Remove `as Type` casts
            .replace(/\s+as\s+[\w<>\[\]|&]+/g, "")
            // Remove const x: Type declarations
            .replace(/:\s*[\w<>\[\]|&]+(\s*=)/g, "$1");
        }

        const { output: out, error } = executeJavaScript(runnable);
        setOutput(out);
        setOutputError(error !== null);
      }
    } catch (e) {
      setOutput(e instanceof Error ? e.message : String(e));
      setOutputError(true);
    } finally {
      setRunning(false);
    }
  }, [code, language]);

  const handleReset = useCallback(() => {
    setCode(defaultCode ?? DEFAULT_CODE[language]);
    setOutput("");
    setOutputError(false);
    setOutputVisible(false);
  }, [defaultCode, language]);

  const handleLanguageChange = useCallback((lang: PlaygroundLanguage) => {
    setLanguage(lang);
    if (!defaultCode) {
      setCode(DEFAULT_CODE[lang]);
    }
    setOutput("");
    setOutputError(false);
    setOutputVisible(false);
  }, [defaultCode]);

  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monacoLang ?? "javascript";

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden bg-[#1e1e1e]", className)}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <Code2 className="size-4 text-saffron" />
          <span className="text-xs font-semibold text-foreground">
            {title ?? "Code Playground"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector — only shown if not read-only */}
          {!readOnly && (
            <div className="flex items-center gap-1 rounded-md bg-[#3c3c3c] p-0.5">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleLanguageChange(lang.value)}
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                    language === lang.value
                      ? "bg-saffron text-black"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}

          {!readOnly && (
            <button
              type="button"
              onClick={handleReset}
              title="Reset code"
              className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Monaco Editor ────────────────────────────────────────────────── */}
      <div style={{ height }}>
        <MonacoEditor
          height="100%"
          language={monacoLang}
          value={code}
          onChange={(val) => !readOnly && setCode(val ?? "")}
          theme="vs-dark"
          options={{
            readOnly,
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
            renderLineHighlight: "line",
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
            },
          }}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>

      {/* ── Run button ───────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#252526] border-t border-[#3c3c3c]">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={running}
            className="gap-1.5 bg-saffron text-black hover:bg-saffron/90 border-0 font-semibold text-xs h-7"
          >
            {running ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3 fill-current" />
            )}
            {running ? "Running..." : "Run Code"}
          </Button>

          {/* Remote execution note for Python */}
          {language === "python" && !running && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              runs via Wandbox API
            </span>
          )}
          {/* Java: no free remote compiler available */}
          {language === "java" && !running && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              run locally with javac, or click Run for instructions
            </span>
          )}

          {outputVisible && (
            <button
              type="button"
              onClick={() => setOutputVisible((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
            >
              <Terminal className="size-3" />
              Output
              {outputVisible ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Output panel ─────────────────────────────────────────────────── */}
      {!readOnly && outputVisible && (
        <div className="border-t border-[#3c3c3c] bg-[#1e1e1e]">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
            <Terminal className="size-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Output
            </span>
          </div>
          <pre
            className={cn(
              "px-4 py-3 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap min-h-[60px] max-h-[240px] overflow-y-auto",
              outputError ? "text-red-400" : "text-green-300"
            )}
          >
            {output || "(no output yet — click Run Code)"}
          </pre>

          {/* Test cases */}
          {testCases && testCases.length > 0 && (
            <div className="border-t border-[#3c3c3c] px-3 py-2 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Expected Output
              </p>
              {testCases.map((tc, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  {tc.description && (
                    <span className="text-muted-foreground shrink-0">{tc.description}:</span>
                  )}
                  <code className="text-saffron font-mono">{tc.expectedOutput}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Read-only code viewer (for quiz) ─────────────────────────────────────────

interface CodeViewerProps {
  code: string;
  language?: PlaygroundLanguage;
  height?: number;
  className?: string;
}

export function CodeViewer({ code, language = "javascript", height = 200, className }: CodeViewerProps) {
  const monacoLang = LANGUAGES.find((l) => l.value === language)?.monacoLang ?? "javascript";

  return (
    <div className={cn("rounded-xl border border-[#3c3c3c] overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
        <Code2 className="size-3.5 text-saffron" />
        <span className="text-xs text-muted-foreground font-medium capitalize">{language}</span>
      </div>
      <div style={{ height }}>
        <MonacoEditor
          height="100%"
          language={monacoLang}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            scrollBeyondLastLine: false,
            padding: { top: 10, bottom: 10 },
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
    </div>
  );
}
