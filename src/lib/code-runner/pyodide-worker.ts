/* eslint-disable @typescript-eslint/no-explicit-any */
// This file runs inside a Web Worker context (via Blob URL).
// The `webworker` lib types conflict with `dom`, so we use any-typed globals.

// @ts-ignore — in a worker, `self` is the DedicatedWorkerGlobalScope
const workerSelf: any = self;

let pyodide: any = null;

async function loadPyodide() {
  if (pyodide) return pyodide;
  // @ts-ignore — importScripts is a web worker global
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
  pyodide = await workerSelf.loadPyodide();
  return pyodide;
}

workerSelf.onmessage = async (e: MessageEvent<{ code: string; id: string }>) => {
  const { code, id } = e.data;
  try {
    const py = await loadPyodide();
    py.runPython(`import sys, io\nsys.stdout = io.StringIO()\nsys.stderr = io.StringIO()`);
    const start = performance.now();
    try {
      py.runPython(code);
    } catch (err: any) {
      const stderr = py.runPython("sys.stderr.getvalue()");
      workerSelf.postMessage({ id, output: "", error: stderr || err.message || String(err), isError: true, runner: "pyodide", durationMs: Math.round(performance.now() - start) });
      return;
    }
    const stdout = py.runPython("sys.stdout.getvalue()");
    const stderr = py.runPython("sys.stderr.getvalue()");
    workerSelf.postMessage({ id, output: stdout || "", error: stderr || null, isError: !!stderr && !stdout, runner: "pyodide", durationMs: Math.round(performance.now() - start) });
  } catch (err: any) {
    workerSelf.postMessage({ id, output: "", error: `Failed to load Python runtime: ${err.message}`, isError: true, runner: "pyodide" });
  }
};
