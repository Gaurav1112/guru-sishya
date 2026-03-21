import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";

const MODEL = "gemini-2.0-flash-001";
const DEFAULT_MAX_TOKENS = 4096;

const GRADE_SYSTEM_PROMPT = `You are an expert educational evaluator. Grade the student's answer against the rubric.

Respond with ONLY valid JSON matching this schema (no markdown, no commentary):
{
  "score": <number 0-100>,
  "feedback": "<constructive feedback string>",
  "missed": ["<missed concept 1>", "..."],
  "perfectAnswer": "<ideal answer string>"
}`;

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: MODEL,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options?.temperature,
        },
      });

      const result = await model.generateContent(userPrompt);
      return result.response.text();
    } catch (err) {
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
      // Strip markdown code fences if present
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
      const model = this.client.getGenerativeModel({
        model: MODEL,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: options?.maxTokens ?? DEFAULT_MAX_TOKENS,
          temperature: options?.temperature,
        },
      });

      const result = await model.generateContentStream(userPrompt);
      let fullText = "";

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          onChunk(text);
          fullText += text;
        }
      }

      return fullText;
    } catch (err) {
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

  private mapError(err: unknown): AIError {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (msg.includes("api key") || msg.includes("api_key_invalid") || msg.includes("unauthorized")) {
        return new AIError("Invalid Gemini API key", "invalid_key");
      }
      if (msg.includes("rate") || msg.includes("quota") || msg.includes("resource exhausted")) {
        return new AIError("Rate limited — free tier limit reached. Wait a moment and try again.", "rate_limited", 60);
      }
      if (msg.includes("network") || msg.includes("fetch")) {
        return new AIError("Network error", "network");
      }
      return new AIError(err.message, "unknown");
    }
    return new AIError("Unknown error", "unknown");
  }
}
