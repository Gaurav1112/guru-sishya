import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// ── GET /api/subscription/check?email=user@example.com ───────────────────────
// Server-side premium check that cannot be bypassed from the client.
// Returns: { isPremium, premiumUntil, planType }
// SECURITY: Authenticated — users can only check their own subscription.

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Rate limit to prevent enumeration attacks
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!(await checkRateLimit(`sub-check:${ip}`, 30, 60000))) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429 }
      );
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // SECURITY: Only allow users to query their own subscription (prevents IDOR)
    const email = session.user.email.trim().toLowerCase();
    const requestedEmail = new URL(req.url).searchParams.get("email")?.trim().toLowerCase();
    if (requestedEmail && requestedEmail !== email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    // Check subscriptions table first
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

    const cacheHeaders = {
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    };

    if (data) {
      const { plan_type, premium_until } = data;
      const isLifetime = plan_type === "lifetime";
      const isPremium =
        isLifetime ||
        (premium_until != null && new Date(premium_until) > new Date());

      return NextResponse.json(
        {
          isPremium,
          premiumUntil: premium_until ?? null,
          planType: plan_type ?? null,
        },
        { headers: cacheHeaders }
      );
    }

    // No subscription — check the premium allowlist
    const { data: allowlistRow } = await supabase
      .from("premium_allowlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (allowlistRow) {
      return NextResponse.json(
        {
          isPremium: true,
          premiumUntil: "9999-12-31T23:59:59.999Z",
          planType: "allowlist_free",
        },
        { headers: cacheHeaders }
      );
    }

    // Not premium
    return NextResponse.json(
      {
        isPremium: false,
        premiumUntil: null,
        planType: null,
      },
      { headers: cacheHeaders }
    );
  } catch (err) {
    console.error("[subscription/check]", err);
    return NextResponse.json({ error: "Failed to check subscription." }, { status: 500 });
  }
}
