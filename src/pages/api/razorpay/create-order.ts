import type { APIRoute } from "astro";
import Razorpay from "razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

// ── Plan definitions ─────────────────────────────────────────────────────────

const PLANS = {
  starter: {
    amount: 4900,    // ₹49 in paise
    currency: "INR",
    label: "Starter",
  },
  monthly: {
    amount: 14900,   // ₹149 in paise
    currency: "INR",
    label: "Monthly Pro",
  },
  semester: {
    amount: 69900,   // ₹699 in paise — 6 months
    currency: "INR",
    label: "Semester Pro",
  },
  annual: {
    amount: 119900,  // ₹1,199 in paise
    currency: "INR",
    label: "Annual Pro",
  },
  lifetime: {
    amount: 299900,  // ₹2,999 in paise — one-time
    currency: "INR",
    label: "Lifetime Pro",
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

export const POST: APIRoute = async ({ request, locals }) => {
  // SECURITY: Require authentication to create payment orders
  const session = await auth(locals);
  if (!session?.user?.email) {
    return Response.json({ error: "Sign in required to purchase" }, { status: 401 });
  }

  // SECURITY: Rate limit order creation to prevent abuse
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`razorpay-order:${ip}`, 5, 60000))) {
    return Response.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { planType } = body as { planType?: string };

    if (!planType || !(planType in PLANS)) {
      return Response.json(
        { error: "Invalid planType. Must be starter, monthly, semester, annual, or lifetime." },
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

    return Response.json({
      orderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[razorpay/create-order]", err);
    return Response.json({ error: "Failed to create order. Please try again." }, { status: 500 });
  }
};
