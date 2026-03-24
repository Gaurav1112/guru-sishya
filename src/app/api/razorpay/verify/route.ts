import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ── Plan durations ────────────────────────────────────────────────────────────

const PLAN_DURATION_DAYS: Record<string, number> = {
  monthly: 30,
  semester: 180,
  annual: 365,
};

// ── POST /api/razorpay/verify ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planType) {
      return NextResponse.json(
        { error: "Missing required payment fields." },
        { status: 400 }
      );
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

    // Compute premium expiry date
    const durationDays = PLAN_DURATION_DAYS[planType] ?? 30;
    const premiumUntil = new Date();
    premiumUntil.setDate(premiumUntil.getDate() + durationDays);

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
