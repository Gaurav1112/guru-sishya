import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";

const DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";
const FALLBACK_MODELS = ["llama3.2", "llama3.1", "llama3", "mistral", "gemma2", "phi3"];
const DEFAULT_MAX_TOKENS = 4096;

const GRADE_SYSTEM_PROMPT = `You are an expert educational evaluator. Grade the student's answer against the rubric.

Respond with ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "score": <number 0-100>,
  "feedback": "<constructive feedback string>",
  "missed": ["<missed concept 1>", "..."],
  "perfectAnswer": "<ideal answer string>"
}`;

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatResponse {
  message: { role: string; content: string };
  done: boolean;
}

interface OllamaTagsResponse {
  models: Array<{ name: string; size: number }>;
}

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;
  private resolvedModel: string | null = null;

  constructor(_apiKey: string, baseUrl?: string, model?: string) {
    // apiKey is unused for Ollama but kept for interface compatibility
    this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    this.model = model ?? DEFAULT_MODEL;
  }

  /**
   * Check connectivity and find an available model.
   * Called lazily on first request.
   */
  private async resolveModel(): Promise<string> {
    if (this.resolvedModel) return this.resolvedModel;

    try {
      const resp = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!resp.ok) {
        throw new AIError(
          "Ollama is not responding. Make sure Ollama is running (open the Ollama app or run 'ollama serve').",
          "network"
        );
      }

      const data = (await resp.json()) as OllamaTagsResponse;
      const available = data.models.map((m) => m.name.replace(/:latest$/, ""));

      // Check if user-specified model is available
      if (available.some((m) => m === this.model || m.startsWith(this.model + ":"))) {
        this.resolvedModel = this.model;
        return this.model;
      }

      // Try fallback models
      for (const fallback of FALLBACK_MODELS) {
        if (available.some((m) => m === fallback || m.startsWith(fallback + ":"))) {
          this.resolvedModel = fallback;
          return fallback;
        }
      }

      // Use whatever is available
      if (available.length > 0) {
        this.resolvedModel = available[0];
        return available[0];
      }

      throw new AIError(
        `No models found in Ollama. Run 'ollama pull ${DEFAULT_MODEL}' to download a model.`,
        "invalid_key"
      );
    } catch (err) {
      if (err instanceof AIError) throw err;
      if (err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError")) {
        throw new AIError(
          "Cannot connect to Ollama. Make sure Ollama is running on localhost:11434.\n\n" +
            "Install: https://ollama.com/download\n" +
            "Then run: ollama pull llama3.2",
          "network"
        );
      }
      throw new AIError(
        err instanceof Error ? err.message : "Unknown Ollama error",
        "unknown"
      );
    }
  }

  async generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    const model = await this.resolveModel();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ] as OllamaChatMessage[],
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw this.mapHttpError(response.status, text);
      }

      const data = (await response.json()) as OllamaChatResponse;
      return data.message?.content ?? "";
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw this.mapError(err);
    }
  }

  async generateStructured<T>(
    userPrompt: string,
    systemPrompt: string,
    parser: (text: string) => T,
    options?: GenerateOptions
  ): Promise<T> {
    const text = await this.generateText(userPrompt, systemPrompt, options);
    try {
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      return parser(cleaned);
    } catch {
      // Retry once with stricter prompt
      const retryText = await this.generateText(
        userPrompt +
          "\n\nIMPORTANT: Respond ONLY with valid JSON, no markdown formatting or code fences.",
        systemPrompt,
        options
      );
      const cleaned = retryText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();
      return parser(cleaned);
    }
  }

  async streamText(
    userPrompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void,
    options?: GenerateOptions
  ): Promise<string> {
    const model = await this.resolveModel();

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ] as OllamaChatMessage[],
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          },
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw this.mapHttpError(response.status, text);
      }

      if (!response.body) {
        throw new AIError("No response body for streaming", "network");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const json = JSON.parse(trimmed) as OllamaChatResponse;
            const chunk = json.message?.content;
            if (chunk) {
              onChunk(chunk);
              fullText += chunk;
            }
          } catch {
            // Malformed line — skip
          }
        }
      }

      return fullText;
    } catch (err) {
      if (err instanceof AIError) throw err;
      throw this.mapError(err);
    }
  }

  async gradeAnswer(
    question: string,
    answer: string,
    rubric: string
  ): Promise<GradeResult> {
    const userPrompt = `Question: ${question}\n\nStudent Answer: ${answer}\n\nRubric: ${rubric}`;

    return this.generateStructured<GradeResult>(
      userPrompt,
      GRADE_SYSTEM_PROMPT,
      (text) => {
        const parsed = JSON.parse(text) as Record<string, unknown>;
        return {
          score: Number(parsed.score),
          feedback: String(parsed.feedback),
          missed: Array.isArray(parsed.missed)
            ? (parsed.missed as unknown[]).map(String)
            : [],
          perfectAnswer: String(parsed.perfectAnswer),
        };
      },
      { temperature: 0.2 }
    );
  }

  private mapHttpError(status: number, message: string): AIError {
    if (status === 404) {
      return new AIError(
        `Model not found. Run 'ollama pull ${this.model}' to download it.`,
        "invalid_key"
      );
    }
    return new AIError(`Ollama error (${status}): ${message}`, "unknown");
  }

  private mapError(err: unknown): AIError {
    if (err instanceof AIError) return err;
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return new AIError(
        "Cannot connect to Ollama. Make sure Ollama is running.\n\n" +
          "Install: https://ollama.com/download\n" +
          "Start: open the Ollama app or run 'ollama serve'\n" +
          "Pull a model: ollama pull llama3.2",
        "network"
      );
    }
    if (err instanceof Error) {
      return new AIError(err.message, "unknown");
    }
    return new AIError("Unknown Ollama error", "unknown");
  }
}
