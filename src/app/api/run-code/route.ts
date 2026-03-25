// ── /api/run-code — server-side code execution proxy ──────────────────────────
//
// Currently handles Java only (Python runs client-side via Pyodide).
// Proxying through the server eliminates CORS issues and lets us apply a
// generous timeout without the browser's preflight overhead.
//
// Backend: Wandbox (https://wandbox.org) — free, no API key required.
// Java compiler: openjdk-head (OpenJDK latest on Wandbox).
// Compilation is slow (10–20 s); we allow up to 45 s.

import { type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

interface WandboxRequest {
  compiler: string;
  code: string;
  stdin?: string;
}

interface WandboxResponse {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
  runner: "wandbox";
  durationMs: number;
};

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

// Wandbox compiler slugs — fall back to an older one if head is unavailable.
const JAVA_COMPILERS = ["openjdk-head", "openjdk-23.0.1"];

async function compileWithWandbox(
  compiler: string,
  code: string,
  timeoutMs: number
): Promise<WandboxResponse> {
  const body: WandboxRequest = { compiler, code };
  const response = await fetch(WANDBOX_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Wandbox HTTP ${response.status}: ${text}`.trim());
  }

  return response.json() as Promise<WandboxResponse>;
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

  if (language !== "java") {
    return Response.json(
      { output: "", error: `Language '${language}' is not supported by this endpoint.`, isError: true },
      { status: 400 }
    );
  }

  // Try each Java compiler slug in order.
  let lastError = "Unknown error";
  for (const compiler of JAVA_COMPILERS) {
    try {
      const result = await compileWithWandbox(compiler, code, 45_000);
      const durationMs = Date.now() - t0;

      const compileErr = result.compiler_error ?? "";
      const programOut = result.program_output ?? "";
      const programErr = result.program_error ?? "";
      const exitCode = Number(result.status ?? "0");

      if (compileErr) {
        const runResult: RunResult = {
          output: result.compiler_output ?? "",
          error: compileErr,
          isError: true,
          runner: "wandbox",
          durationMs,
        };
        return Response.json(runResult);
      }

      if (exitCode !== 0 && programErr) {
        const runResult: RunResult = {
          output: programOut,
          error: programErr,
          isError: true,
          runner: "wandbox",
          durationMs,
        };
        return Response.json(runResult);
      }

      const combined = [programOut, programErr].filter(Boolean).join("\n");
      const runResult: RunResult = {
        output: combined || "(no output)",
        error: null,
        isError: false,
        runner: "wandbox",
        durationMs,
      };
      return Response.json(runResult);
    } catch (err: unknown) {
      lastError = err instanceof Error ? err.message : String(err);
      // If it is a timeout or network failure, no point trying the next slug.
      if (lastError.includes("AbortError") || lastError.includes("timed out")) break;
      // Otherwise, loop and try the next compiler slug.
    }
  }

  const runResult: RunResult = {
    output: "",
    error: `Java compilation failed: ${lastError}`,
    isError: true,
    runner: "wandbox",
    durationMs: Date.now() - t0,
  };
  return Response.json(runResult, { status: 502 });
}
