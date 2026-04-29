import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Rate limit to prevent analytics table spam
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (!(await checkRateLimit(`pageview:${ip}`, 30, 60000))) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    // SECURITY: Use authenticated session email, not client-supplied email
    const session = await auth();
    const sessionEmail = session?.user?.email?.trim().toLowerCase();

    const { path } = await req.json();

    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "Missing path" }, { status: 400 });
    }

    // Use the session email if available, otherwise skip recording
    if (!sessionEmail) {
      return NextResponse.json({ ok: true }); // silently skip for unauthenticated
    }

    const safeEmail = sessionEmail.slice(0, 255);
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
