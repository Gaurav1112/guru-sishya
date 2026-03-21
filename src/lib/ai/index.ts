import { ClaudeProvider } from "./claude";
import type { AIProvider } from "./types";

export { AIError } from "./types";
export type { AIProvider, GenerateOptions, GradeResult } from "./types";

/**
 * Factory function — returns the appropriate AI provider for the given key.
 * Currently always returns ClaudeProvider; the abstraction allows swapping
 * providers in the future.
 */
export function createAIProvider(apiKey: string): AIProvider {
  return new ClaudeProvider(apiKey);
}
