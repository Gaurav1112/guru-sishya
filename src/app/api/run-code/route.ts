// ── /api/run-code — server-side code execution proxy ──────────────────────────
//
// Handles Java and other compiled languages (C, C++, TypeScript, Python fallback).
// Python runs client-side via Pyodide; JS/TS run in a sandboxed iframe.
// Proxying through the server eliminates CORS issues and lets us apply a
// generous timeout without the browser's preflight overhead.
//
// Backend: Judge0 CE (https://ce.judge0.com) — free, no API key required.
// Synchronous mode (wait=true) returns the result immediately.

import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const JUDGE0_URL =
  "https://ce.judge0.com/submissions?base64_encoded=true&wait=true";

function toBase64(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function fromBase64(str: string): string {
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return str;
  }
}

const LANGUAGE_IDS: Record<string, number> = {
  java:       91,   // Java (JDK 17.0.6)
  python:     100,  // Python (3.12.5)
  javascript: 97,   // JavaScript (Node.js 20.17.0)
  typescript: 101,  // TypeScript (5.6.2)
  c:          104,  // C (GCC 14.1.0)
  cpp:        105,  // C++ (GCC 14.1.0)
};

type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
  runner: "judge0";
  durationMs: number;
  memory?: string;
};

export async function POST(request: NextRequest): Promise<Response> {
  const t0 = Date.now();

  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`run-code:${ip}`, 20, 60000)) {
    return Response.json(
      { error: "Rate limit exceeded. Try again in a minute." },
      { status: 429 }
    );
  }

  let body: { language?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { output: "", error: "Invalid JSON body.", isError: true },
      { status: 400 }
    );
  }

  const { language, code } = body;

  if (!code || typeof code !== "string") {
    return Response.json(
      { output: "", error: "Missing or invalid 'code' field.", isError: true },
      { status: 400 }
    );
  }

  const lang = (language ?? "").toLowerCase();
  const langId = LANGUAGE_IDS[lang];
  if (!langId) {
    return Response.json(
      {
        output: "",
        error: `Language '${language}' is not supported by this endpoint.`,
        isError: true,
      },
      { status: 400 }
    );
  }

  try {
    // For Java: handle three cases:
    // 1. Code has "public class X" where X != Main → rename to Main
    // 2. Code has "class X" (no public) → rename to Main and add public
    // 3. Code is bare methods/snippets (no class declaration) → wrap in Main class
    let javaCode = code;
    if (lang === "java") {
      const hasClass = /\bclass\s+\w+/.test(code);

      if (!hasClass) {
        // Bare snippet — wrap in a Main class with common imports and interview helper types
        const needsListNode = /\bListNode\b/.test(code);
        const needsTreeNode = /\bTreeNode\b/.test(code);
        const needsNode = /\bNode\b/.test(code) && !needsListNode && !needsTreeNode;

        let helpers = "";
        if (needsListNode) helpers += `class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } public String toString() { StringBuilder sb = new StringBuilder(); ListNode c = this; while (c != null) { sb.append(c.val); if (c.next != null) sb.append("->"); c = c.next; } return sb.toString(); } }\n`;
        if (needsTreeNode) helpers += `class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode l, TreeNode r) { this.val = val; left = l; right = r; } }\n`;
        if (needsNode) helpers += `class Node { int val; Node next, random; Node(int v) { val = v; } }\n`;

        const hasMain = /public\s+static\s+void\s+main/.test(code);
        const mainMethod = hasMain ? "" : `\n    public static void main(String[] args) {\n        System.out.println("Compiled successfully. Add a main method to test.");\n    }`;

        javaCode = `import java.util.*;\nimport java.io.*;\nimport java.util.stream.*;\n\n${helpers}\npublic class Main {\n${code}\n${mainMethod}\n}`;
      } else {
        // Has a class — rename to Main, add main if missing, prepend helpers
        const publicClassMatch = code.match(/public\s+class\s+(\w+)/);
        const plainClassMatch = code.match(/\bclass\s+(\w+)/);
        const className = publicClassMatch?.[1] || plainClassMatch?.[1];

        if (className && className !== "Main") {
          javaCode = code
            .replace(new RegExp(`public\\s+class\\s+${className}`), "public class Main")
            .replace(new RegExp(`\\bclass\\s+${className}(?!\\w)`), "public class Main");
        }

        // Add main method if missing — CRITICAL: without this, Judge0 returns "Main method not found"
        const hasMainMethod = /public\s+static\s+void\s+main\s*\(/.test(javaCode);
        if (!hasMainMethod) {
          // Insert main method before the last closing brace of the class
          const lastBrace = javaCode.lastIndexOf("}");
          if (lastBrace !== -1) {
            javaCode =
              javaCode.substring(0, lastBrace) +
              '\n    public static void main(String[] args) {\n        System.out.println("Compiled successfully. Add a main method with test cases to see output.");\n    }\n' +
              javaCode.substring(lastBrace);
          }
        }

        // Prepend helper types if used but not defined
        const needsListNode = /\bListNode\b/.test(javaCode) && !/class\s+ListNode\b/.test(javaCode);
        const needsTreeNode = /\bTreeNode\b/.test(javaCode) && !/class\s+TreeNode\b/.test(javaCode);

        let prefix = "";
        if (!javaCode.includes("import java.util")) {
          prefix += "import java.util.*;\nimport java.io.*;\nimport java.util.stream.*;\n\n";
        }
        if (needsListNode) prefix += `class ListNode { int val; ListNode next; ListNode() {} ListNode(int val) { this.val = val; } ListNode(int val, ListNode next) { this.val = val; this.next = next; } }\n`;
        if (needsTreeNode) prefix += `class TreeNode { int val; TreeNode left, right; TreeNode() {} TreeNode(int val) { this.val = val; } TreeNode(int val, TreeNode l, TreeNode r) { this.val = val; left = l; right = r; } }\n`;

        if (prefix) {
          javaCode = prefix + javaCode;
        }
      }
    }

    const finalCode = lang === "java" ? javaCode : code;
    const submissionBody: Record<string, unknown> = {
      source_code: toBase64(finalCode),
      language_id: langId,
      cpu_time_limit: 5,
      wall_time_limit: 10,
    };

    const judge0Res = await fetch(JUDGE0_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submissionBody),
      signal: AbortSignal.timeout(45_000),
    });

    if (!judge0Res.ok) {
      const text = await judge0Res.text().catch(() => "");
      const runResult: RunResult = {
        output: "",
        error: `Execution service error (HTTP ${judge0Res.status}): ${text}`.trim(),
        isError: true,
        runner: "judge0",
        durationMs: Date.now() - t0,
      };
      return Response.json(runResult, { status: 502 });
    }

    const result = await judge0Res.json();
    const durationMs = Date.now() - t0;

    const stdout = result.stdout ? fromBase64(result.stdout) : "";
    const stderr = result.stderr ? fromBase64(result.stderr) : "";
    const compileOutput = result.compile_output ? fromBase64(result.compile_output) : "";
    const statusId: number = result.status?.id ?? 0;
    const statusDesc: string = result.status?.description ?? "";

    // Status ID 3 = Accepted (successful execution)
    const isError = statusId !== 3;
    const errorMsg = compileOutput || stderr || (isError ? statusDesc : "");

    const runResult: RunResult = {
      output: stdout || (isError ? "" : "(no output)"),
      error: errorMsg || null,
      isError: isError && !stdout,
      runner: "judge0",
      durationMs: result.time
        ? Math.round(parseFloat(result.time) * 1000)
        : durationMs,
      memory: result.memory
        ? `${Math.round(result.memory / 1024)}KB`
        : undefined,
    };
    return Response.json(runResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const runResult: RunResult = {
      output: "",
      error: `Execution failed: ${msg}`,
      isError: true,
      runner: "judge0",
      durationMs: Date.now() - t0,
    };
    return Response.json(runResult, { status: 502 });
  }
}
