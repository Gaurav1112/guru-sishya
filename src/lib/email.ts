// ────────────────────────────────────────────────────────────────────────────
// Email service — wraps Resend SDK with graceful fallback
// ────────────────────────────────────────────────────────────────────────────

import { Resend } from "resend";

const FROM_ADDRESS = "Guru Sishya <noreply@guru-sishya.in>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends an email via Resend. If the RESEND_API_KEY env var is missing,
 * falls back to console logging (useful for local dev and testing).
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const { to, subject, html } = options;

  // Graceful fallback — no API key means log-only mode
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[Email] RESEND_API_KEY not set — logging email instead of sending.`
    );
    console.log(`[Email] To: ${to}`);
    console.log(`[Email] Subject: ${subject}`);
    console.log(`[Email] HTML length: ${html.length} chars`);
    return { success: true, id: "log-only" };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Resend error:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Email] Failed to send:`, message);
    return { success: false, error: message };
  }
}
