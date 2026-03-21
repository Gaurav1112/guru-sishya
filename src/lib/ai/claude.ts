import Anthropic, {
  AuthenticationError,
  RateLimitError,
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
} from "@anthropic-ai/sdk";
import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";

const MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 4096;

// ────────────────────────────────────────────────────────────────────────────
// Grading system prompt
// ────────────────────────────────────────────────────────────────────────────

const GRADE_SYSTEM_PROMPT = `You are an expert educational evaluator. Grade the student's answer against the rubric.

Respond with ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "score": <number 0-100>,
  "feedback": "<constructive feedback string>",
  "missed": ["<missed concept 1>", "..."],
  "perfectAnswer": "<ideal answer string>"
}`;

// ────────────────────────────────────────────────────────────────────────────
// ClaudeProvider
// ────────────────────────────────────────────────────────────────────────────

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  // ── generateText ──────────────────────────────────────────────────────────

  async generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options?.temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const block = response.content.find((b) => b.type === "text");
      return block && block.type === "text" ? block.text : "";
    } catch (err) {
      throw this.mapError(err);
    }
  }

  // ── generateStructured ────────────────────────────────────────────────────

  async generateStructured<T>(
    userPrompt: string,
    systemPrompt: string,
    parser: (text: string) => T,
    options?: GenerateOptions
  ): Promise<T> {
    const text = await this.generateText(userPrompt, systemPrompt, options);
    try {
      return parser(text);
    } catch {
      // Retry once on parse failure
      const retryText = await this.generateText(
        userPrompt,
        systemPrompt,
        options
      );
      return parser(retryText);
    }
  }

  // ── streamText ────────────────────────────────────────────────────────────

  async streamText(
    userPrompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void,
    options?: GenerateOptions
  ): Promise<string> {
    try {
      const stream = this.client.messages.stream({
        model: MODEL,
        max_tokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
        temperature: options?.temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      let fullText = "";
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          onChunk(event.delta.text);
          fullText += event.delta.text;
        }
      }
      return fullText;
    } catch (err) {
      throw this.mapError(err);
    }
  }

  // ── gradeAnswer ───────────────────────────────────────────────────────────

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
        // Strip possible markdown code fences
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;
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

  // ── mapError ──────────────────────────────────────────────────────────────

  private mapError(err: unknown): AIError {
    if (err instanceof AuthenticationError) {
      return new AIError("Invalid API key", "invalid_key");
    }
    if (err instanceof RateLimitError) {
      const retryAfter = Number(
        (err as RateLimitError & { headers?: Record<string, string> })
          .headers?.["retry-after"] ?? 0
      );
      return new AIError(
        "Rate limited",
        "rate_limited",
        retryAfter || undefined
      );
    }
    // 402 Payment Required or 400 with credit balance message
    if (err instanceof APIError && (err.status === 402 || (err.status === 400 && err.message?.toLowerCase().includes("credit balance")))) {
      return new AIError("Your API credit balance is too low. Please add credits at console.anthropic.com", "insufficient_credits");
    }
    // Any other API error with a status code
    if (err instanceof APIError) {
      return new AIError(
        err.message || `API error (status ${err.status})`,
        "unknown"
      );
    }
    if (
      err instanceof APIConnectionError ||
      err instanceof APIConnectionTimeoutError ||
      err instanceof TypeError
    ) {
      return new AIError("Network error", "network");
    }
    if (err instanceof AIError) return err;
    return new AIError(
      err instanceof Error ? err.message : "Unknown error",
      "unknown"
    );
  }
}
