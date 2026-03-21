// ────────────────────────────────────────────────────────────────────────────
// AI Provider abstraction types
// ────────────────────────────────────────────────────────────────────────────

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface GradeResult {
  score: number;
  feedback: string;
  missed: string[];
  perfectAnswer: string;
}

export interface AIProvider {
  generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string>;

  generateStructured<T>(
    userPrompt: string,
    systemPrompt: string,
    parser: (text: string) => T,
    options?: GenerateOptions
  ): Promise<T>;

  streamText(
    userPrompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void,
    options?: GenerateOptions
  ): Promise<string>;

  gradeAnswer(
    question: string,
    answer: string,
    rubric: string
  ): Promise<GradeResult>;
}

export class AIError extends Error {
  constructor(
    message: string,
    public code:
      | "invalid_key"
      | "rate_limited"
      | "insufficient_credits"
      | "network"
      | "unknown",
    public retryAfter?: number
  ) {
    super(message);
    this.name = "AIError";
  }
}
