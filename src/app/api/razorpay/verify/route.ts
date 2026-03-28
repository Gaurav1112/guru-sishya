import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Plan durations ────────────────────────────────────────────────────────────

const PLAN_DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  semester: 180,
  annual: 365,
  lifetime: 36500, // 100 years — effectively permanent
};

// ── Plan amounts in paise (must match create-order) ───────────────────────────

const PLAN_AMOUNTS: Record<string, number> = {
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
      email,
    } = body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      planType?: string;
      email?: string;
    };

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

    // Fetch order from Razorpay to verify the amount matches the claimed planType
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: key_secret,
    });
    const order = await razorpay.orders.fetch(razorpay_order_id);
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
    try {
      const supabase = getSupabaseAdmin();
      await supabase.from("subscriptions").upsert(
        {
          email: email?.trim().toLowerCase() ?? "anonymous",
          plan_type: planType,
          premium_until: premiumUntil.toISOString(),
          payment_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
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
    const message = err instanceof Error ? err.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
