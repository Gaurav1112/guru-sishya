import { auth } from "@/lib/auth";

/**
 * Admin emails — comma-separated list from env, with hardcoded fallback.
 * Format: "email1@example.com,email2@example.com"
 */
const ADMIN_EMAILS_RAW =
  process.env.ADMIN_EMAILS ??
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ??
  "kgauravis016@gmail.com";

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
