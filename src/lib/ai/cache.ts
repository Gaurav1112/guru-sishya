// ────────────────────────────────────────────────────────────────────────────
// AI Response Caching Layer
//
// Caches AI responses in Dexie (IndexedDB) to avoid redundant API calls.
// Key: hash of (systemPrompt + userPrompt)
// TTL: 7 days for generated content, 1 day for grading
// ────────────────────────────────────────────────────────────────────────────

import { db } from "@/lib/db";

const DEFAULT_TTL_DAYS = 7;
const GRADING_TTL_DAYS = 1;

/**
 * Simple string hash (djb2) — fast, deterministic, good distribution.
 * Not cryptographic; just for cache keying.
 */
function hashPrompt(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    // hash * 33 + char
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Build a cache key from the user prompt and system prompt.
 */
function buildCacheKey(userPrompt: string, systemPrompt: string): string {
  return hashPrompt(systemPrompt + "||" + userPrompt);
}

/**
 * Look up a cached AI response. Returns null if not found or expired.
 */
export async function getCachedResponse(
  userPrompt: string,
  systemPrompt: string
): Promise<string | null> {
  try {
    const key = buildCacheKey(userPrompt, systemPrompt);
    const entry = await db.aiCache.where("promptHash").equals(key).first();

    if (!entry) return null;

    // Check TTL
    const ageMs = Date.now() - entry.createdAt.getTime();
    const ttlMs = entry.ttlDays * 24 * 60 * 60 * 1000;

    if (ageMs > ttlMs) {
      // Expired — clean up asynchronously
      db.aiCache.delete(entry.id!).catch(() => {});
      return null;
    }

    return entry.response;
  } catch {
    // If the table doesn't exist yet or any DB error, just miss the cache
    return null;
  }
}

/**
 * Store an AI response in the cache.
 *
 * @param userPrompt  - The user's prompt
 * @param systemPrompt - The system prompt
 * @param response    - The AI's response text
 * @param ttlDays     - How many days to keep this cached (default: 7)
 */
export async function cacheResponse(
  userPrompt: string,
  systemPrompt: string,
  response: string,
  ttlDays: number = DEFAULT_TTL_DAYS
): Promise<void> {
  try {
    const key = buildCacheKey(userPrompt, systemPrompt);

    // Upsert: delete old entry if exists, then add new
    const existing = await db.aiCache.where("promptHash").equals(key).first();
    if (existing) {
      await db.aiCache.delete(existing.id!);
    }

    await db.aiCache.add({
      promptHash: key,
      response,
      ttlDays,
      createdAt: new Date(),
    });
  } catch {
    // Cache write failure is non-critical — silently ignore
  }
}

/**
 * Delete all expired cache entries. Call periodically or on app start.
 */
export async function purgeExpiredCache(): Promise<number> {
  try {
    const all = await db.aiCache.toArray();
    const now = Date.now();
    const expiredIds: number[] = [];

    for (const entry of all) {
      const ageMs = now - entry.createdAt.getTime();
      const ttlMs = entry.ttlDays * 24 * 60 * 60 * 1000;
      if (ageMs > ttlMs && entry.id != null) {
        expiredIds.push(entry.id);
      }
    }

    if (expiredIds.length > 0) {
      await db.aiCache.bulkDelete(expiredIds);
    }
    return expiredIds.length;
  } catch {
    return 0;
  }
}

/**
 * Clear the entire AI cache.
 */
export async function clearAICache(): Promise<void> {
  try {
    await db.aiCache.clear();
  } catch {
    // Ignore
  }
}

export { GRADING_TTL_DAYS, DEFAULT_TTL_DAYS };
