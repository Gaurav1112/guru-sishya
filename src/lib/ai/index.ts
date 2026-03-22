import { ClaudeProvider } from "./claude";
import { GeminiProvider } from "./gemini";
import { GroqProvider } from "./groq";
import { OllamaProvider } from "./ollama";
import { OpenRouterProvider } from "./openrouter";
import { ResilientProvider, type ProviderEntry } from "./resilient-provider";
import type { AIProvider } from "./types";
import type { AIProviderType } from "@/lib/stores/settings-slice";

export { AIError } from "./types";
export type { AIProvider, GenerateOptions, GradeResult } from "./types";
export { ResilientProvider } from "./resilient-provider";
export type { ResilientStatus } from "./resilient-provider";
export { globalAIQueue } from "./queue";

// ── Fallback chain definitions ────────────────────────────────────────────
// When the user selects a provider, we build a failover chain.
// The selected provider goes first; free-tier alternatives follow.

/**
 * Create a raw (non-resilient) provider instance.
 */
function createRawProvider(
  apiKey: string,
  type: AIProviderType
): AIProvider {
  switch (type) {
    case "claude":
      return new ClaudeProvider(apiKey);
    case "groq":
      return new GroqProvider(apiKey);
    case "openrouter":
      return new OpenRouterProvider(apiKey);
    case "ollama":
      return new OllamaProvider(apiKey);
    case "gemini":
      return new GeminiProvider(apiKey);
    default:
      return new GeminiProvider(apiKey);
  }
}

/**
 * Build a failover chain for a given primary provider.
 * Only adds fallbacks that have their own API keys or are free/local.
 *
 * @param apiKey  The API key for the primary provider
 * @param primary The user's selected provider type
 * @param extraKeys Optional map of provider -> apiKey for fallbacks
 */
function buildProviderChain(
  apiKey: string,
  primary: AIProviderType,
  extraKeys?: Partial<Record<AIProviderType, string>>
): ProviderEntry[] {
  const chain: ProviderEntry[] = [];

  // Primary provider always goes first
  chain.push({
    provider: createRawProvider(apiKey, primary),
    name: primary,
  });

  // Define the fallback order based on primary selection
  const fallbackOrder = getFallbackOrder(primary);

  for (const fallbackType of fallbackOrder) {
    const fallbackKey = extraKeys?.[fallbackType];

    // Ollama doesn't need a key
    if (fallbackType === "ollama") {
      chain.push({
        provider: new OllamaProvider("ollama"),
        name: "ollama",
      });
      continue;
    }

    // Only add fallback if we have a key for it
    if (fallbackKey) {
      chain.push({
        provider: createRawProvider(fallbackKey, fallbackType),
        name: fallbackType,
      });
    }
  }

  return chain;
}

/**
 * Returns the fallback order for a given primary provider.
 * We avoid suggesting paid providers (Claude) as automatic fallbacks
 * unless the user explicitly configured them.
 */
function getFallbackOrder(primary: AIProviderType): AIProviderType[] {
  // Preferred free-tier fallback order
  const allFree: AIProviderType[] = ["openrouter", "gemini", "groq", "ollama"];
  // Remove the primary from fallback list
  return allFree.filter((p) => p !== primary);
}

// ── Public factory functions ──────────────────────────────────────────────

/**
 * Factory function — returns a ResilientProvider wrapping the appropriate
 * AI provider(s) with automatic failover, retry, caching, and queuing.
 *
 * @param apiKey   The API key for the selected provider
 * @param provider The user's selected provider type
 * @param extraKeys Optional: additional API keys for fallback providers
 */
export function createAIProvider(
  apiKey: string,
  provider: AIProviderType = "gemini",
  extraKeys?: Partial<Record<AIProviderType, string>>
): ResilientProvider {
  const chain = buildProviderChain(apiKey, provider, extraKeys);
  return new ResilientProvider(chain);
}

/**
 * Create a raw provider without resilience wrapper.
 * Use this only when you explicitly need the raw provider behavior
 * (e.g., for testing or diagnostics).
 */
export function createRawAIProvider(
  apiKey: string,
  provider: AIProviderType = "gemini"
): AIProvider {
  return createRawProvider(apiKey, provider);
}
