import type { APIRoute } from "astro";
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
// SECURITY: Admin-only — prevents leaking internal feature gate values.

export const GET: APIRoute = async ({ locals }) => {
  const session = await auth(locals);
  const callerEmail = session?.user?.email;
  if (!isAdminEmail(callerEmail)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const config = await readConfig();
  return Response.json(
    { config },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    }
  );
};

// ── POST /api/admin/config ─────────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const session = await auth(locals);
  const callerEmail = session?.user?.email;
  if (!isAdminEmail(callerEmail)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Partial<AppConfig>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
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
        return Response.json(
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
    return Response.json(
      { error: "Failed to save. Check Supabase configuration." },
      { status: 500 }
    );
  }

  return Response.json({ success: true, config: updated });
};
