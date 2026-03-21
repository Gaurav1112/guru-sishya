import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
// Best free model on OpenRouter — CORS-enabled, browser-safe
// Best free models on OpenRouter (verified available)
const MODEL = "meta-llama/llama-3.3-70b-instruct:free";
const FALLBACK_MODEL = "mistralai/mistral-small-3.1-24b-instruct:free";
const DEFAULT_MAX_TOKENS = 4096;

const GRADE_SYSTEM_PROMPT = `You are an expert educational evaluator. Grade the student's answer against the rubric.

Respond with ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "score": <number 0-100>,
  "feedback": "<constructive feedback string>",
  "missed": ["<missed concept 1>", "..."],
  "perfectAnswer": "<ideal answer string>"
}`;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
  error?: { message: string; type?: string; code?: number };
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://guru-sishya.app",
      "X-Title": "Guru Sishya",
    };
  }

  private async fetchCompletion(
    messages: OpenRouterMessage[],
    options?: GenerateOptions,
    model = MODEL
  ): Promise<string> {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})) as OpenRouterResponse;
      const errorMsg = errorBody.error?.message ?? `HTTP ${response.status}`;

      // Try fallback model if primary free model is unavailable
      if (model === MODEL && (response.status === 429 || response.status === 503 || errorMsg.toLowerCase().includes("no endpoints"))) {
        return this.fetchCompletion(messages, options, FALLBACK_MODEL);
      }

      throw this.mapHttpError(response.status, errorMsg);
    }

    const data = (await response.json()) as OpenRouterResponse;
    return data.choices[0]?.message?.content ?? "";
  }

  async generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    try {
      return await this.fetchCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        options
      );
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
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({})) as OpenRouterResponse;
        const errorMsg = errorBody.error?.message ?? `HTTP ${response.status}`;

        // Try fallback model with non-streaming if primary is unavailable
        if (response.status === 429 || response.status === 503 || errorMsg.toLowerCase().includes("no endpoints")) {
          const fallbackText = await this.fetchCompletion(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            options,
            FALLBACK_MODEL
          );
          onChunk(fallbackText);
          return fallbackText;
        }

        throw this.mapHttpError(response.status, errorMsg);
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
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const json = JSON.parse(trimmed.slice(6)) as {
              choices: Array<{ delta: { content?: string } }>;
            };
            const chunk = json.choices[0]?.delta?.content;
            if (chunk) {
              onChunk(chunk);
              fullText += chunk;
            }
          } catch {
            // Malformed SSE chunk — skip
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
    if (status === 401) {
      return new AIError(
        "Invalid OpenRouter API key. Get a free key at openrouter.ai",
        "invalid_key"
      );
    }
    if (status === 429) {
      return new AIError(
        "OpenRouter rate limit reached. Wait a moment and try again.",
        "rate_limited",
        60
      );
    }
    if (status === 402 || message.toLowerCase().includes("credit")) {
      return new AIError(
        "OpenRouter credits exhausted. Free tier may be temporarily unavailable.",
        "insufficient_credits"
      );
    }
    return new AIError(`OpenRouter API error: ${message}`, "unknown");
  }

  private mapError(err: unknown): AIError {
    if (err instanceof AIError) return err;
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return new AIError("Network error reaching OpenRouter API.", "network");
    }
    if (err instanceof Error) {
      return new AIError(err.message, "unknown");
    }
    return new AIError("Unknown OpenRouter error", "unknown");
  }
}
