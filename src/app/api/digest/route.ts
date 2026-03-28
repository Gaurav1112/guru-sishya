import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import {
  buildWeeklyDigestHtml,
  WeeklyDigestData,
} from "@/lib/email-templates/weekly-digest";

/**
 * POST /api/digest
 *
 * Receives weekly digest data and a user email, then sends
 * the digest email via Resend (or logs if no API key configured).
 *
 * Body: { email: string; digest: WeeklyDigestData }
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

    // Build the digest data with safe defaults
    const digestData: WeeklyDigestData = {
      weekStart: String(digest.weekStart ?? ""),
      weekEnd: String(digest.weekEnd ?? ""),
      questionsAnswered: Number(digest.questionsAnswered) || 0,
      averageAccuracy: Number(digest.averageAccuracy) || 0,
      currentStreak: Number(digest.currentStreak) || 0,
      topicsStudied: Array.isArray(digest.topicsStudied)
        ? digest.topicsStudied.map(String)
        : [],
      badgesEarned: Array.isArray(digest.badgesEarned)
        ? digest.badgesEarned.map(String)
        : [],
      weakAreas: Array.isArray(digest.weakAreas)
        ? digest.weakAreas.map(String)
        : [],
    };

    // Generate the HTML and send
    const html = buildWeeklyDigestHtml(digestData);
    const result = await sendEmail({
      to: sanitizedEmail,
      subject: `Your Weekly Learning Digest (${digestData.weekStart} - ${digestData.weekEnd})`,
      html,
    });

    if (!result.success) {
      console.error(`[Digest] Failed to send to ${sanitizedEmail}:`, result.error);
      return NextResponse.json(
        { error: "Failed to send digest email" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Digest sent",
      id: result.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process digest request" },
      { status: 500 }
    );
  }
}
