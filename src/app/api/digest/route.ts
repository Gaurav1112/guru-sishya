import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { auth } from "@/lib/auth";
import {
  buildWeeklyDigestHtml,
  WeeklyDigestData,
} from "@/lib/email-templates/weekly-digest";

/**
 * POST /api/digest
 *
 * Receives weekly digest data and sends the digest email to the authenticated user.
 * SECURITY: Requires authentication — only sends to the logged-in user's email
 * to prevent abuse as an arbitrary email-sending endpoint.
 *
 * Body: { digest: WeeklyDigestData }
 */
export async function POST(req: NextRequest) {
  // SECURITY: Rate limit -- max 3 digest requests per IP per hour
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!(await checkRateLimit(`digest:${ip}`, 3, 3600000))) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // SECURITY: Require authentication to prevent abuse as an email relay
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { digest } = body;

    // SECURITY: Always use the session email — never trust client-supplied email
    const email = session.user.email;

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
