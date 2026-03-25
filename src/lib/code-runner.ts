// ── Code runner — execution strategy per language ─────────────────────────────
//
// JavaScript/TypeScript → in-browser via new Function() (code-playground.tsx)
// Python               → Pyodide (in-browser WASM, ~5 MB first load, cached)
//                        Fallback: Wandbox API (https://wandbox.org/api/compile.json)
// Java                 → Wandbox API via /api/run-code proxy (server-side, no CORS)
//
// Piston (emkc.org) was removed: it became whitelist-only in Feb 2026.

export type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
  /** How the code was run — shown in the playground UI */
  runner?: "pyodide" | "wandbox" | "local";
  /** Wall-clock execution time in milliseconds */
  durationMs?: number;
};

// ── Wandbox API ────────────────────────────────────────────────────────────────
// Docs: https://github.com/melpon/wandbox/blob/master/kennel2/API.rst
// Free, no API key. Supports Python 3, Java (openjdk-head), Node.js, etc.
// Java compilation is slow (~10–20 s); we use a 45 s timeout.

interface WandboxRequest {
  compiler: string; // e.g. "cpython-3.12.0", "openjdk-head"
  code: string;
  stdin?: string;
  "compiler-option-raw"?: string;
  "runtime-option-raw"?: string;
}

interface WandboxResponse {
  status?: string;
  signal?: string;
  compiler_output?: string;
  compiler_error?: string;
  program_output?: string;
  program_error?: string;
}

async function runWithWandbox(
  compiler: string,
  code: string,
  stdin = "",
  timeoutMs = 30_000
): Promise<RunResult> {
  const body: WandboxRequest = { compiler, code };
  if (stdin) body.stdin = stdin;

  const t0 = Date.now();
  let response: Response;
  try {
    response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      error: `Could not reach Wandbox API: ${msg}`,
      isError: true,
      runner: "wandbox",
      durationMs: Date.now() - t0,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      output: "",
      error: `Wandbox API returned HTTP ${response.status}. ${text}`.trim(),
      isError: true,
      runner: "wandbox",
      durationMs: Date.now() - t0,
    };
  }

  let result: WandboxResponse;
  try {
    result = (await response.json()) as WandboxResponse;
  } catch {
    return {
      output: "",
      error: "Wandbox returned an unexpected response.",
      isError: true,
      runner: "wandbox",
      durationMs: Date.now() - t0,
    };
  }

  const durationMs = Date.now() - t0;
  const compileErr = result.compiler_error ?? "";
  const programOut = result.program_output ?? "";
  const programErr = result.program_error ?? "";
  const exitCode = Number(result.status ?? "0");

  if (compileErr) {
    return {
      output: result.compiler_output ?? "",
      error: compileErr,
      isError: true,
      runner: "wandbox",
      durationMs,
    };
  }

  if (exitCode !== 0 && programErr) {
    return { output: programOut, error: programErr, isError: true, runner: "wandbox", durationMs };
  }

  const combined = [programOut, programErr].filter(Boolean).join("\n");
  return { output: combined || "(no output)", error: null, isError: false, runner: "wandbox", durationMs };
}

// ── Pyodide — in-browser Python via WebAssembly ───────────────────────────────
// Pyodide loads CPython ~5 MB from CDN on first use; subsequent calls are instant
// because the module is cached in memory. We also cache the pyodide instance
// in a module-level variable to avoid re-initialising on every run.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pyodideInstance: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPyodide(): Promise<any> {
  if (_pyodideInstance) return _pyodideInstance;

  // Dynamically load the Pyodide bootstrap script from CDN.
  // It attaches `loadPyodide` to globalThis.
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
  await new Promise<void>((resolve, reject) => {
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Pyodide initialisation failed: script load error"));
    document.head.appendChild(script);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadPyodide = (globalThis as any).loadPyodide;
  if (typeof loadPyodide !== "function") {
    throw new Error("Pyodide script loaded but loadPyodide is not available.");
  }

  _pyodideInstance = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  });

  return _pyodideInstance;
}

async function runPythonPyodide(code: string): Promise<RunResult> {
  const t0 = Date.now();
  try {
    const pyodide = await getPyodide();

    // Redirect stdout/stderr to StringIO so we can capture print() output.
    pyodide.runPython(`
import sys, io as _io
sys.stdout = _io.StringIO()
sys.stderr = _io.StringIO()
`);

    let raisedError: string | null = null;
    try {
      pyodide.runPython(code);
    } catch (pyErr: unknown) {
      // Python runtime errors land here as JS exceptions.
      raisedError = pyErr instanceof Error ? pyErr.message : String(pyErr);
    }

    const stdout: string = pyodide.runPython("sys.stdout.getvalue()");
    const stderr: string = pyodide.runPython("sys.stderr.getvalue()");

    const durationMs = Date.now() - t0;

    if (raisedError) {
      // Prefer stderr content if present (it usually has the traceback).
      const errText = stderr || raisedError;
      return { output: stdout || "", error: errText, isError: true, runner: "pyodide", durationMs };
    }

    const combined = [stdout, stderr].filter(Boolean).join("\n");
    return { output: combined || "(no output)", error: null, isError: false, runner: "pyodide", durationMs };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      error: `Pyodide initialisation failed: ${msg}`,
      isError: true,
      runner: "pyodide",
      durationMs: Date.now() - t0,
    };
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Run Python 3 code.
 *  Primary:  Pyodide (in-browser WebAssembly — fast, offline-capable, free).
 *  Fallback: Wandbox API (if Pyodide fails to load, e.g. CSP blocks CDN). */
export async function runPython(code: string): Promise<RunResult> {
  // Try Pyodide first.
  const pyResult = await runPythonPyodide(code);

  // Fall back to Wandbox only if Pyodide itself failed to initialise
  // (not if the user's Python code threw an error — that is a legitimate result).
  if (pyResult.isError && pyResult.error?.startsWith("Pyodide initialisation failed")) {
    const wandboxResult = await runWithWandbox("cpython-3.12.0", code);
    // If the primary Wandbox slug errors with HTTP, try an older one.
    if (wandboxResult.isError && wandboxResult.error?.startsWith("Wandbox API returned HTTP")) {
      return runWithWandbox("cpython-3.10.0", code);
    }
    return wandboxResult;
  }

  return pyResult;
}

/** Run Java code via the /api/run-code server-side proxy.
 *  The proxy calls Wandbox (openjdk-head) with a 45 s timeout.
 *  Server-side fetch avoids CORS issues and lets us hide the slow compile wait. */
export async function runJava(code: string): Promise<RunResult> {
  const t0 = Date.now();
  try {
    const response = await fetch("/api/run-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: "java", code }),
      signal: AbortSignal.timeout(50_000), // 50 s client-side safety net
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        output: "",
        error: `Code execution service returned HTTP ${response.status}. ${text}`.trim(),
        isError: true,
        runner: "wandbox",
        durationMs: Date.now() - t0,
      };
    }

    const data = (await response.json()) as RunResult;
    return { ...data, durationMs: data.durationMs ?? Date.now() - t0 };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      output: "",
      error: `Java runner error: ${msg}`,
      isError: true,
      runner: "wandbox",
      durationMs: Date.now() - t0,
    };
  }
}

/** Run JavaScript (Node.js) code via Wandbox.
 *  Note: the in-browser executor in code-playground.tsx is preferred for JS/TS.
 *  This export exists for cases where a remote Node.js execution is needed. */
export async function runJavaScriptRemote(code: string): Promise<RunResult> {
  return runWithWandbox("nodejs-20.11.0", code);
}
