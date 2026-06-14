import type { APIRoute } from "astro";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST: APIRoute = async ({ request }) => {
  // SECURITY: Rate limit to prevent spam/abuse
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`email-capture:${ip}`, 5, 60000))) {
    return Response.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const { email, source } = await request.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
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

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to capture email" }, { status: 500 });
  }
};
