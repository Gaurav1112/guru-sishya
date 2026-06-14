import type { APIRoute } from "astro";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { FREE_LIMITS } from "@/lib/premium/limits";
import { verifyPremium } from "@/lib/premium/verify";

// ── POST /api/usage/check ────────────────────────────────────────────────────
// Server-side usage check. Returns whether the user is allowed to use a feature
// and how many uses remain today.
//
// Body: { feature: string; userId?: string }
// (userId is optional — we prefer the authenticated session email)
//
// Response: { allowed: boolean; remaining: number; limit: number }
//
// Graceful degradation: if Supabase is not configured, returns { allowed: true }
// so the client-side check remains the only gate (existing behaviour).

export const POST: APIRoute = async ({ request }) => {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`usage-check:${ip}`, 60, 60_000); // 60/min
  if (!rl.success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    // Not authenticated — allow (client-side is the gate for anonymous users)
    return Response.json({ allowed: true, remaining: Infinity, limit: Infinity });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let feature: string;
  try {
    const body = await request.json();
    feature = body.feature;
    if (typeof feature !== "string" || !feature) {
      return Response.json({ error: "Missing feature" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Premium check ──────────────────────────────────────────────────────
  const premium = await verifyPremium(email);
  if (premium.isPremium) {
    return Response.json({ allowed: true, remaining: Infinity, limit: Infinity });
  }

  // ── Feature limit lookup ───────────────────────────────────────────────
  const limits = FREE_LIMITS[feature];
  if (!limits) {
    // Unknown feature — allow by default
    return Response.json({ allowed: true, remaining: Infinity, limit: Infinity });
  }

  const dailyLimit = limits.daily;

  // ── Supabase usage tracking ────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // No Supabase — graceful degradation, allow everything
    return Response.json({ allowed: true, remaining: dailyLimit, limit: dailyLimit });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("count")
      .eq("user_email", email)
      .eq("feature", feature)
      .eq("date", today)
      .maybeSingle();

    if (error) {
      console.error("[usage/check]", error);
      // On error, allow — don't block users due to DB issues
      return Response.json({ allowed: true, remaining: dailyLimit, limit: dailyLimit });
    }

    const count = data?.count ?? 0;
    const remaining = Math.max(0, dailyLimit - count);

    return Response.json({
      allowed: count < dailyLimit,
      remaining,
      limit: dailyLimit,
    });
  } catch (err) {
    console.error("[usage/check] unexpected:", err);
    return Response.json({ allowed: true, remaining: dailyLimit, limit: dailyLimit });
  }
};
