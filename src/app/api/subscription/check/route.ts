import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/subscription/check?email=user@example.com ───────────────────────
// Server-side premium check that cannot be bypassed from the client.
// Returns: { isPremium, premiumUntil, planType }

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "email query parameter is required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plan_type, premium_until, payment_id")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[subscription/check]", error);
      return NextResponse.json(
        { error: "Failed to check subscription." },
        { status: 500 }
      );
    }

    if (!data) {
      // No record found — not premium
      return NextResponse.json({
        isPremium: false,
        premiumUntil: null,
        planType: null,
      });
    }

    const { plan_type, premium_until } = data;

    // Lifetime plan never expires
    const isLifetime = plan_type === "lifetime";
    const isPremium =
      isLifetime ||
      (premium_until != null && new Date(premium_until) > new Date());

    return NextResponse.json({
      isPremium,
      premiumUntil: premium_until ?? null,
      planType: plan_type ?? null,
    });
  } catch (err) {
    console.error("[subscription/check]", err);
    const message = err instanceof Error ? err.message : "Check failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
