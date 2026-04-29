import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

const SUPABASE_CONFIG_TABLE = "app_config";

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

// ── Helpers ────────────────────────────────────────────────────────────────────

async function readConfig(): Promise<AppConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from(SUPABASE_CONFIG_TABLE)
      .select("key, value")
      .limit(50);

    if (error || !data || data.length === 0) {
      return { ...DEFAULT_CONFIG };
    }

    const configFromDb: Record<string, number> = {};
    for (const row of data) {
      configFromDb[row.key] = Number(row.value);
    }
    return { ...DEFAULT_CONFIG, ...configFromDb };
  } catch (err) {
    console.error("[admin/config] read error:", err);
    return { ...DEFAULT_CONFIG };
  }
}

async function writeConfig(config: AppConfig): Promise<void> {
  const supabase = getSupabaseAdmin();
  const rows = Object.entries(config).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  for (const row of rows) {
    const { error } = await supabase
      .from(SUPABASE_CONFIG_TABLE)
      .upsert(row, { onConflict: "key" });
    if (error) {
      console.error(`[admin/config] write error for ${row.key}:`, error.message);
    }
  }
}

// ── GET /api/admin/config ──────────────────────────────────────────────────────

export async function GET() {
  const config = await readConfig();
  return NextResponse.json({ config });
}

// ── POST /api/admin/config ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
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
    console.error("[admin/config] write error:", err);
    return NextResponse.json(
      { error: "Failed to save. Check Supabase configuration." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, config: updated });
}
