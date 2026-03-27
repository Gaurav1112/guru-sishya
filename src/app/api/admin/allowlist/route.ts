import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { auth } from "@/lib/auth";

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "kgauravis016@gmail.com";
const REDIS_KEY = "premium_allowlist";

// ── Redis client ───────────────────────────────────────────────────────────────

async function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL not configured");
  }
  const client = createClient({ url });
  await client.connect();
  return client;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function readAllowlist(): Promise<string[]> {
  let client;
  try {
    client = await getRedis();
    const data = await client.get(REDIS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("[admin/allowlist] Redis read error:", err);
    return [];
  } finally {
    await client?.disconnect();
  }
}

async function writeAllowlist(emails: string[]): Promise<void> {
  const client = await getRedis();
  try {
    await client.set(REDIS_KEY, JSON.stringify(emails));
  } finally {
    await client.disconnect();
  }
}

// ── GET /api/admin/allowlist ───────────────────────────────────────────────────
// SECURITY: This endpoint now checks if the caller is authenticated and only
// confirms whether THEIR email is on the list (not the full list).
// The full list is only returned to the admin.

export async function GET() {
  const session = await auth();
  const callerEmail = session?.user?.email?.toLowerCase() ?? "";

  // Admin gets the full list (for the admin console)
  if (callerEmail === ADMIN_EMAIL.toLowerCase()) {
    const emails = await readAllowlist();
    return NextResponse.json({ allowedEmails: emails });
  }

  // Non-admin authenticated users: check only their own email
  if (callerEmail) {
    const emails = await readAllowlist();
    const isAllowed = emails.map((e) => e.toLowerCase()).includes(callerEmail);
    // Return only whether the caller is allowed — don't leak other emails
    return NextResponse.json({ allowedEmails: isAllowed ? [callerEmail] : [] });
  }

  // Unauthenticated: return empty list
  return NextResponse.json({ allowedEmails: [] });
}

// ── POST /api/admin/allowlist ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // SECURITY: Authenticate via server-side session, not client-supplied headers
  const session = await auth();
  const callerEmail = session?.user?.email?.toLowerCase() ?? "";
  if (callerEmail !== ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string; action?: "add" | "remove" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, action } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  if (action !== "add" && action !== "remove") {
    return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (normalised === ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { error: "Admin email is always premium — no need to add it." },
      { status: 400 }
    );
  }

  let emails = await readAllowlist();

  if (action === "add") {
    if (!emails.map((e) => e.toLowerCase()).includes(normalised)) {
      emails.push(normalised);
    }
  } else {
    emails = emails.filter((e) => e.toLowerCase() !== normalised);
  }

  try {
    await writeAllowlist(emails);
  } catch (err) {
    console.error("[admin/allowlist] Redis write error:", err);
    return NextResponse.json(
      { error: "Failed to save. Check Redis configuration." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, allowedEmails: emails });
}
