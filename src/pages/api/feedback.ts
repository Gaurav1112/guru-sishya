import type { APIRoute } from "astro";
import { checkRateLimit } from "@/lib/rate-limit";

interface FeedbackPayload {
  type: string;
  message: string;
  page: string;
  userAgent: string;
  timestamp: string;
  screenSize: string;
  connection: string;
}

export const POST: APIRoute = async ({ request }) => {
  // Rate limit: 5 feedback submissions per IP per hour
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const allowed = await checkRateLimit(`feedback:${ip}`, 5, 3600000);
  if (!allowed) {
    return Response.json({ error: "Too many submissions. Try again later." }, { status: 429 });
  }

  try {
    const body = (await request.json()) as FeedbackPayload;

    if (!body.message?.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    if (!["bug", "lag", "idea"].includes(body.type)) {
      return Response.json({ error: "Invalid feedback type" }, { status: 400 });
    }

    // Log to console (visible in Vercel logs / server logs)
    console.log("📬 FEEDBACK RECEIVED:", JSON.stringify({
      type: body.type,
      message: body.message.slice(0, 500),
      page: body.page,
      screenSize: body.screenSize,
      connection: body.connection,
      userAgent: body.userAgent?.slice(0, 200),
      timestamp: body.timestamp,
      ip,
    }, null, 2));

    // Store in Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { getSupabaseAdmin } = await import("@/lib/supabase");
        const supabase = getSupabaseAdmin();
        await supabase.from("feedback").insert({
          type: body.type,
          message: body.message.slice(0, 2000),
          page: body.page,
          screen_size: body.screenSize,
          connection: body.connection,
          user_agent: body.userAgent?.slice(0, 500),
          ip_hash: ip ? Buffer.from(ip).toString("base64").slice(0, 20) : null,
          created_at: body.timestamp,
        });
      } catch {
        // Supabase storage is best-effort
      }
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
};
