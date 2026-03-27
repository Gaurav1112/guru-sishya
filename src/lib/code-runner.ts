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
  runner?: "pyodide" | "wandbox" | "local" | "iframe";
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

// ── Pyodide — in-browser Python via Web Worker ────────────────────────────────
// Running Pyodide in a dedicated Web Worker prevents the main thread from
// freezing during the ~5 MB first-load and during CPU-intensive Python execution.
// The worker is lazily instantiated and reused across calls.

let _pyodideWorker: Worker | null = null;
let _workerReady = false;

function getPyodideWorker(): Worker {
  if (_pyodideWorker && _workerReady) return _pyodideWorker;

  // Terminate any stale worker
  if (_pyodideWorker) {
    _pyodideWorker.terminate();
  }

  // Build worker blob URL so we don't need a separate public/ worker file.
  // The actual worker logic lives in pyodide-worker.ts; here we inline a
  // thin bootstrap that importScripts the compiled worker URL.
  // In Next.js, web workers are referenced via `new Worker(new URL(...))`.
  // Since this is a TS file consumed by the browser bundle, we use the
  // Worker constructor with a blob that mirrors pyodide-worker.ts logic.
  const workerCode = `
let pyodide = null;

async function loadPyodide() {
  if (pyodide) return pyodide;
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
  pyodide = await self.loadPyodide();
  return pyodide;
}

self.onmessage = async function(e) {
  const { code, id } = e.data;
  try {
    const py = await loadPyodide();
    py.runPython("import sys, io\\nsys.stdout = io.StringIO()\\nsys.stderr = io.StringIO()");
    const start = performance.now();
    try {
      py.runPython(code);
    } catch (err) {
      const stderr = py.runPython("sys.stderr.getvalue()");
      self.postMessage({ id, output: "", error: stderr || err.message || String(err), isError: true, runner: "pyodide", durationMs: Math.round(performance.now() - start) });
      return;
    }
    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");
    self.postMessage({ id, output: stdout || "", error: stderr || null, isError: !!(stderr && !stdout), runner: "pyodide", durationMs: Math.round(performance.now() - start) });
  } catch (err) {
    self.postMessage({ id, output: "", error: "Failed to load Python runtime: " + (err.message || String(err)), isError: true, runner: "pyodide" });
  }
};
`;

  const blob = new Blob([workerCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  _pyodideWorker = new Worker(url);
  _workerReady = true;
  return _pyodideWorker;
}

async function runPythonPyodide(code: string): Promise<RunResult> {
  const t0 = Date.now();
  return new Promise<RunResult>((resolve) => {
    let worker: Worker;
    try {
      worker = getPyodideWorker();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      resolve({
        output: "",
        error: `Pyodide initialisation failed: ${msg}`,
        isError: true,
        runner: "pyodide",
        durationMs: Date.now() - t0,
      });
      return;
    }

    const id = Math.random().toString(36).slice(2);

    const handleMessage = (ev: MessageEvent) => {
      if (ev.data?.id !== id) return;
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      resolve({
        output: ev.data.output ?? "",
        error: ev.data.error ?? null,
        isError: ev.data.isError ?? false,
        runner: "pyodide",
        durationMs: ev.data.durationMs ?? Date.now() - t0,
      });
    };

    const handleError = (ev: ErrorEvent) => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      // Mark worker as dead so next call recreates it
      _workerReady = false;
      _pyodideWorker = null;
      resolve({
        output: "",
        error: `Pyodide worker error: ${ev.message}`,
        isError: true,
        runner: "pyodide",
        durationMs: Date.now() - t0,
      });
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);
    worker.postMessage({ code, id });
  });
}

// ── JS / TS — sandboxed iframe execution ──────────────────────────────────────
// Running arbitrary JS in `new Function()` can access and mutate the host page.
// We instead create a sandboxed <iframe> with a unique origin, inject the code,
// and communicate via postMessage. The iframe is removed after the run.

export async function runJavaScriptSandboxed(
  code: string,
  timeoutMs = 5000
): Promise<RunResult> {
  if (typeof document === "undefined") {
    // SSR guard — should never execute server-side
    return { output: "", error: "Cannot run JS on the server.", isError: true, runner: "local" };
  }

  const t0 = Date.now();

  return new Promise<RunResult>((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    let settled = false;
    let timer: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };

    const settle = (result: RunResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    timer = setTimeout(() => {
      settle({
        output: "",
        error: `Execution timed out after ${timeoutMs / 1000}s. Check for infinite loops.`,
        isError: true,
        runner: "local",
        durationMs: Date.now() - t0,
      });
    }, timeoutMs);

    const nonce = Math.random().toString(36).slice(2);

    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.nonce !== nonce) return;
      settle({
        output: ev.data.output ?? "",
        error: ev.data.error ?? null,
        isError: ev.data.isError ?? false,
        runner: "local",
        durationMs: Date.now() - t0,
      });
    };

    window.addEventListener("message", onMessage);

    // Serialise code safely — JSON.stringify handles escaping
    const escapedCode = JSON.stringify(code);
    const escapedNonce = JSON.stringify(nonce);

    const html = `<!DOCTYPE html><html><body><script>
(function() {
  var logs = [], errors = [];
  var _nonce = ${escapedNonce};
  var stringify = function(v) {
    if (v === null) return "null";
    if (v === undefined) return "undefined";
    if (typeof v === "string") return v;
    try { return JSON.stringify(v, null, 2); } catch(e) { return String(v); }
  };
  console.log = function() { logs.push(Array.prototype.slice.call(arguments).map(stringify).join(" ")); };
  console.error = function() { errors.push("Error: " + Array.prototype.slice.call(arguments).map(stringify).join(" ")); };
  console.warn = function() { logs.push("Warn: " + Array.prototype.slice.call(arguments).map(stringify).join(" ")); };
  console.info = function() { logs.push(Array.prototype.slice.call(arguments).map(stringify).join(" ")); };
  try {
    var code = ${escapedCode};
    (new Function(code))();
    var out = logs.concat(errors).join("\\n");
    parent.postMessage({ nonce: _nonce, output: out || "(no output)", error: errors.length ? errors.join("\\n") : null, isError: errors.length > 0 }, "*");
  } catch(e) {
    var out2 = logs.join("\\n");
    parent.postMessage({ nonce: _nonce, output: out2 || "", error: e.message || String(e), isError: true }, "*");
  }
})();
<\/script></body></html>`;

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      settle({ output: "", error: "Could not create sandbox iframe.", isError: true, runner: "local", durationMs: Date.now() - t0 });
      return;
    }
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
  });
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
