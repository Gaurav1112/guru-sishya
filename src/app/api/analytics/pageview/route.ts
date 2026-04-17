import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, path } = await req.json();

    if (!email || !path || typeof email !== "string" || typeof path !== "string") {
      return NextResponse.json({ error: "Missing email or path" }, { status: 400 });
    }

    // Sanitize: limit string lengths
    const safeEmail = email.slice(0, 255);
    const safePath = path.slice(0, 500);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("page_views").insert({
      email: safeEmail,
      path: safePath,
    });

    if (error) {
      console.error("[pageview] insert error:", error.message);
      // Don't fail the request — analytics are non-critical
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Graceful fallback — never break the client
    return NextResponse.json({ ok: false });
  }
}
