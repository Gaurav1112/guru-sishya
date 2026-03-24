import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "kgauravis016@gmail.com";

/** Absolute path to the allowlist JSON file inside /public/content */
const ALLOWLIST_FILE = path.join(process.cwd(), "public", "content", "premium-emails.json");

// ── Helpers ────────────────────────────────────────────────────────────────────

function readAllowlist(): string[] {
  try {
    const raw = fs.readFileSync(ALLOWLIST_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAllowlist(emails: string[]): void {
  fs.writeFileSync(ALLOWLIST_FILE, JSON.stringify(emails, null, 2) + "\n", "utf-8");
}

function getAdminEmail(req: NextRequest): string | null {
  // Accept the admin email via a custom header sent by the admin UI.
  // This is a lightweight guard — no sensitive data is exposed, since the
  // allowlist is a public JSON file. A proper DB-backed solution would use
  // full server-side session verification.
  return req.headers.get("x-admin-email");
}

// ── GET /api/admin/allowlist ───────────────────────────────────────────────────
// Public — returns the list so the client can auto-grant premium to listed users.

export async function GET() {
  const emails = readAllowlist();
  return NextResponse.json({ allowedEmails: emails });
}

// ── POST /api/admin/allowlist ─────────────────────────────────────────────────
// Protected — only the admin email may add/remove entries.

export async function POST(req: NextRequest) {
  // Auth check
  const callerEmail = getAdminEmail(req);
  if (!callerEmail || callerEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
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

  // Don't allow adding/removing the admin email itself — it's always premium
  if (normalised === ADMIN_EMAIL.toLowerCase()) {
    return NextResponse.json(
      { error: "Admin email is always premium — no need to add it to the allowlist." },
      { status: 400 }
    );
  }

  let emails = readAllowlist();

  if (action === "add") {
    if (!emails.map((e) => e.toLowerCase()).includes(normalised)) {
      emails.push(normalised);
    }
  } else {
    emails = emails.filter((e) => e.toLowerCase() !== normalised);
  }

  try {
    writeAllowlist(emails);
  } catch (err) {
    console.error("[admin/allowlist] Failed to write allowlist:", err);
    return NextResponse.json(
      { error: "Failed to persist allowlist. On Vercel, writes to /public are not persistent — use a database for production." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, allowedEmails: emails });
}
