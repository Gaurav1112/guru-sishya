import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// ── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = {
  monthly: {
    amount: 12900,   // ₹129 in paise
    currency: "INR",
    label: "Monthly Pro",
  },
  semester: {
    amount: 59900,   // ₹599 in paise — 6 months
    currency: "INR",
    label: "Semester Pro",
  },
  annual: {
    amount: 99900,   // ₹999 in paise
    currency: "INR",
    label: "Annual Pro",
  },
} as const;

type PlanType = keyof typeof PLANS;

// ── Razorpay instance ────────────────────────────────────────────────────────

function getRazorpayInstance() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({ key_id, key_secret });
}

// ── POST /api/razorpay/create-order ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planType } = body as { planType?: string };

    if (!planType || !(planType in PLANS)) {
      return NextResponse.json(
        { error: "Invalid planType. Must be monthly, semester, or annual." },
        { status: 400 }
      );
    }

    const plan = PLANS[planType as PlanType];
    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        planType,
        label: plan.label,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    const message = err instanceof Error ? err.message : "Failed to create order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
