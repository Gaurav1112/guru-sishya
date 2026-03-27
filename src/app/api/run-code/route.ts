// ── /api/run-code — server-side code execution proxy ──────────────────────────
//
// Handles Java and other compiled languages (C, C++, Go, Rust).
// Python runs client-side via Pyodide; JS/TS run in a sandboxed iframe.
// Proxying through the server eliminates CORS issues and lets us apply a
// generous timeout without the browser's preflight overhead.
//
// Backend: Piston (https://emkc.org/api/v2/piston) — free, no API key required.
// Supports 30+ languages including Java, C, C++, Go, Rust, Python, Node.js.

import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_MAP: Record<string, { language: string; version: string; filename: string }> = {
  java:       { language: "java",       version: "15.0.2",  filename: "Main.java"  },
  python:     { language: "python",     version: "3.10.0",  filename: "main.py"    },
  javascript: { language: "javascript", version: "18.15.0", filename: "main.js"    },
  typescript: { language: "typescript", version: "5.0.3",   filename: "main.ts"    },
  c:          { language: "c",          version: "10.2.0",  filename: "main.c"     },
  cpp:        { language: "c++",        version: "10.2.0",  filename: "main.cpp"   },
  go:         { language: "go",         version: "1.16.2",  filename: "main.go"    },
  rust:       { language: "rust",       version: "1.68.2",  filename: "main.rs"    },
};

type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
  runner: "piston";
  durationMs: number;
};

interface PistonResponse {
  run?: { output?: string; stdout?: string; stderr?: string; code?: number };
  compile?: { output?: string; stdout?: string; stderr?: string; code?: number };
  message?: string;
}

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
  const langConfig = LANGUAGE_MAP[lang];
  if (!langConfig) {
    return Response.json(
      { output: "", error: `Language '${language}' is not supported by this endpoint.`, isError: true },
      { status: 400 }
    );
  }

  try {
    const pistonRes = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ name: langConfig.filename, content: code }],
        stdin: "",
        args: [],
        compile_timeout: 30000,
        run_timeout: 10000,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!pistonRes.ok) {
      const text = await pistonRes.text().catch(() => "");
      const runResult: RunResult = {
        output: "",
        error: `Execution service error (HTTP ${pistonRes.status}): ${text}`.trim(),
        isError: true,
        runner: "piston",
        durationMs: Date.now() - t0,
      };
      return Response.json(runResult, { status: 502 });
    }

    const result = (await pistonRes.json()) as PistonResponse;
    const durationMs = Date.now() - t0;

    // Piston returns compile + run stages separately.
    const compileStderr = result.compile?.stderr ?? result.compile?.output ?? "";
    const compileCode   = result.compile?.code ?? 0;
    const runOutput     = result.run?.stdout ?? result.run?.output ?? "";
    const runStderr     = result.run?.stderr ?? "";
    const runCode       = result.run?.code ?? 0;

    // Compile error
    if (compileCode !== 0 && compileStderr) {
      const runResult: RunResult = {
        output: "",
        error: compileStderr,
        isError: true,
        runner: "piston",
        durationMs,
      };
      return Response.json(runResult);
    }

    // Runtime error
    if (runCode !== 0 && runStderr) {
      const runResult: RunResult = {
        output: runOutput,
        error: runStderr,
        isError: true,
        runner: "piston",
        durationMs,
      };
      return Response.json(runResult);
    }

    const combined = [runOutput, runStderr].filter(Boolean).join("\n");
    const runResult: RunResult = {
      output: combined || "(no output)",
      error: null,
      isError: false,
      runner: "piston",
      durationMs,
    };
    return Response.json(runResult);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const runResult: RunResult = {
      output: "",
      error: `Execution failed: ${msg}`,
      isError: true,
      runner: "piston",
      durationMs: Date.now() - t0,
    };
    return Response.json(runResult, { status: 502 });
  }
}
