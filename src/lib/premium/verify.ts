/**
 * Server-side premium verification.
 *
 * Checks Supabase for subscription status and caches the result for 5 minutes
 * to avoid excessive DB calls. Falls back gracefully when Supabase is not
 * configured (returns not-premium rather than crashing).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface PremiumVerification {
  isPremium: boolean;
  expiresAt: string | null;
  planType: string | null;
}

// ── In-memory cache (per serverless instance) ────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  result: PremiumVerification;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(userId: string): PremiumVerification | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(userId);
    return null;
  }
  return entry.result;
}

function setCache(userId: string, result: PremiumVerification): void {
  // Cap cache size to prevent memory leak on long-running instances
  if (cache.size > 10_000) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(userId, { result, cachedAt: Date.now() });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Verify whether a user has an active premium subscription.
 *
 * - Checks Supabase `subscriptions` table by email.
 * - Caches result for 5 minutes.
 * - Returns `{ isPremium: false }` when Supabase is not configured (graceful
 *   degradation — the client-side check remains the only gate).
 */
export async function verifyPremium(userId: string): Promise<PremiumVerification> {
  // Fast path: return cached result
  const cached = getCached(userId);
  if (cached) return cached;

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // No Supabase — cannot verify server-side. Return not-premium so the
    // client-side check is the only gate (existing behaviour).
    const fallback: PremiumVerification = {
      isPremium: false,
      expiresAt: null,
      planType: null,
    };
    return fallback;
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan_type, premium_until")
      .eq("email", userId.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("[premium/verify]", error);
      // On error, don't block the user — return not-premium
      return { isPremium: false, expiresAt: null, planType: null };
    }

    if (!data) {
      const result: PremiumVerification = {
        isPremium: false,
        expiresAt: null,
        planType: null,
      };
      setCache(userId, result);
      return result;
    }

    const { plan_type, premium_until } = data;
    const isLifetime = plan_type === "lifetime";
    const isPremium =
      isLifetime ||
      (premium_until != null && new Date(premium_until) > new Date());

    const result: PremiumVerification = {
      isPremium,
      expiresAt: premium_until ?? null,
      planType: plan_type ?? null,
    };

    setCache(userId, result);
    return result;
  } catch (err) {
    console.error("[premium/verify] unexpected error:", err);
    return { isPremium: false, expiresAt: null, planType: null };
  }
}

/**
 * Invalidate the premium cache for a specific user.
 * Call this after a payment is verified or a subscription changes.
 */
export function invalidatePremiumCache(userId: string): void {
  cache.delete(userId.toLowerCase());
}
