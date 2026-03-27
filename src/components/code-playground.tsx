"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Play, RotateCcw, Terminal, Code2, ChevronDown, ChevronUp, Loader2, Clock, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { runJava, runC, runCpp, runPython, runJavaScriptSandboxed, type RunResult } from "@/lib/code-runner";

// Monaco must be dynamically imported with ssr: false
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export interface TestCase {
  input?: string;
  expectedOutput: string;
  description?: string;
}

export type PlaygroundLanguage = "javascript" | "typescript" | "python" | "java" | "c" | "cpp";

interface CodePlaygroundProps {
  defaultCode?: string;
  /** Per-language code map — when provided, switching language also switches code */
  codeByLanguage?: Partial<Record<PlaygroundLanguage, string>>;
  language?: PlaygroundLanguage;
  testCases?: TestCase[];
  readOnly?: boolean;
  height?: number;
  title?: string;
  className?: string;
}

// ── JS / TS execution engine ──────────────────────────────────────────────────
// JS/TS execution is handled via sandboxed iframe (runJavaScriptSandboxed)
// imported from code-runner. No main-thread execution of arbitrary code.

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
# Runs in-browser via Pyodide (WebAssembly) — no internet needed after first load

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
print("2 + 2 =", 2 + 2)
`,
  java: `// Java Playground
// Compiled and run via Judge0 CE (OpenJDK 17)

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
  c: `// C Playground
// Compiled and run via Judge0 CE (GCC 14)

#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("2 + 2 = %d\\n", 2 + 2);
    return 0;
}
`,
  cpp: `// C++ Playground
// Compiled and run via Judge0 CE (G++ 14)

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "2 + 2 = " << (2 + 2) << endl;
    return 0;
}
`,
};

// ── Language selector ─────────────────────────────────────────────────────────

const LANGUAGES: { value: PlaygroundLanguage; label: string; monacoLang: string; remote?: boolean }[] = [
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "typescript", label: "TypeScript", monacoLang: "typescript" },
  { value: "python", label: "Python", monacoLang: "python" },
  { value: "java", label: "Java", monacoLang: "java", remote: true },
  { value: "c", label: "C", monacoLang: "c", remote: true },
  { value: "cpp", label: "C++", monacoLang: "cpp", remote: true },
];

// ── Main component ────────────────────────────────────────────────────────────

// Simple heuristic: detect placeholder / stub code
function isPlaceholderCode(code: string): boolean {
  const lower = code.toLowerCase();
  return (
    lower.includes("# placeholder") ||
    lower.includes("// placeholder") ||
    lower.includes("pass  # implement") ||
    lower.includes("pass # implement") ||
    lower.includes("throw new unsupportedoperationexception") ||
    (lower.includes("todo") && lower.includes("implement") && code.trim().split("\n").length < 10)
  );
}

export function CodePlayground({
  defaultCode,
  codeByLanguage,
  language: initialLanguage = "javascript",
  testCases,
  readOnly = false,
  height = 300,
  title,
  className,
}: CodePlaygroundProps) {
  const [language, setLanguage] = useState<PlaygroundLanguage>(initialLanguage);
  const initialCode = codeByLanguage?.[initialLanguage] ?? defaultCode ?? DEFAULT_CODE[initialLanguage];
  const [code, setCode] = useState<string>(initialCode);
  const [output, setOutput] = useState<string>("");
  const [outputError, setOutputError] = useState<boolean>(false);
  const [running, setRunning] = useState(false);
  const [runnerLabel, setRunnerLabel] = useState<string>("");
  const [runStatus, setRunStatus] = useState<string>("");
  const [execMs, setExecMs] = useState<number | null>(null);
  const [outputVisible, setOutputVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const editorRef = useRef<unknown>(null);

  // When language changes, sync the editor to the language-specific code
  useEffect(() => {
    if (codeByLanguage && codeByLanguage[language]) {
      setCode(codeByLanguage[language]!);
    }
  }, [language, codeByLanguage]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutputVisible(true);
    setOutput("");
    setExecMs(null);
    setRunnerLabel("");

    try {
      if (language === "java") {
        setRunStatus("Compiling via Judge0...");
        const result: RunResult = await runJava(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
        setRunnerLabel("Judge0 CE (Java 17)");
        setExecMs(result.durationMs ?? null);
      } else if (language === "c") {
        setRunStatus("Compiling via Judge0...");
        const result: RunResult = await runC(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
        setRunnerLabel("Judge0 CE (GCC 14)");
        setExecMs(result.durationMs ?? null);
      } else if (language === "cpp") {
        setRunStatus("Compiling via Judge0...");
        const result: RunResult = await runCpp(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
        setRunnerLabel("Judge0 CE (G++ 14)");
        setExecMs(result.durationMs ?? null);
      } else if (language === "python") {
        setRunStatus("Loading Python runtime...");
        // Small delay so "Loading Python runtime..." is visible before worker starts
        await new Promise((r) => setTimeout(r, 50));
        setRunStatus("Running Python...");
        const result: RunResult = await runPython(code);
        const combined = [result.output, result.error].filter(Boolean).join("\n");
        setOutput(combined || "(no output)");
        setOutputError(result.isError);
        setRunnerLabel(result.runner === "pyodide" ? "Pyodide (Web Worker)" : "Judge0 CE (Python)");
        setExecMs(result.durationMs ?? null);
      } else {
        setRunStatus("Running in sandbox...");
        // TypeScript: strip type annotations via a naive regex before running
        let runnable = code;
        if (language === "typescript") {
          runnable = code
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
            .replace(/\)\s*:\s*[\w<>\[\]|&]+/g, ")")
            .replace(/(\w+)\s*:\s*[\w<>\[\]|&]+(\s*[,)])/g, "$1$2")
            .replace(/\s+as\s+[\w<>\[\]|&]+/g, "")
            .replace(/:\s*[\w<>\[\]|&]+(\s*=)/g, "$1");
        }

        const result: RunResult = await runJavaScriptSandboxed(runnable);
        setOutput(result.output || "(no output)");
        setOutputError(result.isError);
        setRunnerLabel("sandboxed iframe");
        setExecMs(result.durationMs ?? null);
      }
    } catch (e) {
      setOutput(e instanceof Error ? e.message : String(e));
      setOutputError(true);
    } finally {
      setRunStatus("");
      setRunning(false);
    }
  }, [code, language]);

  const handleReset = useCallback(() => {
    setCode(codeByLanguage?.[language] ?? defaultCode ?? DEFAULT_CODE[language]);
    setOutput("");
    setOutputError(false);
    setOutputVisible(false);
    setRunnerLabel("");
    setRunStatus("");
    setExecMs(null);
  }, [defaultCode, codeByLanguage, language]);

  const handleLanguageChange = useCallback((lang: PlaygroundLanguage) => {
    setLanguage(lang);
    if (codeByLanguage?.[lang] !== undefined) {
      setCode(codeByLanguage[lang]!);
    } else if (!defaultCode) {
      setCode(DEFAULT_CODE[lang]);
    }
    setOutput("");
    setOutputError(false);
    setOutputVisible(false);
    setRunnerLabel("");
    setRunStatus("");
    setExecMs(null);
  }, [defaultCode, codeByLanguage]);

  const handleCopyOutput = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [output]);

  const handleClearOutput = useCallback(() => {
    setOutput("");
    setOutputError(false);
    setOutputVisible(false);
    setRunnerLabel("");
    setExecMs(null);
  }, []);

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

      {/* ── Placeholder notice ───────────────────────────────────────────── */}
      {isPlaceholderCode(code) && (
        <div className="px-3 py-2 bg-[#252526] border-b border-[#3c3c3c] text-xs text-amber-400 italic">
          Real implementation coming soon. Try the Java version above.
        </div>
      )}

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
            className="gap-1.5 bg-saffron text-black hover:bg-saffron/90 border-0 font-semibold text-xs h-7 shrink-0"
          >
            {running ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Play className="size-3 fill-current" />
            )}
            {running ? "Running..." : "Run Code"}
          </Button>

          {/* Status message while running */}
          {running && runStatus && (
            <span className="text-[10px] text-amber-400/80 italic truncate">
              {runStatus}
            </span>
          )}

          {/* Idle hints */}
          {!running && !runStatus && language === "python" && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              runs in-browser (Pyodide)
            </span>
          )}
          {!running && !runStatus && (language === "java" || language === "c" || language === "cpp") && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              compiles via cloud (Judge0 CE)
            </span>
          )}

          {outputVisible && (
            <button
              type="button"
              onClick={() => setOutputVisible((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto shrink-0"
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
            {runnerLabel && (
              <span className="text-[10px] text-muted-foreground/50 italic ml-1">
                via {runnerLabel}
              </span>
            )}
            {execMs !== null && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Clock className="size-2.5" />
                {execMs < 1000 ? `${execMs}ms` : `${(execMs / 1000).toFixed(1)}s`}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1">
              {output && (
                <button
                  type="button"
                  onClick={handleCopyOutput}
                  title="Copy output"
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy className="size-3" />
                  {copied && (
                    <span className="ml-1 text-[9px] text-green-400">Copied!</span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleClearOutput}
                title="Clear output"
                className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
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
