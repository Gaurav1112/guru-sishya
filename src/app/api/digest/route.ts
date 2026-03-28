import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/digest
 *
 * Receives weekly digest data and a user email.
 * For now this logs the request -- actual email sending will use SendGrid later.
 *
 * Body: { email: string; digest: WeeklyDigest }
 */
export async function POST(req: NextRequest) {
  // SECURITY: Rate limit -- max 3 digest requests per IP per hour
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`digest:${ip}`, 3, 3600000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { email, digest } = body;

    // Validate email
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Validate digest payload exists
    if (!digest || typeof digest !== "object") {
      return NextResponse.json(
        { error: "Missing digest data" },
        { status: 400 }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim().slice(0, 320);

    // Log for now -- replace with SendGrid integration later
    console.log(
      `[Weekly Digest] Request for ${sanitizedEmail}`,
      JSON.stringify({
        weekStart: digest.weekStart,
        weekEnd: digest.weekEnd,
        questionsAnswered: digest.questionsAnswered,
        averageAccuracy: digest.averageAccuracy,
        currentStreak: digest.currentStreak,
        topicsStudied: digest.topicsStudied?.length ?? 0,
        badgesEarned: digest.badgesEarned?.length ?? 0,
        weakAreas: digest.weakAreas?.length ?? 0,
      })
    );

    // TODO: Store email preference in Supabase when configured
    // TODO: Queue email via SendGrid when configured

    return NextResponse.json({ success: true, message: "Digest queued" });
  } catch {
    return NextResponse.json(
      { error: "Failed to process digest request" },
      { status: 500 }
    );
  }
}
