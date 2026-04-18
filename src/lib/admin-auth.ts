import { auth } from "@/lib/auth";

/**
 * Admin emails — comma-separated list from env variable ADMIN_EMAILS.
 * Format: "email1@example.com,email2@example.com"
 *
 * SECURITY: No hardcoded fallback. If ADMIN_EMAILS is unset, no one is admin.
 * Do NOT use NEXT_PUBLIC_ prefix — admin emails must stay server-side only.
 */
const ADMIN_EMAILS_RAW = process.env.ADMIN_EMAILS || "gurusishya.in@gmail.com";

export const ADMIN_EMAILS = ADMIN_EMAILS_RAW.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/** Returns true if the given email is an admin email. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Server-side admin session check.
 * Returns the session if the user is an admin, or null if not.
 */
export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdminEmail(email)) return null;
  return session;
}
