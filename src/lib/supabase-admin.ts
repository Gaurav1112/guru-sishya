/**
 * Supabase admin helpers for user tracking and analytics.
 *
 * Required Supabase tables:
 *
 * ```sql
 * -- Users table
 * CREATE TABLE users (
 *   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   email text UNIQUE NOT NULL,
 *   name text,
 *   image text,
 *   provider text DEFAULT 'google',
 *   last_login_at timestamptz DEFAULT now(),
 *   login_count int DEFAULT 1,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- Page views table
 * CREATE TABLE page_views (
 *   id bigserial PRIMARY KEY,
 *   email text,
 *   path text,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * -- Index for active-user queries
 * CREATE INDEX idx_users_last_login ON users (last_login_at DESC);
 * CREATE INDEX idx_page_views_created ON page_views (created_at DESC);
 * CREATE INDEX idx_page_views_email_path ON page_views (email, path, created_at DESC);
 * ```
 */

import { getSupabaseAdmin } from "./supabase";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeAdmin() {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// User tracking
// ---------------------------------------------------------------------------

interface TrackUserInput {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Upsert a user row on every sign-in.
 * First login creates the record; subsequent logins bump login_count and
 * update last_login_at.
 */
export async function trackUserLogin(user: TrackUserInput): Promise<boolean> {
  if (!user.email) return false;
  const supabase = safeAdmin();
  if (!supabase) return false;

  try {
    const now = new Date().toISOString();

    // Upsert into user_progress — the single source of truth for the admin dashboard.
    // On first login: creates a row with defaults. On subsequent logins: updates
    // name/avatar/last_active without overwriting progress fields.
    const { data: existing } = await supabase
      .from("user_progress")
      .select("id")
      .eq("email", user.email)
      .single();

    if (existing) {
      // Existing user — only update profile info and last_active
      const { error } = await supabase
        .from("user_progress")
        .update({
          name: user.name ?? undefined,
          avatar_url: user.image ?? undefined,
          last_active: now,
        })
        .eq("email", user.email);

      if (error) {
        console.error("[supabase-admin] trackUserLogin update error:", error.message);
        return false;
      }
    } else {
      // New user — insert with defaults
      const { error } = await supabase.from("user_progress").insert({
        email: user.email,
        name: user.name ?? null,
        avatar_url: user.image ?? null,
        last_active: now,
        xp: 0,
        level: 1,
      });

      if (error) {
        console.error("[supabase-admin] trackUserLogin insert error:", error.message);
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error("[supabase-admin] trackUserLogin failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------

/**
 * Paginated list of all users, ordered by most recent login.
 */
export async function getAllUsers(page = 1, limit = 50) {
  const supabase = safeAdmin();
  if (!supabase) return { users: [], total: 0 };

  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("last_login_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[supabase-admin] getAllUsers error:", error.message);
      return { users: [], total: 0 };
    }

    return { users: data ?? [], total: count ?? 0 };
  } catch (err) {
    console.error("[supabase-admin] getAllUsers failed:", err);
    return { users: [], total: 0 };
  }
}

/**
 * Total number of registered users.
 */
export async function getUserCount(): Promise<number> {
  const supabase = safeAdmin();
  if (!supabase) return 0;

  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("[supabase-admin] getUserCount error:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("[supabase-admin] getUserCount failed:", err);
    return 0;
  }
}

/**
 * Users who logged in within a given period.
 * @param period - "24h" | "7d" | "30d"
 */
export async function getActiveUsers(
  period: "24h" | "7d" | "30d" = "7d"
): Promise<number> {
  const supabase = safeAdmin();
  if (!supabase) return 0;

  const hoursMap = { "24h": 24, "7d": 168, "30d": 720 };
  const since = new Date(
    Date.now() - hoursMap[period] * 60 * 60 * 1000
  ).toISOString();

  try {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("last_login_at", since);

    if (error) {
      console.error("[supabase-admin] getActiveUsers error:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error("[supabase-admin] getActiveUsers failed:", err);
    return 0;
  }
}

/**
 * All users with an active pro subscription.
 * Assumes a `subscriptions` table with `email` and `status` columns exists.
 * Returns empty array if the table doesn't exist.
 */
export async function getSubscribers() {
  const supabase = safeAdmin();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("email, plan, status, expires_at")
      .eq("status", "active");

    if (error) {
      // Table may not exist yet — not a hard failure
      console.error("[supabase-admin] getSubscribers error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("[supabase-admin] getSubscribers failed:", err);
    return [];
  }
}

/**
 * Summary stats for the admin dashboard.
 */
export async function getAdminStats() {
  const [totalUsers, active24h, active7d, active30d, subscribers] =
    await Promise.all([
      getUserCount(),
      getActiveUsers("24h"),
      getActiveUsers("7d"),
      getActiveUsers("30d"),
      getSubscribers(),
    ]);

  return {
    totalUsers,
    active24h,
    active7d,
    active30d,
    proSubscribers: subscribers.length,
    subscribers,
  };
}
