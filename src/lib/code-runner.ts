// ── Code runner — remote execution via Piston API (free, no key needed) ────────

export type RunResult = {
  output: string;
  error: string | null;
  isError: boolean;
};

/**
 * Execute code using the Piston API (https://github.com/engineer-man/piston).
 * Free, no API key needed, rate-limited but generous for educational use.
 */
async function runWithPiston(
  language: string,
  version: string,
  code: string,
  stdin = ""
): Promise<RunResult> {
  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version,
        files: [{ name: "main", content: code }],
        stdin,
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { output: "", error: `Piston API error ${response.status}: ${text}`, isError: true };
    }

    const result = await response.json();

    // Piston returns { run: { stdout, stderr, code }, compile?: { stdout, stderr, code } }
    const compile = result.compile;
    const run = result.run;

    // Check compile errors first
    if (compile && compile.code !== 0 && compile.stderr) {
      return {
        output: compile.stdout || "",
        error: compile.stderr,
        isError: true,
      };
    }

    const stdout = run?.stdout ?? "";
    const stderr = run?.stderr ?? "";
    const exitCode = run?.code ?? 0;

    if (exitCode !== 0 && stderr) {
      return { output: stdout, error: stderr, isError: true };
    }

    const combined = [stdout, stderr].filter(Boolean).join("\n");
    return { output: combined || "(no output)", error: null, isError: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed")) {
      return {
        output: "",
        error:
          "Could not reach Piston API. Check your internet connection.\n" +
          "(Piston is a free service at emkc.org — no API key required.)",
        isError: true,
      };
    }
    return { output: "", error: msg, isError: true };
  }
}

/** Run Java code via Piston. Wraps bare snippets in a class if needed. */
export async function runJava(code: string): Promise<RunResult> {
  // If the code doesn't contain a class definition, wrap it
  const hasClass = /\bclass\s+\w+/.test(code);
  const runnable = hasClass
    ? code
    : `public class Main {\n  public static void main(String[] args) {\n${code
        .split("\n")
        .map((l) => "    " + l)
        .join("\n")}\n  }\n}`;

  return runWithPiston("java", "15.0.2", runnable);
}

/** Run Python code via Piston. */
export async function runPython(code: string): Promise<RunResult> {
  return runWithPiston("python", "3.10.0", code);
}

/** Run JavaScript code via Piston (Node.js). */
export async function runJavaScriptRemote(code: string): Promise<RunResult> {
  return runWithPiston("javascript", "18.15.0", code);
}
