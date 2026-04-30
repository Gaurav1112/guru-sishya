import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

// ── Plan durations ────────────────────────────────────────────────────────────

const PLAN_DURATION_DAYS: Record<string, number> = {
  starter: 30,
  monthly: 30,
  semester: 180,
  annual: 365,
  lifetime: 36500, // 100 years — effectively permanent
};

// ── Plan amounts in paise (must match create-order) ───────────────────────────

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 4900,
  monthly: 14900,
  semester: 69900,
  annual: 119900,
  lifetime: 299900,
};

// ── POST /api/razorpay/verify ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // SECURITY: Rate limit to prevent brute-force signature guessing
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`razorpay-verify:${ip}`, 10, 60000))) {
    return NextResponse.json(
      { error: "Too many verification attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planType,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planType?: string;
    };

    // SECURITY: Use authenticated session email, not client-supplied email.
    // This prevents IDOR where an attacker could assign a subscription to any email.
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planType) {
      return NextResponse.json(
        { error: "Missing required payment fields." },
        { status: 400 }
      );
    }

    // Validate planType is one of the known values
    const expectedAmount = PLAN_AMOUNTS[planType];
    if (!expectedAmount) {
      return NextResponse.json({ error: "Invalid plan type." }, { status: 400 });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // Verify HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Payment signature verification failed." },
        { status: 400 }
      );
    }

    // Idempotency: if this payment_id was already processed, return cached result
    try {
      const supabase = getSupabaseAdmin();
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("premium_until, plan_type")
        .eq("payment_id", razorpay_payment_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          success: true,
          premiumUntil: existing.premium_until,
          paymentId: razorpay_payment_id,
          planType: existing.plan_type,
        });
      }
    } catch {
      // Supabase unavailable — proceed with normal verification
    }

    // Fetch order from Razorpay with a 5-second timeout to prevent hanging
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: key_secret,
    });

    const orderPromise = razorpay.orders.fetch(razorpay_order_id);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Razorpay fetch timed out")), 5000)
    );

    const order = await Promise.race([orderPromise, timeoutPromise]);
    if (Number(order.amount) !== expectedAmount) {
      return NextResponse.json(
        { error: "Plan type does not match payment amount." },
        { status: 400 }
      );
    }

    // Compute premium expiry date
    const durationDays = PLAN_DURATION_DAYS[planType] ?? 30;
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

    // Persist subscription to Supabase (server-side, non-bypassable)
    // Use payment_id as unique key to prevent duplicate rows from race conditions
    try {
      const supabase = getSupabaseAdmin();
      const { error: upsertError } = await supabase.from("subscriptions").upsert(
        {
          email: email ?? "anonymous",
          plan_type: planType,
          premium_until: premiumUntil.toISOString(),
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "payment_id" }
      );
      if (upsertError) {
        console.error("[razorpay/verify] Supabase upsert error:", upsertError.message);
      }
    } catch (supabaseErr) {
      // Log but don't fail the response — localStorage flow still works
      console.error("[razorpay/verify] Supabase upsert failed:", supabaseErr);
    }

    return NextResponse.json({
      success: true,
      premiumUntil: premiumUntil.toISOString(),
      paymentId: razorpay_payment_id,
      planType,
    });
  } catch (err) {
    console.error("[razorpay/verify]", err);
    return NextResponse.json({ error: "Payment verification failed. Please contact support." }, { status: 500 });
  }
}
