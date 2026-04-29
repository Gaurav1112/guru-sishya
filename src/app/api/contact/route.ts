import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

interface ContactPayload {
  name: string;
  email: string;
  category: string;
  message: string;
}

const VALID_CATEGORIES = ["billing", "technical", "account", "feedback", "refund", "other"];

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const allowed = await checkRateLimit(`contact:${ip}`, 3, 3600000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = (await req.json()) as ContactPayload;

    if (!body.email?.trim() || !body.message?.trim()) {
      return NextResponse.json({ error: "Email and message are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!VALID_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const sanitised = {
      name: (body.name || "Anonymous").slice(0, 200),
      email: body.email.trim().slice(0, 320),
      category: body.category,
      message: body.message.trim().slice(0, 5000),
      ip,
      timestamp: new Date().toISOString(),
    };

    // Log to server logs (visible in Vercel)
    console.log(
      "CONTACT FORM SUBMISSION:",
      JSON.stringify(sanitised, null, 2),
    );

    // Store in Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
        );
        await supabase.from("contact_submissions").insert({
          name: sanitised.name,
          email: sanitised.email,
          category: sanitised.category,
          message: sanitised.message,
          ip_hash: ip ? Buffer.from(ip).toString("base64").slice(0, 20) : null,
          created_at: sanitised.timestamp,
        });
      } catch {
        // Supabase storage is best-effort; form still succeeds
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
