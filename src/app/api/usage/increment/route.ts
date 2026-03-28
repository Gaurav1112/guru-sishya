import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { FREE_LIMITS } from "@/lib/premium/limits";
import { verifyPremium } from "@/lib/premium/verify";

// ── POST /api/usage/increment ────────────────────────────────────────────────
// Server-side usage increment. Increments the usage counter for a feature and
// returns the updated remaining count.
//
// Body: { feature: string }
//
// Response: { success: boolean; remaining: number; limit: number }
//
// Graceful degradation: if Supabase is not configured, returns success so the
// client-side tracking remains the only source of truth.

export async function POST(req: NextRequest) {
  // ── Rate limit ───────────────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await rateLimit(`usage-inc:${ip}`, 30, 60_000); // 30/min
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const session = await auth();
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    // Not authenticated — silently succeed (client-side is the gate)
    return NextResponse.json({ success: true, remaining: Infinity, limit: Infinity });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let feature: string;
  try {
    const body = await req.json();
    feature = body.feature;
    if (typeof feature !== "string" || !feature) {
      return NextResponse.json({ error: "Missing feature" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Premium check ──────────────────────────────────────────────────────
  const premium = await verifyPremium(email);
  if (premium.isPremium) {
    return NextResponse.json({ success: true, remaining: Infinity, limit: Infinity });
  }

  // ── Feature limit lookup ───────────────────────────────────────────────
  const limits = FREE_LIMITS[feature];
  if (!limits) {
    return NextResponse.json({ success: true, remaining: Infinity, limit: Infinity });
  }

  const dailyLimit = limits.daily;

  // ── Supabase usage tracking ────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // No Supabase — graceful degradation
    return NextResponse.json({ success: true, remaining: dailyLimit, limit: dailyLimit });
  }

  try {
    const { getSupabaseAdmin } = await import("@/lib/supabase");
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split("T")[0];

    // Check current count
    const { data: existing, error: fetchError } = await supabase
      .from("usage_tracking")
      .select("id, count")
      .eq("user_email", email)
      .eq("feature", feature)
      .eq("date", today)
      .maybeSingle();

    if (fetchError) {
      console.error("[usage/increment] fetch error:", fetchError);
      return NextResponse.json({ success: true, remaining: dailyLimit, limit: dailyLimit });
    }

    const currentCount = existing?.count ?? 0;

    // Enforce limit server-side
    if (currentCount >= dailyLimit) {
      return NextResponse.json({
        success: false,
        remaining: 0,
        limit: dailyLimit,
      });
    }

    // Upsert the count
    if (existing) {
      const { error: updateError } = await supabase
        .from("usage_tracking")
        .update({ count: currentCount + 1 })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[usage/increment] update error:", updateError);
        return NextResponse.json({ success: true, remaining: dailyLimit - currentCount, limit: dailyLimit });
      }
    } else {
      const { error: insertError } = await supabase
        .from("usage_tracking")
        .insert({
          user_email: email,
          feature,
          date: today,
          count: 1,
        });

      if (insertError) {
        console.error("[usage/increment] insert error:", insertError);
        return NextResponse.json({ success: true, remaining: dailyLimit, limit: dailyLimit });
      }
    }

    const newCount = currentCount + 1;
    const remaining = Math.max(0, dailyLimit - newCount);

    return NextResponse.json({
      success: true,
      remaining,
      limit: dailyLimit,
    });
  } catch (err) {
    console.error("[usage/increment] unexpected:", err);
    return NextResponse.json({ success: true, remaining: dailyLimit, limit: dailyLimit });
  }
}
