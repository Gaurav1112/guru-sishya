/**
 * Client-side page view tracker.
 *
 * Stores page visits in Supabase `page_views` table.
 * Rate-limited: max 1 record per user+path per 5 minutes to avoid spam.
 *
 * Required table:
 * ```sql
 * CREATE TABLE page_views (
 *   id bigserial PRIMARY KEY,
 *   email text,
 *   path text,
 *   created_at timestamptz DEFAULT now()
 * );
 * CREATE INDEX idx_page_views_created ON page_views (created_at DESC);
 * CREATE INDEX idx_page_views_email_path ON page_views (email, path, created_at DESC);
 * ```
 */

const RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

// In-memory cache to avoid duplicate inserts within the same session
const recentViews = new Map<string, number>();

/**
 * Track a page view. Call from client-side code (e.g., useEffect in layout).
 * Uses the anon Supabase client via an API route to avoid exposing service keys.
 */
export async function trackPageView(
  email: string | null | undefined,
  path: string
): Promise<void> {
  if (!email || !path) return;

  // Rate limit: skip if same user+path was tracked within 5 minutes
  const key = `${email}:${path}`;
  const lastTracked = recentViews.get(key);
  if (lastTracked && Date.now() - lastTracked < RATE_LIMIT_MS) return;

  // Mark as tracked immediately (optimistic) to prevent double fires
  recentViews.set(key, Date.now());

  // Clean up old entries to prevent memory leak (keep last 100)
  if (recentViews.size > 100) {
    const entries = [...recentViews.entries()].sort((a, b) => b[1] - a[1]);
    recentViews.clear();
    for (const [k, v] of entries.slice(0, 50)) {
      recentViews.set(k, v);
    }
  }

  try {
    await fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, path }),
    });
  } catch {
    // Fire-and-forget — silently ignore network failures
  }
}
