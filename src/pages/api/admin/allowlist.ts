import type { APIRoute } from "astro";
import { isAdminEmail } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function readAllowlist(): Promise<string[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("premium_allowlist")
      .select("email");

    if (error) {
      console.error("[admin/allowlist] Supabase read error:", error.message);
      return [];
    }
    return (data ?? []).map((row) => row.email);
  } catch (err) {
    console.error("[admin/allowlist] read error:", err);
    return [];
  }
}

// ── GET /api/admin/allowlist ───────────────────────────────────────────────────
// Admin gets the full list. Non-admin authenticated users only see their own status.

export const GET: APIRoute = async ({ locals }) => {
  const session = await auth(locals);
  const callerEmail = session?.user?.email?.toLowerCase() ?? "";

  const cacheHeaders = {
    "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
  };

  // Admin gets the full list (for the admin console)
  if (isAdminEmail(callerEmail)) {
    const emails = await readAllowlist();
    return Response.json({ allowedEmails: emails }, { headers: cacheHeaders });
  }

  // Non-admin authenticated users: check only their own email
  if (callerEmail) {
    const emails = await readAllowlist();
    const isAllowed = emails.map((e) => e.toLowerCase()).includes(callerEmail);
    return Response.json(
      { allowedEmails: isAllowed ? [callerEmail] : [] },
      { headers: cacheHeaders }
    );
  }

  // Unauthenticated: return empty list
  return Response.json({ allowedEmails: [] });
};

// ── POST /api/admin/allowlist ─────────────────────────────────────────────────

export const POST: APIRoute = async ({ request, locals }) => {
  const session = await auth(locals);
  const callerEmail = session?.user?.email;
  if (!isAdminEmail(callerEmail)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { email?: string; action?: "add" | "remove" };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, action } = body;

  if (!email || typeof email !== "string") {
    return Response.json({ error: "email is required" }, { status: 400 });
  }
  if (action !== "add" && action !== "remove") {
    return Response.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
  }

  const normalised = email.trim().toLowerCase();

  if (!normalised || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalised)) {
    return Response.json({ error: "Invalid email address" }, { status: 400 });
  }

  if (isAdminEmail(normalised)) {
    return Response.json(
      { error: "Admin email is always premium — no need to add it." },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    if (action === "add") {
      const { error } = await supabase.from("premium_allowlist").upsert(
        { email: normalised, added_by: callerEmail! },
        { onConflict: "email" }
      );
      if (error) {
        console.error("[admin/allowlist] add error:", error.message);
        return Response.json({ error: "Failed to add email." }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("premium_allowlist")
        .delete()
        .eq("email", normalised);
      if (error) {
        console.error("[admin/allowlist] remove error:", error.message);
        return Response.json({ error: "Failed to remove email." }, { status: 500 });
      }
    }

    const emails = await readAllowlist();
    return Response.json({ success: true, allowedEmails: emails });
  } catch (err) {
    console.error("[admin/allowlist] write error:", err);
    return Response.json(
      { error: "Failed to save. Check Supabase configuration." },
      { status: 500 }
    );
  }
};
