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
  "https://ce.judge0.com/submissions?base64_encoded=false&wait=true";

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
    // For Java: extract the public class name to set the correct filename.
    // Judge0 defaults to "Main.java" but Java requires filename = class name.
    let javaClassName: string | undefined;
    if (lang === "java") {
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      javaClassName = classMatch ? classMatch[1] : "Main";
    }

    const submissionBody: Record<string, unknown> = {
      source_code: code,
      language_id: langId,
      cpu_time_limit: 5,
      wall_time_limit: 10,
    };

    // If Java class name is not "Main", we must rename the file
    if (javaClassName && javaClassName !== "Main") {
      // Judge0 accepts additional_files but the simpler approach is to
      // rename the class to Main in the source code automatically.
      // This is the most reliable approach — avoids filename issues entirely.
      const renamedCode = code.replace(
        new RegExp(`public\\s+class\\s+${javaClassName}`),
        "public class Main"
      );
      submissionBody.source_code = renamedCode;
    }

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

    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    const compileOutput = result.compile_output || "";
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
