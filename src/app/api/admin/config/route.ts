import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { isAdminEmail } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
const REDIS_KEY = "app_config";

// ── Default config ─────────────────────────────────────────────────────────────

export interface AppConfig {
  trialDays: number;
  freeAnswerLimit: number;
  freeStarLimit: number;
  freeFlashcardLimit: number;
  freeInterviewsPerDay: number;
  freeMitraMessages: number;
}

const DEFAULT_CONFIG: AppConfig = {
  trialDays: 7,
  freeAnswerLimit: 5,
  freeStarLimit: 3,
  freeFlashcardLimit: 50,
  freeInterviewsPerDay: 0,
  freeMitraMessages: 3,
};

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

async function readConfig(): Promise<AppConfig> {
  let client;
  try {
    client = await getRedis();
    const data = await client.get(REDIS_KEY);
    return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : { ...DEFAULT_CONFIG };
  } catch (err) {
    console.error("[admin/config] Redis read error:", err);
    return { ...DEFAULT_CONFIG };
  } finally {
    await client?.disconnect();
  }
}

async function writeConfig(config: AppConfig): Promise<void> {
  const client = await getRedis();
  try {
    await client.set(REDIS_KEY, JSON.stringify(config));
  } finally {
    await client.disconnect();
  }
}

// ── GET /api/admin/config ──────────────────────────────────────────────────────

export async function GET() {
  const config = await readConfig();
  return NextResponse.json({ config });
}

// ── POST /api/admin/config ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // SECURITY: Authenticate via server-side session, not client-supplied headers
  const session = await auth();
  const callerEmail = session?.user?.email;
  if (!isAdminEmail(callerEmail)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Partial<AppConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate numeric fields
  const numericFields: (keyof AppConfig)[] = [
    "trialDays",
    "freeAnswerLimit",
    "freeStarLimit",
    "freeFlashcardLimit",
    "freeInterviewsPerDay",
    "freeMitraMessages",
  ];

  for (const field of numericFields) {
    if (field in body) {
      const val = body[field];
      if (typeof val !== "number" || !Number.isInteger(val) || val < 0) {
        return NextResponse.json(
          { error: `${field} must be a non-negative integer` },
          { status: 400 }
        );
      }
    }
  }

  const current = await readConfig();
  const updated: AppConfig = { ...current, ...body };

  try {
    await writeConfig(updated);
  } catch (err) {
    console.error("[admin/config] Redis write error:", err);
    return NextResponse.json(
      { error: "Failed to save. Check Redis configuration." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, config: updated });
}
