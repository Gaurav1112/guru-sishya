// ────────────────────────────────────────────────────────────────────────────
// Resilient AI Provider
//
// Wraps one or more AIProviders with:
//   1. Automatic failover — if provider A returns 429/rate_limited, try B
//   2. Exponential backoff retry — 2s, 4s, 8s before retrying same provider
//   3. Request queue — max 1 concurrent request via globalAIQueue
//   4. Response caching — checks Dexie before making any request
//   5. Large-request warnings — if maxTokens > 2000, logs a suggestion
// ────────────────────────────────────────────────────────────────────────────

import type { AIProvider, GenerateOptions, GradeResult } from "./types";
import { AIError } from "./types";
import {
  getCachedResponse,
  cacheResponse,
  DEFAULT_TTL_DAYS,
  GRADING_TTL_DAYS,
} from "./cache";
import { globalAIQueue } from "./queue";

// ── Configuration ─────────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2000; // 2s, 4s, 8s
const LARGE_REQUEST_THRESHOLD = 2000;

// ── Status tracking (observable from hooks) ───────────────────────────────

export interface ResilientStatus {
  currentProvider: string;
  retryCount: number;
  queueLength: number;
  isProcessing: boolean;
  lastError: string | null;
  failedProviders: string[];
}

type StatusListener = (status: ResilientStatus) => void;

// ── Provider entry ────────────────────────────────────────────────────────

export interface ProviderEntry {
  provider: AIProvider;
  name: string;
}

// ── ResilientProvider ─────────────────────────────────────────────────────

export class ResilientProvider implements AIProvider {
  private providers: ProviderEntry[];
  private currentIndex: number = 0;
  private retryCount: number = 0;
  private lastError: string | null = null;
  private failedProviders: string[] = [];
  private statusListeners: Set<StatusListener> = new Set();

  constructor(providers: ProviderEntry[]) {
    if (providers.length === 0) {
      throw new Error("ResilientProvider requires at least one provider.");
    }
    this.providers = providers;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /** Name of the currently active provider. */
  getCurrentProviderName(): string {
    return this.providers[this.currentIndex].name;
  }

  /** Get a snapshot of the current status. */
  getStatus(): ResilientStatus {
    return {
      currentProvider: this.getCurrentProviderName(),
      retryCount: this.retryCount,
      queueLength: globalAIQueue.getQueueLength(),
      isProcessing: globalAIQueue.isProcessing(),
      lastError: this.lastError,
      failedProviders: [...this.failedProviders],
    };
  }

  /** Subscribe to status changes. Returns an unsubscribe function. */
  onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  // ── AIProvider interface ────────────────────────────────────────────────

  async generateText(
    userPrompt: string,
    systemPrompt: string,
    options?: GenerateOptions
  ): Promise<string> {
    this.warnIfLargeRequest(options);

    // Check cache first
    const cached = await getCachedResponse(userPrompt, systemPrompt);
    if (cached !== null) {
      return cached;
    }

    // Queue the request
    const result = await globalAIQueue.enqueue(() =>
      this.executeWithFailover(
        (provider) => provider.generateText(userPrompt, systemPrompt, options)
      )
    );

    // Cache the result
    await cacheResponse(userPrompt, systemPrompt, result, DEFAULT_TTL_DAYS);
    return result;
  }

  async generateStructured<T>(
    userPrompt: string,
    systemPrompt: string,
    parser: (text: string) => T,
    options?: GenerateOptions
  ): Promise<T> {
    this.warnIfLargeRequest(options);

    // Check cache first (we cache the raw text, then parse)
    const cached = await getCachedResponse(userPrompt, systemPrompt);
    if (cached !== null) {
      try {
        return parser(cached);
      } catch {
        // Cached value doesn't parse any more — ignore and re-fetch
      }
    }

    // Queue the request
    const result = await globalAIQueue.enqueue(async () => {
      // We call generateStructured on the underlying provider, but we need
      // the raw text for caching. So we call generateText and parse ourselves.
      const rawText = await this.executeWithFailover(
        (provider) => provider.generateText(userPrompt, systemPrompt, options)
      );
      return rawText;
    });

    // Cache the raw response
    await cacheResponse(userPrompt, systemPrompt, result, DEFAULT_TTL_DAYS);

    // Parse the result
    const cleaned = result
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return parser(cleaned);
  }

  async streamText(
    userPrompt: string,
    systemPrompt: string,
    onChunk: (text: string) => void,
    options?: GenerateOptions
  ): Promise<string> {
    this.warnIfLargeRequest(options);

    // For streaming, we skip the cache check — the user expects real-time output.
    // But we still queue the request and add failover.
    const result = await globalAIQueue.enqueue(() =>
      this.executeWithFailover(
        (provider) =>
          provider.streamText(userPrompt, systemPrompt, onChunk, options)
      )
    );

    // Cache the full streamed result for future non-streaming calls
    await cacheResponse(userPrompt, systemPrompt, result, DEFAULT_TTL_DAYS);
    return result;
  }

  async gradeAnswer(
    question: string,
    answer: string,
    rubric: string
  ): Promise<GradeResult> {
    // Build a cache key from the grading inputs
    const cacheUserPrompt = `GRADE:${question}||${answer}`;
    const cacheSystemPrompt = `RUBRIC:${rubric}`;

    const cached = await getCachedResponse(cacheUserPrompt, cacheSystemPrompt);
    if (cached !== null) {
      try {
        return JSON.parse(cached) as GradeResult;
      } catch {
        // Bad cache entry — re-fetch
      }
    }

    // Serialize gradeAnswer result to string for the queue (which only handles strings)
    const serialized = await globalAIQueue.enqueue(async () => {
      const gradeResult = await this.executeWithFailover(
        (provider) => provider.gradeAnswer(question, answer, rubric)
      );
      return JSON.stringify(gradeResult);
    });

    // Cache the serialized grade result with a shorter TTL
    await cacheResponse(
      cacheUserPrompt,
      cacheSystemPrompt,
      serialized,
      GRADING_TTL_DAYS
    );

    return JSON.parse(serialized) as GradeResult;
  }

  // ── Core failover + retry engine ────────────────────────────────────────

  /**
   * Try the current provider. On rate-limit or transient failure, retry with
   * exponential backoff, then failover to the next provider in the chain.
   */
  private async executeWithFailover<T>(
    operation: (provider: AIProvider) => Promise<T>
  ): Promise<T> {
    this.failedProviders = [];
    const totalProviders = this.providers.length;
    let lastError: Error | null = null;

    for (let providerAttempt = 0; providerAttempt < totalProviders; providerAttempt++) {
      const providerIndex =
        (this.currentIndex + providerAttempt) % totalProviders;
      const entry = this.providers[providerIndex];

      // Try this provider with retries
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        try {
          this.retryCount = retry;
          this.emitStatus();

          const result = await operation(entry.provider);

          // Success — make this provider the preferred one
          this.currentIndex = providerIndex;
          this.retryCount = 0;
          this.lastError = null;
          this.failedProviders = [];
          this.emitStatus();

          return result;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          const isRateLimit =
            err instanceof AIError && err.code === "rate_limited";
          const isNetwork =
            err instanceof AIError && err.code === "network";
          const isInvalidKey =
            err instanceof AIError && err.code === "invalid_key";
          const isInsufficientCredits =
            err instanceof AIError && err.code === "insufficient_credits";

          // Non-retriable errors: invalid key or insufficient credits
          // Skip to next provider immediately
          if (isInvalidKey || isInsufficientCredits) {
            this.lastError = lastError.message;
            this.failedProviders.push(entry.name);
            this.emitStatus();
            break; // Try next provider
          }

          // Rate limit or network — retry with backoff if we have retries left
          if ((isRateLimit || isNetwork) && retry < MAX_RETRIES) {
            const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retry);
            this.lastError = `${entry.name}: ${lastError.message} (retrying in ${backoffMs / 1000}s)`;
            this.emitStatus();
            await sleep(backoffMs);
            continue;
          }

          // Unknown errors or exhausted retries — try next provider
          if (retry === MAX_RETRIES || (!isRateLimit && !isNetwork)) {
            this.lastError = lastError.message;
            this.failedProviders.push(entry.name);
            this.emitStatus();
            break; // Try next provider
          }
        }
      }
    }

    // All providers exhausted
    this.retryCount = 0;
    this.emitStatus();

    throw new AIError(
      `All AI providers failed. Last error: ${lastError?.message ?? "unknown"}`,
      lastError instanceof AIError ? lastError.code : "unknown",
      lastError instanceof AIError ? lastError.retryAfter : undefined
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private warnIfLargeRequest(options?: GenerateOptions): void {
    if (options?.maxTokens && options.maxTokens > LARGE_REQUEST_THRESHOLD) {
      console.warn(
        `[ResilientProvider] Large request detected (maxTokens=${options.maxTokens}). ` +
          `Consider splitting into smaller requests for better reliability.`
      );
    }
  }

  private emitStatus(): void {
    const status = this.getStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch {
        // Listener errors must not break provider logic
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
