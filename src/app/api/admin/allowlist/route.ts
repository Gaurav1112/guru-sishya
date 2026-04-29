import { NextRequest, NextResponse } from "next/server";
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

export async function GET() {
  const session = await auth();
  const callerEmail = session?.user?.email?.toLowerCase() ?? "";

  // Admin gets the full list (for the admin console)
  if (isAdminEmail(callerEmail)) {
    const emails = await readAllowlist();
    return NextResponse.json({ allowedEmails: emails });
  }

  // Non-admin authenticated users: check only their own email
  if (callerEmail) {
    const emails = await readAllowlist();
    const isAllowed = emails.map((e) => e.toLowerCase()).includes(callerEmail);
    return NextResponse.json({ allowedEmails: isAllowed ? [callerEmail] : [] });
  }

  // Unauthenticated: return empty list
  return NextResponse.json({ allowedEmails: [] });
}

// ── POST /api/admin/allowlist ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const callerEmail = session?.user?.email;
  if (!isAdminEmail(callerEmail)) {
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

  if (isAdminEmail(normalised)) {
    return NextResponse.json(
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
        return NextResponse.json({ error: "Failed to add email." }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("premium_allowlist")
        .delete()
        .eq("email", normalised);
      if (error) {
        console.error("[admin/allowlist] remove error:", error.message);
        return NextResponse.json({ error: "Failed to remove email." }, { status: 500 });
      }
    }

    const emails = await readAllowlist();
    return NextResponse.json({ success: true, allowedEmails: emails });
  } catch (err) {
    console.error("[admin/allowlist] write error:", err);
    return NextResponse.json(
      { error: "Failed to save. Check Supabase configuration." },
      { status: 500 }
    );
  }
}
