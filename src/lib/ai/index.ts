import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import type { AIProvider } from "./types";
import type { AIProviderType } from "@/lib/stores/settings-slice";

export { AIError } from "./types";
export type { AIProvider, GenerateOptions, GradeResult } from "./types";

/**
 * Factory function — returns the appropriate AI provider for the given key and type.
 * Defaults to Gemini (free tier) if no provider specified.
 */
export function createAIProvider(
  apiKey: string,
  provider: AIProviderType = "gemini"
): AIProvider {
  switch (provider) {
    case "claude":
      return new ClaudeProvider(apiKey);
    case "gemini":
      return new GeminiProvider(apiKey);
    default:
      return new GeminiProvider(apiKey);
  }
}
