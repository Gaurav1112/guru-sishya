import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// In-memory fallback (used when Upstash env vars are missing)
// ---------------------------------------------------------------------------
const rateMap = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: now + windowMs };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Upstash Redis client (created lazily, only when env vars exist)
// ---------------------------------------------------------------------------
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

// ---------------------------------------------------------------------------
// Sliding-window rate limiter backed by Upstash Redis
//
// Algorithm: uses two fixed windows (current + previous) to approximate a
// sliding window. Each window is a simple counter stored as a Redis key with
// a TTL of 2 * windowMs (so the previous window is still available).
//
// weighted_count = prev_count * overlap_ratio + current_count
//
// This is the same algorithm used by @upstash/ratelimit "slidingWindow".
// We implement it directly with a pipeline for full control and no extra dep.
// ---------------------------------------------------------------------------
async function redisRateLimit(
  client: Redis,
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const now = Date.now();
  const windowSec = Math.ceil(windowMs / 1000);
  const currentWindow = Math.floor(now / windowMs);
  const previousWindow = currentWindow - 1;

  const currentKey = `rl:${key}:${currentWindow}`;
  const previousKey = `rl:${key}:${previousWindow}`;

  // Pipeline: increment current window + read previous window
  const pipeline = client.pipeline();
  pipeline.incr(currentKey);
  pipeline.expire(currentKey, windowSec * 2);
  pipeline.get(previousKey);

  const results = await pipeline.exec();

  const currentCount = results[0] as number; // INCR returns new value
  const previousCount = Number(results[2] ?? 0);

  // Calculate sliding window weight
  const elapsed = now - currentWindow * windowMs;
  const overlapRatio = 1 - elapsed / windowMs;
  const weightedCount = Math.floor(previousCount * overlapRatio) + currentCount;

  const reset = (currentWindow + 1) * windowMs;
  const remaining = Math.max(0, limit - weightedCount);
  const success = weightedCount <= limit;

  return { success, remaining, reset };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Full rate-limit check returning detailed info.
 *
 * Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are set; falls back to in-memory otherwise.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const client = getRedis();

  if (!client) {
    return inMemoryRateLimit(key, limit, windowMs);
  }

  try {
    return await redisRateLimit(client, key, limit, windowMs);
  } catch {
    // Redis unavailable at runtime — fall back gracefully
    return inMemoryRateLimit(key, limit, windowMs);
  }
}

/**
 * Backward-compatible boolean check used by existing API routes.
 *
 * Returns `true` if the request is allowed, `false` if rate-limited.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const result = await rateLimit(key, limit, windowMs);
  return result.success;
}
