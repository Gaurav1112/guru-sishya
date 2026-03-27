import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // SECURITY: Rate limit to prevent spam/abuse
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`email-capture:${ip}`, 5, 60000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Store in Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();
      await supabase.from("email_captures").upsert(
        {
          email: email.toLowerCase().trim(),
          source: source || "landing",
          captured_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to capture email" }, { status: 500 });
  }
}
