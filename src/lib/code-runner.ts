// ── Code runner — remote execution via Wandbox API (free, no key needed) ─────
//
// Strategy:
//   JavaScript/TypeScript → in-browser via new Function() (code-playground.tsx)
//   Python               → Wandbox API (https://wandbox.org/api/compile.json)
//   Java                 → Wandbox API with graceful fallback message
//
// Piston (emkc.org) was removed: it became whitelist-only in Feb 2026.

export type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
};

// ── Wandbox API ───────────────────────────────────────────────────────────────
// Docs: https://github.com/melpon/wandbox/blob/master/kennel2/API.rst
// Free, no API key, supports Python 3 and Node.js (JavaScript).
// Java support exists but compilation is slow; we try it with a generous timeout.

interface WandboxRequest {
  compiler: string;   // e.g. "cpython-3.12.0", "nodejs-20.11.0", "gcc-head"
  code: string;
  stdin?: string;
  "compiler-option-raw"?: string;
  "runtime-option-raw"?: string;
}

interface WandboxResponse {
  status?: string;        // exit code as string
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

async function runWithWandbox(
  compiler: string,
  code: string,
  stdin = ""
): Promise<RunResult> {
  const body: WandboxRequest = { compiler, code };
  if (stdin) body.stdin = stdin;

  let response: Response;
  try {
    response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000), // 30 s — Wandbox can be slow
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      error: `Could not reach Wandbox API: ${msg}`,
      isError: true,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      output: "",
      error: `Wandbox API returned HTTP ${response.status}. ${text}`.trim(),
      isError: true,
    };
  }

  let result: WandboxResponse;
  try {
    result = (await response.json()) as WandboxResponse;
  } catch {
    return { output: "", error: "Wandbox returned an unexpected response.", isError: true };
  }

  const compileErr = result.compiler_error ?? "";
  const programOut = result.program_output ?? "";
  const programErr = result.program_error ?? "";
  const exitCode   = Number(result.status ?? "0");

  // Compile errors take priority
  if (compileErr) {
    return {
      output: result.compiler_output ?? "",
      error: compileErr,
      isError: true,
    };
  }

  if (exitCode !== 0 && programErr) {
    return { output: programOut, error: programErr, isError: true };
  }

  const combined = [programOut, programErr].filter(Boolean).join("\n");
  return { output: combined || "(no output)", error: null, isError: false };
}

// ── Java fallback message ─────────────────────────────────────────────────────

const JAVA_FALLBACK: RunResult = {
  output: "",
  error: [
    "No free cloud Java compiler is currently available.",
    "",
    "To run this Java code locally:",
    "  javac Main.java && java Main",
    "",
    "Or paste it into an online IDE:",
    "  https://onecompiler.com/java",
    "  https://replit.com",
  ].join("\n"),
  isError: true,
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Run Java code.
 *  Tries Wandbox (which supports Java via gcc-head for JVM languages, but
 *  actually Wandbox does not compile Java — falls back gracefully). */
export async function runJava(code: string): Promise<RunResult> {
  // Wandbox does not support Java; return a helpful fallback immediately.
  // If a free Java API becomes available in the future, replace this.
  return Promise.resolve(JAVA_FALLBACK);
}

/** Run Python 3 code via Wandbox. */
export async function runPython(code: string): Promise<RunResult> {
  // cpython-3.12.0 is the latest stable on Wandbox as of early 2026.
  // If this compiler slug changes, check https://wandbox.org/api/list.json
  const result = await runWithWandbox("cpython-3.12.0", code);

  // If Wandbox fails entirely, try cpython-3.10.0 as a fallback slug
  if (result.isError && result.error?.startsWith("Wandbox API returned HTTP")) {
    return runWithWandbox("cpython-3.10.0", code);
  }

  return result;
}

/** Run JavaScript (Node.js) code via Wandbox.
 *  Note: the in-browser executor in code-playground.tsx is preferred for JS/TS.
 *  This export exists for cases where a remote Node.js execution is needed. */
export async function runJavaScriptRemote(code: string): Promise<RunResult> {
  return runWithWandbox("nodejs-20.11.0", code);
}
