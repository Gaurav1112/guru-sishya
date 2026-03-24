import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// ── Constants ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "kgauravis016@gmail.com";
const REDIS_KEY = "premium_allowlist";

// ── Redis client ───────────────────────────────────────────────────────────────

function getRedis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Redis not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }

  return new Redis({ url, token });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function readAllowlist(): Promise<string[]> {
  try {
    const redis = getRedis();
    const data = await redis.get<string[]>(REDIS_KEY);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[admin/allowlist] Redis read error:", err);
    return [];
  }
}

async function writeAllowlist(emails: string[]): Promise<void> {
  const redis = getRedis();
  await redis.set(REDIS_KEY, emails);
}

// ── GET /api/admin/allowlist ───────────────────────────────────────────────────

export async function GET() {
  const emails = await readAllowlist();
  return NextResponse.json({ allowedEmails: emails });
}

// ── POST /api/admin/allowlist ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const callerEmail = req.headers.get("x-admin-email");
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
