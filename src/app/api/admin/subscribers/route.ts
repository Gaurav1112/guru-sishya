import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── GET /api/admin/subscribers ─────────────────────────────────────────────────
// Admin-only route that returns all subscriber records from Supabase.
// Protected by x-admin-email header check.

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kgauravis016@gmail.com";

export async function GET(req: NextRequest) {
  try {
    const adminEmail = req.headers.get("x-admin-email") ?? "";
    if (adminEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("email, plan_type, premium_until, payment_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/subscribers]", error);
      return NextResponse.json(
        { error: "Failed to fetch subscribers." },
        { status: 500 }
      );
    }

    return NextResponse.json({ subscribers: data ?? [] });
  } catch (err) {
    console.error("[admin/subscribers]", err);
    const message = err instanceof Error ? err.message : "Fetch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
